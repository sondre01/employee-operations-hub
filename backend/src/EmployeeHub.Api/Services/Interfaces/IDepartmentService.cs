using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services.Interfaces;

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync();
    Task<DepartmentDto?> GetDepartmentByIdAsync(int id);
    Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto);
}
