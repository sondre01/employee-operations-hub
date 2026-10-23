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
                e.HardwareItems.Count,
                e.FirstName,
                e.MiddleName,
                e.LastName
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
            recentTicketDtos,
            employee.FirstName,
            employee.MiddleName,
            employee.LastName
        );
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        var firstName = dto.FirstName?.Trim() ?? string.Empty;
        var middleName = dto.MiddleName?.Trim() ?? string.Empty;
        var lastName = dto.LastName?.Trim() ?? string.Empty;
        var fullName = !string.IsNullOrWhiteSpace(dto.FullName)
            ? dto.FullName.Trim()
            : string.Join(" ", new[] { firstName, middleName, lastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        if (string.IsNullOrWhiteSpace(firstName) && !string.IsNullOrWhiteSpace(fullName))
        {
            var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1) { firstName = parts[0]; }
            else if (parts.Length == 2) { firstName = parts[0]; lastName = parts[1]; }
            else if (parts.Length > 2) { firstName = parts[0]; middleName = string.Join(" ", parts.Skip(1).Take(parts.Length - 2)); lastName = parts[^1]; }
        }

        var employee = new Employee
        {
            FirstName = firstName,
            MiddleName = middleName,
            LastName = lastName,
            FullName = fullName,
            WorkEmail = dto.WorkEmail.Trim().ToLower(),
            PasswordHash = PasswordHasher.HashPassword("Password123!"),
            JobTitle = dto.JobTitle.Trim(),
            EmploymentType = dto.EmploymentType,
            Role = dto.Role,
            IsInternal = dto.EmploymentType == EmploymentType.InternalCore,
            ClientName = dto.EmploymentType == EmploymentType.ClientDedicated ? dto.ClientName?.Trim() : null,
            PrimaryTechStack = dto.PrimaryTechStack?.Trim() ?? string.Empty,
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
            0,
            employee.FirstName,
            employee.MiddleName,
            employee.LastName
        );
    }

    public async Task<EmployeeDto?> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto)
    {
        var employee = await _context.Employees.Include(e => e.HardwareItems).FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return null;

        var firstName = dto.FirstName?.Trim() ?? employee.FirstName;
        var middleName = dto.MiddleName?.Trim() ?? employee.MiddleName;
        var lastName = dto.LastName?.Trim() ?? employee.LastName;
        var fullName = !string.IsNullOrWhiteSpace(dto.FullName)
            ? dto.FullName.Trim()
            : string.Join(" ", new[] { firstName, middleName, lastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        employee.FirstName = firstName;
        employee.MiddleName = middleName;
        employee.LastName = lastName;
        employee.FullName = fullName;
        employee.WorkEmail = dto.WorkEmail.Trim().ToLower();
        employee.JobTitle = dto.JobTitle.Trim();
        employee.EmploymentType = dto.EmploymentType;
        employee.Role = dto.Role;
        employee.IsInternal = dto.EmploymentType == EmploymentType.InternalCore;
        employee.ClientName = dto.EmploymentType == EmploymentType.ClientDedicated ? dto.ClientName?.Trim() : null;
        employee.PrimaryTechStack = dto.PrimaryTechStack?.Trim() ?? string.Empty;
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
            employee.HardwareItems.Count,
            employee.FirstName,
            employee.MiddleName,
            employee.LastName
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
