namespace EmployeeHub.Api.DTOs;

public record DepartmentDto(
    int Id,
    string Name,
    string Description,
    int MemberCount,
    int TicketCount,
    DateTime CreatedAtUtc
);

public record CreateDepartmentDto(
    string Name,
    string Description
);
