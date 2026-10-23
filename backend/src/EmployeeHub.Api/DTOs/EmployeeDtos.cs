using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.DTOs;

public record EmployeeDto(
    int Id,
    string FullName,
    string WorkEmail,
    string JobTitle,
    EmploymentType EmploymentType,
    UserRole Role,
    string? ClientName,
    string PrimaryTechStack,
    bool IsActive,
    DateTime CreatedAtUtc,
    int AssignedHardwareCount,
    string FirstName = "",
    string MiddleName = "",
    string LastName = ""
);

public record EmployeeDetailDto(
    int Id,
    string FullName,
    string WorkEmail,
    string JobTitle,
    EmploymentType EmploymentType,
    UserRole Role,
    string? ClientName,
    string PrimaryTechStack,
    bool IsActive,
    DateTime CreatedAtUtc,
    List<HardwareItemDto> HardwareItems,
    List<TicketDto> RecentTickets,
    string FirstName = "",
    string MiddleName = "",
    string LastName = ""
);

public record CreateEmployeeDto(
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? FullName,
    string WorkEmail,
    string JobTitle,
    EmploymentType EmploymentType,
    UserRole Role,
    string? ClientName,
    string? PrimaryTechStack
);

public record UpdateEmployeeDto(
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? FullName,
    string WorkEmail,
    string JobTitle,
    EmploymentType EmploymentType,
    UserRole Role,
    string? ClientName,
    string? PrimaryTechStack,
    bool IsActive
);
