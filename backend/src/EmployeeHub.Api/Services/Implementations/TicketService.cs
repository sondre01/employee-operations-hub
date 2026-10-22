using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Models.Enums;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class TicketService : ITicketService
{
    private readonly AppDbContext _context;

    public TicketService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TicketDto>> GetTicketsAsync(
        TicketQueue? queue = null,
        TicketStatus? status = null,
        int? createdByEmployeeId = null,
        int? departmentId = null,
        int? assignedToEmployeeId = null)
    {
        var query = _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .Include(t => t.Department)
            .AsNoTracking();

        if (queue.HasValue)
        {
            query = query.Where(t => t.Queue == queue.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (createdByEmployeeId.HasValue)
        {
            query = query.Where(t => t.CreatedByEmployeeId == createdByEmployeeId.Value);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(t => t.DepartmentId == departmentId.Value);
        }

        if (assignedToEmployeeId.HasValue)
        {
            query = query.Where(t => t.AssignedToEmployeeId == assignedToEmployeeId.Value);
        }

        return await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    public async Task<TicketDto?> GetTicketByIdAsync(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .Include(t => t.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        return ticket != null ? MapToDto(ticket) : null;
    }

    public async Task<TicketDto> CreateTicketAsync(CreateTicketDto dto)
    {
        var creator = await _context.Employees.FindAsync(dto.CreatedByEmployeeId);
        if (creator == null)
        {
            throw new ArgumentException($"Creator employee with ID {dto.CreatedByEmployeeId} was not found.");
        }

        Department? dept = null;
        if (dto.DepartmentId.HasValue)
        {
            dept = await _context.Departments.FindAsync(dto.DepartmentId.Value);
        }

        var ticket = new Ticket
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Medium" : dto.Priority.Trim(),
            DepartmentId = dto.DepartmentId,
            Queue = dto.Queue,
            Status = TicketStatus.Open,
            CreatedByEmployeeId = dto.CreatedByEmployeeId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        ticket.CreatedByEmployee = creator;
        ticket.Department = dept;

        return MapToDto(ticket);
    }

    public async Task<TicketDto?> UpdateTicketStatusAsync(int id, UpdateTicketStatusDto dto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .Include(t => t.Department)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return null;

        ticket.Status = dto.Status;
        ticket.UpdatedAtUtc = DateTime.UtcNow;

        if (dto.AssignedToEmployeeId.HasValue)
        {
            var resolver = await _context.Employees.FindAsync(dto.AssignedToEmployeeId.Value);
            if (resolver != null)
            {
                ticket.AssignedToEmployeeId = dto.AssignedToEmployeeId.Value;
                ticket.AssignedToEmployee = resolver;
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.ResolutionNotes))
        {
            ticket.ResolutionNotes = dto.ResolutionNotes.Trim();
        }

        await _context.SaveChangesAsync();

        return MapToDto(ticket);
    }

    public async Task<TicketDto?> AssignTicketAsync(int id, int assignedToEmployeeId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .Include(t => t.Department)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return null;

        var employee = await _context.Employees.FindAsync(assignedToEmployeeId);
        if (employee == null)
        {
            throw new ArgumentException($"Employee with ID {assignedToEmployeeId} not found.");
        }

        ticket.AssignedToEmployeeId = assignedToEmployeeId;
        ticket.AssignedToEmployee = employee;
        if (ticket.Status == TicketStatus.Open)
        {
            ticket.Status = TicketStatus.InProgress;
        }
        ticket.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(ticket);
    }

    public async Task<TicketStatsSummaryDto> GetTicketStatsAsync(int? callerEmployeeId)
    {
        var allTickets = await _context.Tickets
            .Include(t => t.Department)
            .Include(t => t.AssignedToEmployee)
            .AsNoTracking()
            .ToListAsync();

        var departments = await _context.Departments.AsNoTracking().ToListAsync();

        int total = allTickets.Count;
        int open = allTickets.Count(t => t.Status == TicketStatus.Open);
        int inProgress = allTickets.Count(t => t.Status == TicketStatus.InProgress);
        int resolved = allTickets.Count(t => t.Status == TicketStatus.Resolved);

        var deptStats = departments.Select(d =>
        {
            var deptTickets = allTickets.Where(t => t.DepartmentId == d.Id).ToList();
            return new DepartmentStatDto(
                d.Id,
                d.Name,
                deptTickets.Count,
                deptTickets.Count(t => t.Status == TicketStatus.Open),
                deptTickets.Count(t => t.Status == TicketStatus.InProgress),
                deptTickets.Count(t => t.Status == TicketStatus.Resolved)
            );
        }).ToList();

        var resolverStats = allTickets
            .Where(t => t.AssignedToEmployeeId.HasValue)
            .GroupBy(t => t.AssignedToEmployeeId!.Value)
            .Select(g =>
            {
                var sample = g.First();
                return new ResolverStatDto(
                    g.Key,
                    sample.AssignedToEmployee != null ? sample.AssignedToEmployee.FullName : "Resolver #" + g.Key,
                    sample.Department != null ? sample.Department.Name : "General",
                    g.Count(),
                    g.Count(t => t.Status == TicketStatus.Resolved)
                );
            })
            .OrderByDescending(r => r.AssignedCount)
            .ToList();

        var myStats = new PersonalStatsDto(
            RaisedByMe: callerEmployeeId.HasValue ? allTickets.Count(t => t.CreatedByEmployeeId == callerEmployeeId.Value) : 0,
            AssignedToMe: callerEmployeeId.HasValue ? allTickets.Count(t => t.AssignedToEmployeeId == callerEmployeeId.Value) : 0,
            ResolvedByMe: callerEmployeeId.HasValue ? allTickets.Count(t => t.AssignedToEmployeeId == callerEmployeeId.Value && t.Status == TicketStatus.Resolved) : 0
        );

        return new TicketStatsSummaryDto(total, open, inProgress, resolved, deptStats, resolverStats, myStats);
    }

    public async Task<bool> DeleteTicketAsync(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    private static TicketDto MapToDto(Ticket t)
    {
        return new TicketDto(
            t.Id,
            t.Title,
            t.Description,
            t.Priority,
            t.DepartmentId,
            t.Department?.Name,
            t.Queue,
            t.Status,
            t.CreatedByEmployeeId,
            t.CreatedByEmployee != null ? t.CreatedByEmployee.FullName : "Unknown",
            t.AssignedToEmployeeId,
            t.AssignedToEmployee?.FullName,
            t.ResolutionNotes,
            t.CreatedAtUtc,
            t.UpdatedAtUtc
        );
    }
}
