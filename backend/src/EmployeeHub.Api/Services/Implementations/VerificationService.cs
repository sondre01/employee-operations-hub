using System.Collections.Concurrent;
using System.Security.Cryptography;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class VerificationService : IVerificationService
{
    private record VerificationEntry(string Code, DateTime ExpiresAtUtc);

    // Key: Lowercase email address
    private static readonly ConcurrentDictionary<string, VerificationEntry> _activeCodes = new();

    public Task<string> GenerateAndSaveCodeAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        // Generate 6-digit random code
        var codeNumber = RandomNumberGenerator.GetInt32(100000, 1000000);
        var code = codeNumber.ToString();

        // 10 minute expiry
        var entry = new VerificationEntry(code, DateTime.UtcNow.AddMinutes(10));
        _activeCodes[normalizedEmail] = entry;

        return Task.FromResult(code);
    }

    public bool VerifyCode(string email, string code)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (_activeCodes.TryGetValue(normalizedEmail, out var entry))
        {
            if (DateTime.UtcNow > entry.ExpiresAtUtc)
            {
                _activeCodes.TryRemove(normalizedEmail, out _);
                return false;
            }

            if (string.Equals(entry.Code.Trim(), code.Trim(), StringComparison.Ordinal))
            {
                // Code matches, consume it
                _activeCodes.TryRemove(normalizedEmail, out _);
                return true;
            }
        }

        return false;
    }

    public string? GetLastCodeForDev(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (_activeCodes.TryGetValue(normalizedEmail, out var entry))
        {
            if (DateTime.UtcNow <= entry.ExpiresAtUtc)
            {
                return entry.Code;
            }
        }
        return null;
    }
}
