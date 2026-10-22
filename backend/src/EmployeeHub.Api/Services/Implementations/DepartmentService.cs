using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;

    public DepartmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync()
    {
        return await _context.Departments
            .Include(d => d.Members)
            .Include(d => d.Tickets)
            .OrderBy(d => d.Id)
            .Select(d => new DepartmentDto(
                d.Id,
                d.Name,
                d.Description,
                d.Members.Count,
                d.Tickets.Count,
                d.CreatedAtUtc
            ))
            .ToListAsync();
    }

    public async Task<DepartmentDto?> GetDepartmentByIdAsync(int id)
    {
        var d = await _context.Departments
            .Include(d => d.Members)
            .Include(d => d.Tickets)
            .FirstOrDefaultAsync(dept => dept.Id == id);

        if (d == null) return null;

        return new DepartmentDto(
            d.Id,
            d.Name,
            d.Description,
            d.Members.Count,
            d.Tickets.Count,
            d.CreatedAtUtc
        );
    }

    public async Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto)
    {
        var name = dto.Name.Trim();
        var exists = await _context.Departments.AnyAsync(d => d.Name.ToLower() == name.ToLower());
        if (exists)
        {
            throw new ArgumentException($"Department '{dto.Name}' already exists.");
        }

        var department = new Department
        {
            Name = name,
            Description = dto.Description.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return new DepartmentDto(
            department.Id,
            department.Name,
            department.Description,
            0,
            0,
            department.CreatedAtUtc
        );
    }
}
