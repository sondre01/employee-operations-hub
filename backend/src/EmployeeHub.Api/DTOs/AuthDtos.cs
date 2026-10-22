using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.DTOs;

public record LoginRequestDto(
    string Email,
    string Password
);

public record RegisterRequestDto(
    string FullName,
    string WorkEmail,
    string Password,
    string JobTitle,
    bool IsInternal,
    int? DepartmentId,
    string? ClientName,
    string? PrimaryTechStack
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
    string PrimaryTechStack
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
