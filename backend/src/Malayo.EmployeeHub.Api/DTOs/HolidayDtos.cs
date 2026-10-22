using Malayo.EmployeeHub.Api.Models.Enums;

namespace Malayo.EmployeeHub.Api.DTOs;

public record HolidayDto(
    int Id,
    string Title,
    DateOnly HolidayDate,
    CountryLocation Country,
    bool IsWorkingDay,
    string? Notes
);

public record CreateHolidayDto(
    string Title,
    DateOnly HolidayDate,
    CountryLocation Country,
    bool IsWorkingDay,
    string? Notes
);
