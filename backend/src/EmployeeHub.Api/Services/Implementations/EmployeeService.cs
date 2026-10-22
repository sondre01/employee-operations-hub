using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Models.Enums;
using EmployeeHub.Api.Services.Common;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _context;

    public EmployeeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmployeeDto>> GetEmployeesAsync(EmploymentType? type = null, UserRole? role = null, string? clientName = null)
    {
        var query = _context.Employees
            .Include(e => e.HardwareItems)
            .AsNoTracking();

        if (type.HasValue)
        {
            query = query.Where(e => e.EmploymentType == type.Value);
        }

        if (role.HasValue)
        {
            query = query.Where(e => e.Role == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(clientName))
        {
            query = query.Where(e => e.ClientName != null && e.ClientName.ToLower().Contains(clientName.ToLower()));
        }

        return await query
            .OrderBy(e => e.FullName)
            .Select(e => new EmployeeDto(
                e.Id,
                e.FullName,
                e.WorkEmail,
                e.JobTitle,
                e.EmploymentType,
                e.Role,
                e.ClientName,
                e.PrimaryTechStack,
                e.IsActive,
                e.CreatedAtUtc,
                e.HardwareItems.Count
            ))
            .ToListAsync();
    }

    public async Task<EmployeeDetailDto?> GetEmployeeByIdAsync(int id)
    {
        var employee = await _context.Employees
            .Include(e => e.HardwareItems)
            .Include(e => e.CreatedTickets)
                .ThenInclude(t => t.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null) return null;

        var hardwareDtos = employee.HardwareItems.Select(h => new HardwareItemDto(
            h.Id,
            h.EmployeeId,
            employee.FullName,
            h.ModelName,
            h.SerialNumber,
            h.AssetTag,
            h.AssignedDate,
            h.ReturnDate,
            h.Status,
            h.Notes
        )).ToList();

        var recentTicketDtos = employee.CreatedTickets
            .OrderByDescending(t => t.CreatedAtUtc)
            .Take(5)
            .Select(t => new TicketDto(
                t.Id,
                t.Title,
                t.Description,
                t.Priority,
                t.DepartmentId,
                t.Department != null ? t.Department.Name : null,
                t.Queue,
                t.Status,
                t.CreatedByEmployeeId,
                employee.FullName,
                t.AssignedToEmployeeId,
                null,
                t.ResolutionNotes,
                t.CreatedAtUtc,
                t.UpdatedAtUtc
            )).ToList();

        return new EmployeeDetailDto(
            employee.Id,
            employee.FullName,
            employee.WorkEmail,
            employee.JobTitle,
            employee.EmploymentType,
            employee.Role,
            employee.ClientName,
            employee.PrimaryTechStack,
            employee.IsActive,
            employee.CreatedAtUtc,
            hardwareDtos,
            recentTicketDtos
        );
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        var employee = new Employee
        {
            FullName = dto.FullName.Trim(),
            WorkEmail = dto.WorkEmail.Trim().ToLower(),
            PasswordHash = PasswordHasher.HashPassword("Password123!"),
            JobTitle = dto.JobTitle.Trim(),
            EmploymentType = dto.EmploymentType,
            Role = dto.Role,
            IsInternal = dto.EmploymentType == EmploymentType.InternalCore,
            ClientName = dto.EmploymentType == EmploymentType.ClientDedicated ? dto.ClientName?.Trim() : null,
            PrimaryTechStack = dto.PrimaryTechStack.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return new EmployeeDto(
            employee.Id,
            employee.FullName,
            employee.WorkEmail,
            employee.JobTitle,
            employee.EmploymentType,
            employee.Role,
            employee.ClientName,
            employee.PrimaryTechStack,
            employee.IsActive,
            employee.CreatedAtUtc,
            0
        );
    }

    public async Task<EmployeeDto?> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto)
    {
        var employee = await _context.Employees.Include(e => e.HardwareItems).FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return null;

        employee.FullName = dto.FullName.Trim();
        employee.WorkEmail = dto.WorkEmail.Trim().ToLower();
        employee.JobTitle = dto.JobTitle.Trim();
        employee.EmploymentType = dto.EmploymentType;
        employee.Role = dto.Role;
        employee.IsInternal = dto.EmploymentType == EmploymentType.InternalCore;
        employee.ClientName = dto.EmploymentType == EmploymentType.ClientDedicated ? dto.ClientName?.Trim() : null;
        employee.PrimaryTechStack = dto.PrimaryTechStack.Trim();
        employee.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return new EmployeeDto(
            employee.Id,
            employee.FullName,
            employee.WorkEmail,
            employee.JobTitle,
            employee.EmploymentType,
            employee.Role,
            employee.ClientName,
            employee.PrimaryTechStack,
            employee.IsActive,
            employee.CreatedAtUtc,
            employee.HardwareItems.Count
        );
    }

    public async Task<bool> DeleteEmployeeAsync(int id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return false;

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<HardwareItemDto>> GetHardwareByEmployeeIdAsync(int employeeId)
    {
        return await _context.HardwareItems
            .Include(h => h.Employee)
            .Where(h => h.EmployeeId == employeeId)
            .AsNoTracking()
            .Select(h => new HardwareItemDto(
                h.Id,
                h.EmployeeId,
                h.Employee != null ? h.Employee.FullName : string.Empty,
                h.ModelName,
                h.SerialNumber,
                h.AssetTag,
                h.AssignedDate,
                h.ReturnDate,
                h.Status,
                h.Notes
            ))
            .ToListAsync();
    }
}
