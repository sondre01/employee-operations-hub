using Microsoft.EntityFrameworkCore;
using Malayo.EmployeeHub.Api.Data;
using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Entities;
using Malayo.EmployeeHub.Api.Services.Interfaces;

namespace Malayo.EmployeeHub.Api.Services.Implementations;

public class HardwareService : IHardwareService
{
    private readonly AppDbContext _context;

    public HardwareService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<HardwareItemDto>> GetAllHardwareAsync(int? employeeId = null, string? status = null)
    {
        var query = _context.HardwareItems
            .Include(h => h.Employee)
            .AsNoTracking();

        if (employeeId.HasValue)
        {
            query = query.Where(h => h.EmployeeId == employeeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(h => h.Status.ToLower() == status.ToLower());
        }

        return await query
            .OrderByDescending(h => h.AssignedDate)
            .Select(h => new HardwareItemDto(
                h.Id,
                h.EmployeeId,
                h.Employee != null ? h.Employee.FullName : "Unassigned",
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

    public async Task<HardwareItemDto?> GetHardwareByIdAsync(int id)
    {
        var item = await _context.HardwareItems
            .Include(h => h.Employee)
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == id);

        if (item == null) return null;

        return new HardwareItemDto(
            item.Id,
            item.EmployeeId,
            item.Employee != null ? item.Employee.FullName : "Unassigned",
            item.ModelName,
            item.SerialNumber,
            item.AssetTag,
            item.AssignedDate,
            item.ReturnDate,
            item.Status,
            item.Notes
        );
    }

    public async Task<HardwareItemDto> CreateHardwareAsync(CreateHardwareItemDto dto)
    {
        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
        {
            throw new ArgumentException($"Employee with ID {dto.EmployeeId} does not exist.");
        }

        var hardware = new HardwareCustodyItem
        {
            EmployeeId = dto.EmployeeId,
            ModelName = dto.ModelName.Trim(),
            SerialNumber = dto.SerialNumber.Trim(),
            AssetTag = dto.AssetTag.Trim(),
            AssignedDate = dto.AssignedDate,
            Status = "Active",
            Notes = dto.Notes?.Trim()
        };

        _context.HardwareItems.Add(hardware);
        await _context.SaveChangesAsync();

        return new HardwareItemDto(
            hardware.Id,
            hardware.EmployeeId,
            employee.FullName,
            hardware.ModelName,
            hardware.SerialNumber,
            hardware.AssetTag,
            hardware.AssignedDate,
            hardware.ReturnDate,
            hardware.Status,
            hardware.Notes
        );
    }

    public async Task<HardwareItemDto?> UpdateHardwareAsync(int id, UpdateHardwareItemDto dto)
    {
        var item = await _context.HardwareItems.Include(h => h.Employee).FirstOrDefaultAsync(h => h.Id == id);
        if (item == null) return null;

        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
        {
            throw new ArgumentException($"Employee with ID {dto.EmployeeId} does not exist.");
        }

        item.EmployeeId = dto.EmployeeId;
        item.ModelName = dto.ModelName.Trim();
        item.SerialNumber = dto.SerialNumber.Trim();
        item.AssetTag = dto.AssetTag.Trim();
        item.AssignedDate = dto.AssignedDate;
        item.ReturnDate = dto.ReturnDate;
        item.Status = dto.Status.Trim();
        item.Notes = dto.Notes?.Trim();

        await _context.SaveChangesAsync();

        return new HardwareItemDto(
            item.Id,
            item.EmployeeId,
            employee.FullName,
            item.ModelName,
            item.SerialNumber,
            item.AssetTag,
            item.AssignedDate,
            item.ReturnDate,
            item.Status,
            item.Notes
        );
    }

    public async Task<bool> DeleteHardwareAsync(int id)
    {
        var item = await _context.HardwareItems.FindAsync(id);
        if (item == null) return false;

        _context.HardwareItems.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }
}
