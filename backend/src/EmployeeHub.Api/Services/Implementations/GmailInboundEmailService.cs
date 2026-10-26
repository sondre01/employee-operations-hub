using System.Collections.Concurrent;
using MailKit;
using MailKit.Net.Imap;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class GmailInboundEmailService : BackgroundService, IGmailInboundEmailService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<GmailInboundEmailService> _logger;
    private readonly ConcurrentDictionary<string, bool> _processedMessageIds = new();
    private readonly SemaphoreSlim _syncLock = new(1, 1);

    public GmailInboundEmailService(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<GmailInboundEmailService> logger)
    {
        _scopeFactory = scopeFactory;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Gmail Inbound Email Ingestion Service starting up...");

        // Allow application and database initialization to settle
        await Task.Delay(2000, stoppingToken);

        // Initial Inbox Sync on boot
        try
        {
            await SyncInboxAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Initial Gmail inbox sync failed. Will retry in background loop.");
        }

        // Periodic Polling Loop (Every 15 seconds)
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
                await SyncInboxAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error occurred during periodic Gmail inbox polling. Retrying next cycle.");
            }
        }

        _logger.LogInformation("Gmail Inbound Email Ingestion Service stopped.");
    }

    public async Task<int> SyncInboxAsync(CancellationToken cancellationToken = default)
    {
        if (!await _syncLock.WaitAsync(100, cancellationToken))
        {
            _logger.LogDebug("SyncInboxAsync already in progress. Skipping concurrent run.");
            return 0;
        }

        int ingestedCount = 0;

        try
        {
            var host = _config.GetValue<string>("Email:ImapHost") ?? "imap.gmail.com";
            var port = _config.GetValue<int?>("Email:ImapPort") ?? 993;
            var user = _config.GetValue<string>("Email:ImapUser") 
                       ?? _config.GetValue<string>("Email:SmtpUser") 
                       ?? Environment.GetEnvironmentVariable("EMAIL_SMTP_USER");
            var pass = _config.GetValue<string>("Email:ImapPass") 
                       ?? _config.GetValue<string>("Email:SmtpPass") 
                       ?? Environment.GetEnvironmentVariable("EMAIL_SMTP_PASS");

            if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
            {
                _logger.LogWarning("Gmail IMAP credentials not configured. Inbound polling skipped.");
                return 0;
            }

            using var client = new ImapClient();
            // Connect over SSL port 993
            await client.ConnectAsync(host, port, true, cancellationToken);
            await client.AuthenticateAsync(user, pass, cancellationToken);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly, cancellationToken);

            int totalCount = inbox.Count;
            if (totalCount == 0)
            {
                await client.DisconnectAsync(true, cancellationToken);
                return 0;
            }

            // Inspect the last 50 emails
            int startIndex = Math.Max(0, totalCount - 50);

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ticketService = scope.ServiceProvider.GetRequiredService<ITicketService>();

            var departments = await dbContext.Departments.ToListAsync(cancellationToken);

            for (int i = startIndex; i < totalCount; i++)
            {
                if (cancellationToken.IsCancellationRequested) break;

                MimeMessage message;
                try
                {
                    message = await inbox.GetMessageAsync(i, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to read message at index {Index}", i);
                    continue;
                }

                var msgId = message.MessageId ?? $"{message.Date.UtcTicks}_{message.Subject}";
                if (_processedMessageIds.ContainsKey(msgId))
                {
                    continue;
                }

                // 1. Gather all recipient addresses (To, Cc, Delivered-To, X-Original-To)
                var recipients = new List<string>();
                foreach (var mb in message.To.Mailboxes)
                {
                    recipients.Add(mb.Address.Trim().ToLowerInvariant());
                }
                foreach (var mb in message.Cc.Mailboxes)
                {
                    recipients.Add(mb.Address.Trim().ToLowerInvariant());
                }
                if (message.Headers.Contains("Delivered-To"))
                {
                    var dt = message.Headers["Delivered-To"].Trim().ToLowerInvariant();
                    if (!recipients.Contains(dt)) recipients.Add(dt);
                }
                if (message.Headers.Contains("X-Original-To"))
                {
                    var xot = message.Headers["X-Original-To"].Trim().ToLowerInvariant();
                    if (!recipients.Contains(xot)) recipients.Add(xot);
                }

                // 2. Identify designated department email recipient
                string? designatedEmail = null;
                Department? targetDept = null;

                foreach (var rec in recipients)
                {
                    // Dev Operation
                    if (rec.Contains("desk-devops") || rec.Contains("+devops") || rec.Contains("_devops") ||
                        rec.StartsWith("devops@") || rec.StartsWith("infra@"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("Dev Operation"));
                        break;
                    }

                    // IT Team
                    if (rec.Contains("desk-it") || rec.Contains("+it@") || rec.Contains("+it-") || rec.Contains("_it@") ||
                        rec.StartsWith("it-") || rec.StartsWith("it@") || rec.Contains("tech-support") || rec.Contains("hardware"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("IT Team"));
                        break;
                    }

                    // HR / Recruitment
                    if (rec.Contains("desk-hr") || rec.Contains("+hr@") || rec.Contains("+hr-") || rec.Contains("_hr@") ||
                        rec.StartsWith("hr-") || rec.StartsWith("hr@") || rec.Contains("recruit"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("HR"));
                        break;
                    }

                    // Finance
                    if (rec.Contains("desk-finance") || rec.Contains("+finance@") || rec.Contains("+finance-") || rec.Contains("_finance@") ||
                        rec.StartsWith("finance-") || rec.StartsWith("finance@") || rec.Contains("payroll") || rec.Contains("billing"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("Finance"));
                        break;
                    }

                    // Exact match on Department.SupportEmail
                    var exactMatch = departments.FirstOrDefault(d => 
                        !string.IsNullOrWhiteSpace(d.SupportEmail) && 
                        d.SupportEmail.Trim().Equals(rec, StringComparison.OrdinalIgnoreCase));
                    if (exactMatch != null)
                    {
                        designatedEmail = rec;
                        targetDept = exactMatch;
                        break;
                    }
                }

                // STRICT USER RULE: Only emails sent to designated department emails are turned into tickets.
                // Emails sent directly to personal inbox gamboa.khinandrei@gmail.com are filtered out!
                if (targetDept == null)
                {
                    _processedMessageIds.TryAdd(msgId, true);
                    continue;
                }

                // Filter out automated noise / daemons
                var sender = message.From.Mailboxes.FirstOrDefault();
                if (sender == null)
                {
                    _processedMessageIds.TryAdd(msgId, true);
                    continue;
                }

                var senderEmail = sender.Address.Trim().ToLowerInvariant();
                var senderName = !string.IsNullOrWhiteSpace(sender.Name) ? sender.Name.Trim() : senderEmail;

                if (senderEmail.Contains("mailer-daemon") || 
                    senderEmail.Contains("donotreply") || 
                    senderEmail.Contains("noreply") || 
                    senderEmail.Contains("no-reply") ||
                    senderEmail.Contains("jobalert") ||
                    senderEmail.Contains("linkedin.com") ||
                    senderEmail.Contains("indeed.com"))
                {
                    _processedMessageIds.TryAdd(msgId, true);
                    continue;
                }

                var subject = !string.IsNullOrWhiteSpace(message.Subject) ? message.Subject.Trim() : "(No subject)";
                var body = !string.IsNullOrWhiteSpace(message.TextBody) 
                    ? message.TextBody.Trim() 
                    : (!string.IsNullOrWhiteSpace(message.HtmlBody) ? message.HtmlBody.Trim() : "(No email content)");

                // Check if this specific email was already turned into a ticket in database
                var existingTicket = await dbContext.Tickets.AnyAsync(t => 
                    t.Title == subject &&
                    t.DepartmentId == targetDept.Id &&
                    t.CreatedByEmployee != null && t.CreatedByEmployee.WorkEmail.ToLower() == senderEmail,
                    cancellationToken);

                if (existingTicket)
                {
                    _processedMessageIds.TryAdd(msgId, true);
                    continue;
                }

                // Create the ticket through TicketService
                _logger.LogInformation(
                    "[Gmail Ingestion] Ingesting email from '{From}' to designated '{To}' -> Department: '{Dept}'",
                    senderEmail, designatedEmail, targetDept.Name
                );

                var inboundDto = new InboundEmailTicketDto(
                    senderEmail,
                    designatedEmail!,
                    subject,
                    body,
                    senderName,
                    "Medium"
                );

                var result = await ticketService.ProcessInboundEmailAsync(inboundDto);
                if (result.Success)
                {
                    ingestedCount++;
                    _logger.LogInformation("[Gmail Ingestion] Successfully created Ticket #{Id} for {Dept}", result.Ticket?.Id, targetDept.Name);
                }
                else
                {
                    _logger.LogWarning("[Gmail Ingestion] ProcessInboundEmail rejected: {Msg}", result.Message);
                }

                _processedMessageIds.TryAdd(msgId, true);
            }

            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to complete Gmail inbox sync");
        }
        finally
        {
            _syncLock.Release();
        }

        return ingestedCount;
    }
}
