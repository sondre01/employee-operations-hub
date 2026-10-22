using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.DTOs;

public record EmployeeAccessDto(
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
    string? ClientName
);

public record UpdateAccessRequestDto(
    int? DepartmentId,
    bool IsInternal,
    TicketingRole TicketingRole,
    bool HasTicketingAccess,
    bool CanAssignEmployees
);
