using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.Services.Interfaces;

public interface IHolidayService
{
    Task<List<HolidayDto>> GetHolidaysAsync(int? year = null, CountryLocation? country = null);
    Task<HolidayDto?> GetHolidayByIdAsync(int id);
    Task<HolidayDto> CreateHolidayAsync(CreateHolidayDto dto);
    Task<bool> DeleteHolidayAsync(int id);
}
