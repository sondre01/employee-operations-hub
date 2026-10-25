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
                d.SupportEmail,
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
            d.SupportEmail,
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

        var supportEmail = !string.IsNullOrWhiteSpace(dto.SupportEmail)
            ? dto.SupportEmail.Trim().ToLowerInvariant()
            : $"{name.ToLowerInvariant().Replace(" ", "-").Replace("/", "-")}@company.io";

        var department = new Department
        {
            Name = name,
            Description = dto.Description.Trim(),
            SupportEmail = supportEmail,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return new DepartmentDto(
            department.Id,
            department.Name,
            department.Description,
            department.SupportEmail,
            0,
            0,
            department.CreatedAtUtc
        );
    }

    public async Task<DepartmentDto?> UpdateDepartmentAsync(int id, UpdateDepartmentDto dto)
    {
        var dept = await _context.Departments
            .Include(d => d.Members)
            .Include(d => d.Tickets)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dept == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            dept.Name = dto.Name.Trim();
        }
        if (dto.Description != null)
        {
            dept.Description = dto.Description.Trim();
        }
        if (!string.IsNullOrWhiteSpace(dto.SupportEmail))
        {
            dept.SupportEmail = dto.SupportEmail.Trim().ToLowerInvariant();
        }

        await _context.SaveChangesAsync();

        return new DepartmentDto(
            dept.Id,
            dept.Name,
            dept.Description,
            dept.SupportEmail,
            dept.Members.Count,
            dept.Tickets.Count,
            dept.CreatedAtUtc
        );
    }
}
