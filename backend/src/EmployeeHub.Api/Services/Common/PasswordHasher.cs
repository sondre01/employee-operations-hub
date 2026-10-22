using System.Security.Cryptography;

namespace EmployeeHub.Api.Services.Common;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword)) return false;

        var parts = hashedPassword.Split(':');
        if (parts.Length != 2) return false;

        byte[] salt = Convert.FromBase64String(parts[0]);
        byte[] hash = Convert.FromBase64String(parts[1]);

        byte[] testHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return CryptographicOperations.FixedTimeEquals(hash, testHash);
    }
}
