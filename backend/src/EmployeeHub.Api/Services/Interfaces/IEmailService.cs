namespace EmployeeHub.Api.Services.Interfaces;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string code, string recipientName = "");
    Task SendTicketConfirmationAsync(string toEmail, int ticketId, string ticketTitle, string departmentName);
    Task SendNotificationAsync(string toEmail, string subject, string bodyHtml);
}
