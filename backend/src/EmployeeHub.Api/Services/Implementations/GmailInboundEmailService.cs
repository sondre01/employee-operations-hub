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

public class InboundMailboxConfig
{
    public string? DepartmentName { get; set; }
    public string? SupportEmail { get; set; }
    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUser { get; set; }
    public string? ImapPass { get; set; }
    public string? ImapFolder { get; set; }
}

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

        int totalIngested = 0;

        try
        {
            // Build list of mailboxes to poll:
            // 1) From Email:InboundMailboxes configuration list
            // 2) Or fallback to default Email:ImapUser / Email:SmtpUser
            var mailboxes = new List<InboundMailboxConfig>();
            var configuredList = _config.GetSection("Email:InboundMailboxes").Get<List<InboundMailboxConfig>>();
            if (configuredList != null && configuredList.Count > 0)
            {
                mailboxes.AddRange(configuredList.Where(m => !string.IsNullOrWhiteSpace(m.ImapUser) && !string.IsNullOrWhiteSpace(m.ImapPass)));
            }

            // Fallback default single mailbox
            var defaultUser = _config.GetValue<string>("Email:ImapUser") 
                              ?? _config.GetValue<string>("Email:SmtpUser") 
                              ?? Environment.GetEnvironmentVariable("EMAIL_SMTP_USER");
            var defaultPass = _config.GetValue<string>("Email:ImapPass") 
                              ?? _config.GetValue<string>("Email:SmtpPass") 
                              ?? Environment.GetEnvironmentVariable("EMAIL_SMTP_PASS");

            if (mailboxes.Count == 0 && !string.IsNullOrWhiteSpace(defaultUser) && !string.IsNullOrWhiteSpace(defaultPass))
            {
                mailboxes.Add(new InboundMailboxConfig
                {
                    ImapHost = _config.GetValue<string>("Email:ImapHost") ?? "imap.gmail.com",
                    ImapPort = _config.GetValue<int?>("Email:ImapPort") ?? 993,
                    ImapUser = defaultUser,
                    ImapPass = defaultPass,
                    ImapFolder = _config.GetValue<string>("Email:ImapFolder") ?? "INBOX"
                });
            }

            if (mailboxes.Count == 0)
            {
                _logger.LogDebug("Gmail IMAP credentials not configured. Inbound polling skipped.");
                return 0;
            }

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ticketService = scope.ServiceProvider.GetRequiredService<ITicketService>();
            var departments = await dbContext.Departments.ToListAsync(cancellationToken);

            foreach (var mbox in mailboxes)
            {
                if (cancellationToken.IsCancellationRequested) break;

                try
                {
                    totalIngested += await PollSingleMailboxAsync(mbox, departments, dbContext, ticketService, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to poll mailbox '{User}'", mbox.ImapUser);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to complete Gmail inbox sync");
        }
        finally
        {
            _syncLock.Release();
        }

        return totalIngested;
    }

    private async Task<int> PollSingleMailboxAsync(
        InboundMailboxConfig mbox,
        List<Department> departments,
        AppDbContext dbContext,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        int count = 0;
        using var client = new ImapClient();
        var host = !string.IsNullOrWhiteSpace(mbox.ImapHost) ? mbox.ImapHost : "imap.gmail.com";
        var port = mbox.ImapPort ?? 993;

        if (string.IsNullOrWhiteSpace(mbox.ImapUser) || string.IsNullOrWhiteSpace(mbox.ImapPass))
        {
            return 0;
        }

        await client.ConnectAsync(host, port, true, cancellationToken);
        await client.AuthenticateAsync(mbox.ImapUser, mbox.ImapPass, cancellationToken);

        // Determine which folders to scan: specified folder or default to INBOX
        var targetFolderName = !string.IsNullOrWhiteSpace(mbox.ImapFolder) ? mbox.ImapFolder : "INBOX";
        IMailFolder? folder = null;

        if (targetFolderName.Equals("INBOX", StringComparison.OrdinalIgnoreCase))
        {
            folder = client.Inbox;
        }
        else
        {
            try
            {
                folder = await client.GetFolderAsync(targetFolderName, cancellationToken);
            }
            catch
            {
                folder = client.Inbox;
            }
        }

        folder ??= client.Inbox;
        await folder.OpenAsync(FolderAccess.ReadWrite, cancellationToken);

        int totalCount = folder.Count;
        if (totalCount == 0)
        {
            await client.DisconnectAsync(true, cancellationToken);
            return 0;
        }

        // Inspect the last 50 emails in this folder
        int startIndex = Math.Max(0, totalCount - 50);

        for (int i = startIndex; i < totalCount; i++)
        {
            if (cancellationToken.IsCancellationRequested) break;

            MimeMessage message;
            try
            {
                message = await folder.GetMessageAsync(i, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read message at index {Index} in {Folder}", i, folder.FullName);
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
                var dt = message.Headers["Delivered-To"]?.Trim().ToLowerInvariant();
                if (!string.IsNullOrEmpty(dt) && !recipients.Contains(dt)) recipients.Add(dt);
            }
            if (message.Headers.Contains("X-Original-To"))
            {
                var xot = message.Headers["X-Original-To"]?.Trim().ToLowerInvariant();
                if (!string.IsNullOrEmpty(xot) && !recipients.Contains(xot)) recipients.Add(xot);
            }

            // 2. Resolve target department
            string? designatedEmail = null;
            Department? targetDept = null;

            // A) If mailbox is explicitly assigned to a specific department
            if (!string.IsNullOrWhiteSpace(mbox.DepartmentName))
            {
                targetDept = departments.FirstOrDefault(d => d.Name.Equals(mbox.DepartmentName, StringComparison.OrdinalIgnoreCase) ||
                                                             d.Name.Contains(mbox.DepartmentName, StringComparison.OrdinalIgnoreCase));
                designatedEmail = mbox.SupportEmail ?? mbox.ImapUser;
            }

            // B) Exact match against any Department.SupportEmail
            if (targetDept == null)
            {
                foreach (var rec in recipients)
                {
                    var exact = departments.FirstOrDefault(d =>
                        !string.IsNullOrWhiteSpace(d.SupportEmail) &&
                        (d.SupportEmail.Trim().Equals(rec, StringComparison.OrdinalIgnoreCase) ||
                         rec.Contains(d.SupportEmail.Trim().ToLowerInvariant()) ||
                         d.SupportEmail.Trim().ToLowerInvariant().Contains(rec)));

                    if (exact != null)
                    {
                        targetDept = exact;
                        designatedEmail = rec;
                        break;
                    }
                }
            }

            // C) Keyword match on recipient address
            if (targetDept == null)
            {
                foreach (var rec in recipients)
                {
                    // Dev Operation
                    if (rec.Contains("devops") || rec.Contains("infra") || rec.Contains("cloud") || rec.Contains("desk-devops"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("Dev Operation"));
                        if (targetDept != null) break;
                    }

                    // IT Team
                    if (rec.Contains("it") || rec.Contains("tech") || rec.Contains("hardware") || rec.Contains("desk-it"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("IT Team"));
                        if (targetDept != null) break;
                    }

                    // HR / Recruitment
                    if (rec.Contains("hr") || rec.Contains("recruit") || rec.Contains("people") || rec.Contains("desk-hr"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("HR"));
                        if (targetDept != null) break;
                    }

                    // Finance
                    if (rec.Contains("finance") || rec.Contains("payroll") || rec.Contains("billing") || rec.Contains("tax") || rec.Contains("desk-finance"))
                    {
                        designatedEmail = rec;
                        targetDept = departments.FirstOrDefault(d => d.Name.Contains("Finance"));
                        if (targetDept != null) break;
                    }
                }
            }

            // Filter out emails that don't belong to any department
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

            // Check if this specific email was already converted to a ticket in DB
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

            _logger.LogInformation(
                "[Gmail Ingestion] Ingesting email from '{From}' to '{To}' -> Department: '{Dept}'",
                senderEmail, designatedEmail, targetDept.Name
            );

            var inboundDto = new InboundEmailTicketDto(
                senderEmail,
                designatedEmail ?? targetDept.SupportEmail,
                subject,
                body,
                senderName,
                "Medium"
            );

            var result = await ticketService.ProcessInboundEmailAsync(inboundDto);
            if (result.Success)
            {
                count++;
                _logger.LogInformation("[Gmail Ingestion] Successfully created Ticket #{Id} for {Dept}", result.Ticket?.Id, targetDept.Name);

                // Mark as Seen in Gmail so it's acknowledged
                try
                {
                    await folder.AddFlagsAsync(i, MessageFlags.Seen, true, cancellationToken);
                }
                catch { }
            }
            else
            {
                _logger.LogWarning("[Gmail Ingestion] ProcessInboundEmail rejected: {Msg}", result.Message);
            }

            _processedMessageIds.TryAdd(msgId, true);
        }

        await client.DisconnectAsync(true, cancellationToken);
        return count;
    }
}
