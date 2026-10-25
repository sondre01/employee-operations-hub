namespace EmployeeHub.Api.Services.Interfaces;

public interface IVerificationService
{
    Task<string> GenerateAndSaveCodeAsync(string email);
    bool VerifyCode(string email, string code);
    string? GetLastCodeForDev(string email);
}
