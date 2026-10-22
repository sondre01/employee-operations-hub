using Microsoft.EntityFrameworkCore;
using Malayo.EmployeeHub.Api.Data;
using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Entities;
using Malayo.EmployeeHub.Api.Models.Enums;
using Malayo.EmployeeHub.Api.Services.Interfaces;

namespace Malayo.EmployeeHub.Api.Services.Implementations;

public class TicketService : ITicketService
{
    private readonly AppDbContext _context;

    public TicketService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TicketDto>> GetTicketsAsync(TicketQueue? queue = null, TicketStatus? status = null, int? createdByEmployeeId = null)
    {
        var query = _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
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

        return await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => new TicketDto(
                t.Id,
                t.Title,
                t.Description,
                t.Queue,
                t.Status,
                t.CreatedByEmployeeId,
                t.CreatedByEmployee != null ? t.CreatedByEmployee.FullName : "Unknown",
                t.AssignedToEmployeeId,
                t.AssignedToEmployee != null ? t.AssignedToEmployee.FullName : null,
                t.ResolutionNotes,
                t.CreatedAtUtc,
                t.UpdatedAtUtc
            ))
            .ToListAsync();
    }

    public async Task<TicketDto?> GetTicketByIdAsync(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return null;

        return new TicketDto(
            ticket.Id,
            ticket.Title,
            ticket.Description,
            ticket.Queue,
            ticket.Status,
            ticket.CreatedByEmployeeId,
            ticket.CreatedByEmployee != null ? ticket.CreatedByEmployee.FullName : "Unknown",
            ticket.AssignedToEmployeeId,
            ticket.AssignedToEmployee != null ? ticket.AssignedToEmployee.FullName : null,
            ticket.ResolutionNotes,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc
        );
    }

    public async Task<TicketDto> CreateTicketAsync(CreateTicketDto dto)
    {
        var creator = await _context.Employees.FindAsync(dto.CreatedByEmployeeId);
        if (creator == null)
        {
            throw new ArgumentException($"Creator employee with ID {dto.CreatedByEmployeeId} was not found.");
        }

        var ticket = new Ticket
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            Queue = dto.Queue,
            Status = TicketStatus.Open,
            CreatedByEmployeeId = dto.CreatedByEmployeeId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return new TicketDto(
            ticket.Id,
            ticket.Title,
            ticket.Description,
            ticket.Queue,
            ticket.Status,
            ticket.CreatedByEmployeeId,
            creator.FullName,
            null,
            null,
            null,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc
        );
    }

    public async Task<TicketDto?> UpdateTicketStatusAsync(int id, UpdateTicketStatusDto dto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
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

        return new TicketDto(
            ticket.Id,
            ticket.Title,
            ticket.Description,
            ticket.Queue,
            ticket.Status,
            ticket.CreatedByEmployeeId,
            ticket.CreatedByEmployee != null ? ticket.CreatedByEmployee.FullName : "Unknown",
            ticket.AssignedToEmployeeId,
            ticket.AssignedToEmployee != null ? ticket.AssignedToEmployee.FullName : null,
            ticket.ResolutionNotes,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc
        );
    }

    public async Task<bool> DeleteTicketAsync(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }
}
