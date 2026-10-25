using System.Net;
using System.Net.Mail;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private (string host, int port, string user, string pass, string from) GetSmtpConfig()
    {
        var host = Environment.GetEnvironmentVariable("SMTP_HOST")
            ?? _config.GetValue<string>("Email:SmtpHost")
            ?? "smtp.gmail.com";

        var portStr = Environment.GetEnvironmentVariable("SMTP_PORT")
            ?? _config.GetValue<string>("Email:SmtpPort")
            ?? "587";
        int.TryParse(portStr, out var port);
        if (port <= 0) port = 587;

        var user = Environment.GetEnvironmentVariable("SMTP_USER")
            ?? Environment.GetEnvironmentVariable("GMAIL_USER")
            ?? _config.GetValue<string>("Email:SmtpUser")
            ?? string.Empty;

        var pass = Environment.GetEnvironmentVariable("SMTP_PASS")
            ?? Environment.GetEnvironmentVariable("GMAIL_APP_PASSWORD")
            ?? _config.GetValue<string>("Email:SmtpPass")
            ?? string.Empty;

        var from = Environment.GetEnvironmentVariable("SMTP_FROM")
            ?? _config.GetValue<string>("Email:FromAddress")
            ?? (string.IsNullOrWhiteSpace(user) ? "no-reply@company.io" : user);

        return (host, port, user, pass, from);
    }

    public async Task SendVerificationCodeAsync(string toEmail, string code, string recipientName = "")
    {
        var greeting = string.IsNullOrWhiteSpace(recipientName) ? "Hello" : $"Hello {recipientName}";
        var subject = $"[Employee Hub] Your Verification Code: {code}";
        var bodyHtml = $@"
<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }}
  .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
  .header {{ display: flex; align-items: center; margin-bottom: 24px; }}
  .logo {{ width: 36px; height: 36px; background: #13264c; color: #fff; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; margin-right: 12px; }}
  .title {{ font-size: 18px; font-weight: 700; color: #09090b; }}
  .code-box {{ margin: 28px 0; background: #f4f4f5; border: 2px dashed #13264c; border-radius: 12px; padding: 18px; text-align: center; }}
  .code {{ font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #13264c; }}
  .footer {{ font-size: 12px; color: #71717a; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f4f4f5; padding-top: 16px; }}
</style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <div class='logo'>M</div>
      <div class='title'>Employee Operations Hub</div>
    </div>
    <p style='color: #27272a; font-size: 14px;'>{greeting},</p>
    <p style='color: #52525b; font-size: 14px; line-height: 1.5;'>
      Thank you for registering. Please enter the following 6-digit verification code to confirm your Gmail address and activate your account:
    </p>
    <div class='code-box'>
      <div class='code'>{code}</div>
    </div>
    <p style='color: #71717a; font-size: 12px;'>This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
    <div class='footer'>
      Workforce Operations Platform &bull; Security &amp; Access Control
    </div>
  </div>
</body>
</html>";

        await SendNotificationAsync(toEmail, subject, bodyHtml);
    }

    public async Task SendTicketConfirmationAsync(string toEmail, int ticketId, string ticketTitle, string departmentName)
    {
        var subject = $"[TICKET #{ticketId}] Request Received: {ticketTitle}";
        var bodyHtml = $@"
<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }}
  .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
  .header {{ display: flex; align-items: center; margin-bottom: 20px; }}
  .logo {{ width: 36px; height: 36px; background: #13264c; color: #fff; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; margin-right: 12px; }}
  .badge {{ display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; margin-bottom: 12px; }}
  .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 18px 0; font-size: 13px; color: #334155; }}
</style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <div class='logo'>M</div>
      <div style='font-size: 18px; font-weight: 700; color: #09090b;'>Operations Service Desk</div>
    </div>
    <div class='badge'>Ticket #{ticketId} &bull; {departmentName}</div>
    <h3 style='margin: 0 0 10px 0; color: #0f172a;'>Your support request has been logged</h3>
    <p style='color: #475569; font-size: 14px; line-height: 1.5;'>
      We received your email and have turned it into an operational support ticket assigned to the <strong>{departmentName}</strong> queue.
    </p>
    <div class='info-box'>
      <div><strong>Subject:</strong> {ticketTitle}</div>
      <div style='margin-top: 6px;'><strong>Assigned Department:</strong> {departmentName}</div>
      <div style='margin-top: 6px;'><strong>Status:</strong> Open (Pending Specialist Assignment)</div>
    </div>
    <p style='color: #64748b; font-size: 12px;'>A department specialist will review your request and follow up with you directly.</p>
  </div>
</body>
</html>";

        await SendNotificationAsync(toEmail, subject, bodyHtml);
    }

    public async Task SendNotificationAsync(string toEmail, string subject, string bodyHtml)
    {
        var (host, port, user, pass, from) = GetSmtpConfig();

        if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
        {
            try
            {
                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true,
                    Timeout = 10000
                };

                using var mail = new MailMessage
                {
                    From = new MailAddress(from, "Employee Operations Hub"),
                    Subject = subject,
                    Body = bodyHtml,
                    IsBodyHtml = true
                };

                mail.To.Add(toEmail);

                await client.SendMailAsync(mail);
                _logger.LogInformation("Email sent successfully via Gmail SMTP to: {Email}", toEmail);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send email via SMTP to {Email}. Falling back to simulation log.", toEmail);
            }
        }

        // Dev / Simulation Mode Fallback (Always functional for local testing without Gmail credentials)
        Console.WriteLine("\n\x1b[1m\x1b[36m=============================================================\x1b[0m");
        Console.WriteLine("\x1b[1m\x1b[32m[GMAIL NOTIFICATION DISPATCH]\x1b[0m");
        Console.WriteLine("To:       \x1b[1m\x1b[33m{0}\x1b[0m", toEmail);
        Console.WriteLine("Subject:  \x1b[1m{0}\x1b[0m", subject);
        Console.WriteLine("Status:   \x1b[32mDispatched (Dev Simulation Mode / Ready for Live SMTP)\x1b[0m");
        Console.WriteLine("\x1b[1m\x1b[36m=============================================================\x1b[0m\n");
    }
}
