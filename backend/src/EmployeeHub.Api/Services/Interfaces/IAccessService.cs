using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services.Interfaces;

public interface IAccessService
{
    Task<List<EmployeeAccessDto>> GetAccessListAsync();
    Task<EmployeeAccessDto?> UpdateAccessAsync(int employeeId, UpdateAccessRequestDto dto);
}
