namespace EmployeeHub.Api.DTOs;

public record DepartmentDto(
    int Id,
    string Name,
    string Description,
    string SupportEmail,
    int MemberCount,
    int TicketCount,
    DateTime CreatedAtUtc
);

public record CreateDepartmentDto(
    string Name,
    string Description,
    string? SupportEmail = null
);

public record UpdateDepartmentDto(
    string? Name = null,
    string? Description = null,
    string? SupportEmail = null
);
