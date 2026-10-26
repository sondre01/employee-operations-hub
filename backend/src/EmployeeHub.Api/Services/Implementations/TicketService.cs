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
    private readonly IEmailService _emailService;

    public TicketService(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
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

        // Enforce department co-member constraint
        if (ticket.DepartmentId.HasValue && employee.DepartmentId.HasValue && employee.DepartmentId.Value != ticket.DepartmentId.Value)
        {
            throw new ArgumentException($"Employee '{employee.FullName}' belongs to a different department and cannot be assigned to this {ticket.Department?.Name ?? "department"} ticket.");
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

    public async Task<InboundEmailResultDto> ProcessInboundEmailAsync(InboundEmailTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FromEmail) || string.IsNullOrWhiteSpace(dto.Subject))
        {
            return new InboundEmailResultDto(false, "FromEmail and Subject are required.");
        }

        var fromEmail = dto.FromEmail.Trim().ToLowerInvariant();
        var toEmail = dto.ToEmail?.Trim().ToLowerInvariant() ?? string.Empty;

        // 1. Resolve Department by SupportEmail or designated email alias
        var departments = await _context.Departments.ToListAsync();
        var matchedDept = departments.FirstOrDefault(d => 
            !string.IsNullOrWhiteSpace(d.SupportEmail) && d.SupportEmail.ToLowerInvariant() == toEmail);

        if (matchedDept == null && !string.IsNullOrWhiteSpace(toEmail))
        {
            var alias = string.Empty;
            var localPart = toEmail.Contains('@') ? toEmail.Split('@')[0] : toEmail;
            if (localPart.Contains('_'))
            {
                alias = localPart.Split('_')[^1].ToLowerInvariant();
            }
            else if (localPart.Contains('+'))
            {
                alias = localPart.Split('+')[^1].ToLowerInvariant();
            }

            if (alias == "devops" || alias == "infra" || toEmail.Contains("devops") || toEmail.Contains("infra") || toEmail.Contains("cloud"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("Dev Operation"));
            }
            else if (alias == "it" || alias == "tech" || alias == "support" || toEmail.Contains("_it@") || toEmail.Contains("+it@") || toEmail.StartsWith("it-") || toEmail.Contains("hardware"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("IT Team"));
            }
            else if (alias == "hr" || alias == "people" || toEmail.Contains("_hr@") || toEmail.Contains("+hr@") || toEmail.StartsWith("hr-") || toEmail.Contains("recruit"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("HR"));
            }
            else if (alias == "finance" || alias == "billing" || toEmail.Contains("_finance@") || toEmail.Contains("+finance@") || toEmail.StartsWith("finance-") || toEmail.Contains("payroll"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("Finance"));
            }
        }

        matchedDept ??= departments.FirstOrDefault() ?? new Department { Name = "General Support" };

        // 2. Find or register sender Employee
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.WorkEmail.ToLower() == fromEmail);
        if (employee == null)
        {
            var senderName = !string.IsNullOrWhiteSpace(dto.SenderName)
                ? dto.SenderName.Trim()
                : fromEmail.Split('@')[0].Replace('.', ' ').Replace('_', ' ');

            employee = new Employee
            {
                FullName = senderName,
                WorkEmail = fromEmail,
                JobTitle = "Inbound Email Requester",
                EmploymentType = EmploymentType.ClientDedicated,
                Role = UserRole.Developer,
                PasswordHash = string.Empty,
                IsInternal = false,
                IsActive = true,
                PrimaryTechStack = "Email Integration",
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
        }

        // 3. Queue selection
        var queue = (matchedDept.Name.Contains("HR") || matchedDept.Name.Contains("Finance"))
            ? TicketQueue.HrLegal
            : TicketQueue.ItInfrastructure;

        // 4. Create Ticket
        var priority = !string.IsNullOrWhiteSpace(dto.Priority) ? dto.Priority.Trim() : "Medium";
        var ticket = new Ticket
        {
            Title = dto.Subject.Trim(),
            Description = !string.IsNullOrWhiteSpace(dto.Body) ? dto.Body.Trim() : "(No email body content provided)",
            Priority = priority,
            DepartmentId = matchedDept.Id > 0 ? matchedDept.Id : null,
            Queue = queue,
            Status = TicketStatus.Open,
            CreatedByEmployeeId = employee.Id,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        ticket.CreatedByEmployee = employee;
        ticket.Department = matchedDept;

        // 5. Send automated confirmation email back to sender
        try
        {
            await _emailService.SendTicketConfirmationAsync(
                employee.WorkEmail,
                ticket.Id,
                ticket.Title,
                matchedDept.Name
            );
        }
        catch
        {
            // Non-blocking confirmation
        }

        return new InboundEmailResultDto(
            true,
            $"Ticket #{ticket.Id} created successfully for {matchedDept.Name}.",
            MapToDto(ticket)
        );
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
