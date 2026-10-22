using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Enums;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class AccessService : IAccessService
{
    private readonly AppDbContext _context;

    public AccessService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmployeeAccessDto>> GetAccessListAsync()
    {
        return await _context.Employees
            .Include(e => e.Department)
            .OrderBy(e => e.Id)
            .Select(e => new EmployeeAccessDto(
                e.Id,
                e.FullName,
                e.WorkEmail,
                e.JobTitle,
                e.IsInternal,
                e.DepartmentId,
                e.Department != null ? e.Department.Name : null,
                e.TicketingRole,
                e.HasTicketingAccess,
                e.CanAssignEmployees,
                e.ClientName
            ))
            .ToListAsync();
    }

    public async Task<EmployeeAccessDto?> UpdateAccessAsync(int employeeId, UpdateAccessRequestDto dto)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee == null) return null;

        employee.DepartmentId = dto.DepartmentId;
        employee.IsInternal = dto.IsInternal;
        employee.TicketingRole = dto.TicketingRole;
        
        if (dto.TicketingRole is TicketingRole.SuperAdmin or TicketingRole.DevOpsAdmin)
        {
            employee.HasTicketingAccess = true;
        }
        else
        {
            employee.HasTicketingAccess = dto.HasTicketingAccess;
        }

        employee.CanAssignEmployees = dto.CanAssignEmployees;

        await _context.SaveChangesAsync();

        if (employee.DepartmentId.HasValue)
        {
            await _context.Entry(employee).Reference(e => e.Department).LoadAsync();
        }

        return new EmployeeAccessDto(
            employee.Id,
            employee.FullName,
            employee.WorkEmail,
            employee.JobTitle,
            employee.IsInternal,
            employee.DepartmentId,
            employee.Department?.Name,
            employee.TicketingRole,
            employee.HasTicketingAccess,
            employee.CanAssignEmployees,
            employee.ClientName
        );
    }
}
