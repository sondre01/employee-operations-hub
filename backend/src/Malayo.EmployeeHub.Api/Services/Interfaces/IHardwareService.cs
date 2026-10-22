using Malayo.EmployeeHub.Api.DTOs;

namespace Malayo.EmployeeHub.Api.Services.Interfaces;

public interface IHardwareService
{
    Task<List<HardwareItemDto>> GetAllHardwareAsync(int? employeeId = null, string? status = null);
    Task<HardwareItemDto?> GetHardwareByIdAsync(int id);
    Task<HardwareItemDto> CreateHardwareAsync(CreateHardwareItemDto dto);
    Task<HardwareItemDto?> UpdateHardwareAsync(int id, UpdateHardwareItemDto dto);
    Task<bool> DeleteHardwareAsync(int id);
}
