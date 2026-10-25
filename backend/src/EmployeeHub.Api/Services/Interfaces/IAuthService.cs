using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto?> AuthenticateAsync(LoginRequestDto dto);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task<SendVerificationCodeResponseDto> SendVerificationCodeAsync(string email);
    List<QuickPersonaDto> GetQuickPersonas();
}
