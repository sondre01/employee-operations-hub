namespace Malayo.EmployeeHub.Api.DTOs;

public record HardwareItemDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string ModelName,
    string SerialNumber,
    string AssetTag,
    DateOnly AssignedDate,
    DateOnly? ReturnDate,
    string Status,
    string? Notes
);

public record CreateHardwareItemDto(
    int EmployeeId,
    string ModelName,
    string SerialNumber,
    string AssetTag,
    DateOnly AssignedDate,
    string? Notes
);

public record UpdateHardwareItemDto(
    int EmployeeId,
    string ModelName,
    string SerialNumber,
    string AssetTag,
    DateOnly AssignedDate,
    DateOnly? ReturnDate,
    string Status,
    string? Notes
);
