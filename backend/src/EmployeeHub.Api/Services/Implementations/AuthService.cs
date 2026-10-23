using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Models.Enums;
using EmployeeHub.Api.Services.Common;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AuthResponseDto?> AuthenticateAsync(LoginRequestDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.WorkEmail.ToLower() == email && e.IsActive);

        if (employee == null) return null;

        bool isValid = PasswordHasher.VerifyPassword(dto.Password, employee.PasswordHash);
        if (!isValid) return null;

        return MapToAuthResponse(employee);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        var email = dto.WorkEmail.Trim().ToLowerInvariant();
        var exists = await _context.Employees.AnyAsync(e => e.WorkEmail.ToLower() == email);
        if (exists)
        {
            throw new ArgumentException($"An employee with email '{dto.WorkEmail}' already exists.");
        }

        var firstName = dto.FirstName?.Trim() ?? string.Empty;
        var middleName = dto.MiddleName?.Trim() ?? string.Empty;
        var lastName = dto.LastName?.Trim() ?? string.Empty;
        var fullName = !string.IsNullOrWhiteSpace(dto.FullName)
            ? dto.FullName.Trim()
            : string.Join(" ", new[] { firstName, middleName, lastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        if (string.IsNullOrWhiteSpace(firstName) && !string.IsNullOrWhiteSpace(fullName))
        {
            var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
            {
                firstName = parts[0];
            }
            else if (parts.Length == 2)
            {
                firstName = parts[0];
                lastName = parts[1];
            }
            else if (parts.Length > 2)
            {
                firstName = parts[0];
                middleName = string.Join(" ", parts.Skip(1).Take(parts.Length - 2));
                lastName = parts[^1];
            }
        }

        var employee = new Employee
        {
            FirstName = firstName,
            MiddleName = middleName,
            LastName = lastName,
            FullName = fullName,
            WorkEmail = email,
            PasswordHash = PasswordHasher.HashPassword(dto.Password),
            JobTitle = dto.JobTitle.Trim(),
            // All registered accounts start as normal employees; Super Admin and assigned admins decide department & ticketing access
            IsInternal = false,
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            DepartmentId = null,
            ClientName = dto.ClientName?.Trim(),
            PrimaryTechStack = dto.PrimaryTechStack?.Trim() ?? string.Empty,
            TicketingRole = TicketingRole.None,
            HasTicketingAccess = false,
            CanAssignEmployees = false,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        if (employee.DepartmentId.HasValue)
        {
            await _context.Entry(employee).Reference(e => e.Department).LoadAsync();
        }

        return MapToAuthResponse(employee);
    }

    public List<QuickPersonaDto> GetQuickPersonas()
    {
        return new List<QuickPersonaDto>
        {
            new(
                Key: "superadmin",
                Label: "👑 Super Admin (DevOps Manager)",
                Email: "superadmin@company.io",
                Password: "Password123!",
                RoleDescription: "Manager of Dev Operation. Full Access: Manage all tickets, overall stats, add departments, manage employee access.",
                TicketingRole: TicketingRole.SuperAdmin,
                DepartmentName: "Dev Operation"
            ),
            new(
                Key: "devops",
                Label: "🛠️ DevOps Member (Normal Admin)",
                Email: "devops@company.io",
                Password: "Password123!",
                RoleDescription: "Dev Ops team member. Has access to Dev Team tickets, self stats, and permission to assign newly registered staff.",
                TicketingRole: TicketingRole.DevOpsAdmin,
                DepartmentName: "Dev Operation"
            ),
            new(
                Key: "hrmanager",
                Label: "📋 HR Department Manager",
                Email: "hr.manager@company.io",
                Password: "Password123!",
                RoleDescription: "Department Manager for HR/Recruitment. Manages HR queue (COE, HMO, leaves) and team stats.",
                TicketingRole: TicketingRole.DepartmentManager,
                DepartmentName: "HR/Recruitment"
            ),
            new(
                Key: "itspecialist",
                Label: "💻 IT Team Specialist",
                Email: "it.specialist@company.io",
                Password: "Password123!",
                RoleDescription: "Department Member in IT Team. Resolves hardware custody, VPN, and workstation tickets.",
                TicketingRole: TicketingRole.DepartmentMember,
                DepartmentName: "IT Team"
            ),
            new(
                Key: "finance",
                Label: "💼 Finance Specialist",
                Email: "finance@company.io",
                Password: "Password123!",
                RoleDescription: "Department Member in Finance. Handles payroll, invoices, and statutory deduction inquiries.",
                TicketingRole: TicketingRole.DepartmentMember,
                DepartmentName: "Finance"
            ),
            new(
                Key: "externaldev",
                Label: "👨‍💻 Client Dedicated Dev (External)",
                Email: "dev.arnel@company.io",
                Password: "Password123!",
                RoleDescription: "External developer dedicated to client project. Accesses Employee Portal (Profile & My Tickets).",
                TicketingRole: TicketingRole.None,
                DepartmentName: "Client Dedicated (External)"
            )
        };
    }

    private static AuthResponseDto MapToAuthResponse(Employee e)
    {
        return new AuthResponseDto(
            e.Id,
            e.FullName,
            e.WorkEmail,
            e.JobTitle,
            e.IsInternal,
            e.DepartmentId,
            e.Department?.Name,
            e.TicketingRole,
            e.HasTicketingAccess,
            e.CanAssignEmployees,
            e.ClientName,
            e.PrimaryTechStack,
            e.FirstName,
            e.MiddleName,
            e.LastName
        );
    }
}
