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
        int? assignedToEmployeeId = null,
        int? callerEmployeeId = null)
    {
        var query = _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .Include(t => t.Department)
            .AsNoTracking();

        // Enforce Department-Level Isolation for Callers
        if (callerEmployeeId.HasValue)
        {
            var caller = await _context.Employees.FindAsync(callerEmployeeId.Value);
            if (caller != null)
            {
                bool isSuperAdmin = caller.WorkEmail.Trim().Equals("gamboa.khinandrei@gmail.com", StringComparison.OrdinalIgnoreCase) ||
                                    caller.TicketingRole == TicketingRole.SuperAdmin;

                if (!isSuperAdmin)
                {
                    // Regular team members and department managers ONLY receive / view their department's tickets
                    if (caller.DepartmentId.HasValue)
                    {
                        query = query.Where(t => t.DepartmentId == caller.DepartmentId.Value);
                    }
                    else
                    {
                        query = query.Where(t => t.CreatedByEmployeeId == caller.Id || t.AssignedToEmployeeId == caller.Id);
                    }
                }
            }
        }

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

    public async Task<TicketDto?> AssignTicketAsync(int id, int? assignedToEmployeeId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByEmployee)
            .Include(t => t.AssignedToEmployee)
            .Include(t => t.Department)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return null;

        if (!assignedToEmployeeId.HasValue || assignedToEmployeeId.Value <= 0)
        {
            ticket.AssignedToEmployeeId = null;
            ticket.AssignedToEmployee = null;
            ticket.UpdatedAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return MapToDto(ticket);
        }

        var employee = await _context.Employees.FindAsync(assignedToEmployeeId.Value);
        if (employee == null)
        {
            throw new ArgumentException($"Employee with ID {assignedToEmployeeId} not found.");
        }

        ticket.AssignedToEmployeeId = assignedToEmployeeId.Value;
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
                var name = sample.AssignedToEmployee != null ? sample.AssignedToEmployee.FullName : "Resolver #" + g.Key;
                var dept = sample.Department != null ? sample.Department.Name : "General Support";
                int inProg = g.Count(t => t.Status == TicketStatus.InProgress);
                int resCount = g.Count(t => t.Status == TicketStatus.Resolved);
                int totalCount = g.Count();

                return new ResolverStatDto(
                    EmployeeId: g.Key,
                    EmployeeName: name,
                    DepartmentName: dept,
                    AssignedCount: totalCount,
                    ResolvedCount: resCount,
                    InProgress: inProg,
                    Resolved: resCount,
                    Total: totalCount,
                    ResolverId: g.Key,
                    ResolverName: name
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

        // USER SPECIFICATION: Filter out emails sent directly to personal address gamboa.khinandrei@gmail.com
        if (toEmail == "gamboa.khinandrei@gmail.com" || toEmail == "<gamboa.khinandrei@gmail.com>")
        {
            return new InboundEmailResultDto(false, "Filtered out: Email was sent directly to personal address gamboa.khinandrei@gmail.com rather than a designated department desk email.");
        }

        // 1. Resolve Department strictly by designated department email
        var departments = await _context.Departments.ToListAsync();
        Department? matchedDept = null;

        // Check if toEmail matches department SupportEmail directly
        matchedDept = departments.FirstOrDefault(d => 
            !string.IsNullOrWhiteSpace(d.SupportEmail) && 
            (d.SupportEmail.Trim().Equals(toEmail, StringComparison.OrdinalIgnoreCase) ||
             toEmail.Contains(d.SupportEmail.Trim().ToLowerInvariant())));

        if (matchedDept == null && !string.IsNullOrWhiteSpace(toEmail))
        {
            // Dev Operation: gamboa.khinandrei+desk-devops@gmail.com, gamboa.khinandrei+devops@gmail.com, devops@..., infra@...
            if (toEmail.Contains("desk-devops") || toEmail.Contains("+devops") || toEmail.Contains("_devops") ||
                toEmail.StartsWith("devops@") || toEmail.StartsWith("infra@"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("Dev Operation"));
            }
            // IT Team: gamboa.khinandrei+desk-it@gmail.com, gamboa.khinandrei+it@gmail.com, it-support@..., it@...
            else if (toEmail.Contains("desk-it") || toEmail.Contains("+it@") || toEmail.Contains("+it-") || toEmail.Contains("_it@") ||
                     toEmail.StartsWith("it-") || toEmail.StartsWith("it@") || toEmail.Contains("tech-support") || toEmail.Contains("hardware"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("IT Team"));
            }
            // HR / Recruitment: gamboa.khinandrei+desk-hr@gmail.com, gamboa.khinandrei+hr@gmail.com, hr-support@..., hr@...
            else if (toEmail.Contains("desk-hr") || toEmail.Contains("+hr@") || toEmail.Contains("+hr-") || toEmail.Contains("_hr@") ||
                     toEmail.StartsWith("hr-") || toEmail.StartsWith("hr@") || toEmail.Contains("recruit"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("HR"));
            }
            // Finance: gamboa.khinandrei+desk-finance@gmail.com, gamboa.khinandrei+finance@gmail.com, finance-support@...
            else if (toEmail.Contains("desk-finance") || toEmail.Contains("+finance@") || toEmail.Contains("+finance-") || toEmail.Contains("_finance@") ||
                     toEmail.StartsWith("finance-") || toEmail.StartsWith("finance@") || toEmail.Contains("payroll") || toEmail.Contains("billing"))
            {
                matchedDept = departments.FirstOrDefault(d => d.Name.Contains("Finance"));
            }
        }

        // STRICT FILTER: If it does not match ANY designated department email, reject it!
        if (matchedDept == null)
        {
            return new InboundEmailResultDto(false, $"Filtered out: Destination email '{toEmail}' does not match any designated department support email.");
        }

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

        // 4. Create Ticket strictly belonging to this department
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

        // 6. Notify ALL active members and managers of this specific department via email
        try
        {
            var deptMembers = await _context.Employees
                .Where(e => e.DepartmentId == matchedDept.Id && e.IsActive && !string.IsNullOrWhiteSpace(e.WorkEmail))
                .ToListAsync();

            foreach (var staff in deptMembers)
            {
                var isMgr = staff.TicketingRole == TicketingRole.DepartmentManager || 
                            (staff.JobTitle != null && staff.JobTitle.ToLower().Contains("manager"));
                var roleLabel = isMgr ? "Department Manager" : "Team Member";

                await _emailService.SendNotificationAsync(
                    staff.WorkEmail,
                    $"[New {matchedDept.Name} Ticket #{ticket.Id}] {ticket.Title}",
                    $@"<div style='font-family: Arial, sans-serif; color: #1e293b; max-width: 600px;'>
                        <div style='background: #13264C; padding: 16px; border-radius: 8px 8px 0 0; color: white;'>
                            <h2 style='margin:0; font-size: 18px;'>New Inbound Department Ticket #{ticket.Id}</h2>
                            <p style='margin:4px 0 0; font-size: 12px; opacity: 0.9;'>Designated Desk: {matchedDept.Name} ({toEmail})</p>
                        </div>
                        <div style='border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;'>
                            <p>Hello <strong>{staff.FullName}</strong> ({roleLabel}),</p>
                            <p>A new support request has been received by your department's designated email address (<code>{toEmail}</code>).</p>
                            <table style='width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;'>
                                <tr><td style='padding: 6px 0; color: #64748b; width: 120px;'><strong>Requester:</strong></td><td>{employee.FullName} &lt;{employee.WorkEmail}&gt;</td></tr>
                                <tr><td style='padding: 6px 0; color: #64748b;'><strong>Department:</strong></td><td>{matchedDept.Name}</td></tr>
                                <tr><td style='padding: 6px 0; color: #64748b;'><strong>Designated Inbox:</strong></td><td><code>{toEmail}</code></td></tr>
                                <tr><td style='padding: 6px 0; color: #64748b;'><strong>Priority:</strong></td><td>{ticket.Priority}</td></tr>
                                <tr><td style='padding: 6px 0; color: #64748b;'><strong>Subject:</strong></td><td><strong>{ticket.Title}</strong></td></tr>
                            </table>
                            <div style='background: #f8fafc; border-left: 4px solid #13264C; padding: 12px 16px; font-size: 13px; margin: 15px 0; white-space: pre-wrap;'>{System.Net.WebUtility.HtmlEncode(ticket.Description)}</div>
                            <p style='font-size: 12px; color: #64748b;'>Please log in to the Employee Hub Ticketing Desk to view or assign this ticket.</p>
                        </div>
                    </div>"
                );
            }
        }
        catch
        {
            // Non-blocking notification dispatch
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
            t.UpdatedAtUtc,
            t.Department?.SupportEmail ?? string.Empty,
            t.CreatedByEmployee?.WorkEmail ?? string.Empty
        );
    }
}
