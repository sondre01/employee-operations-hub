using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Enums;

namespace Malayo.EmployeeHub.Api.Services.Interfaces;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetEmployeesAsync(EmploymentType? type = null, UserRole? role = null, string? clientName = null);
    Task<EmployeeDetailDto?> GetEmployeeByIdAsync(int id);
    Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto);
    Task<EmployeeDto?> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto);
    Task<bool> DeleteEmployeeAsync(int id);
    Task<List<HardwareItemDto>> GetHardwareByEmployeeIdAsync(int employeeId);
}
