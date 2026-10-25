using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.DTOs;

public record LoginRequestDto(
    string Email,
    string Password
);

public record SendVerificationCodeRequestDto(
    string Email
);

public record SendVerificationCodeResponseDto(
    bool Success,
    string Message
);

public record RegisterRequestDto(
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? FullName,
    string WorkEmail,
    string Password,
    string JobTitle,
    string? VerificationCode = null,
    bool IsInternal = false,
    int? DepartmentId = null,
    string? ClientName = null,
    string? PrimaryTechStack = null
);

public record AuthResponseDto(
    int Id,
    string FullName,
    string WorkEmail,
    string JobTitle,
    bool IsInternal,
    int? DepartmentId,
    string? DepartmentName,
    TicketingRole TicketingRole,
    bool HasTicketingAccess,
    bool CanAssignEmployees,
    string? ClientName,
    string PrimaryTechStack,
    string FirstName = "",
    string MiddleName = "",
    string LastName = ""
);

public record QuickPersonaDto(
    string Key,
    string Label,
    string Email,
    string Password,
    string RoleDescription,
    TicketingRole TicketingRole,
    string DepartmentName
);
