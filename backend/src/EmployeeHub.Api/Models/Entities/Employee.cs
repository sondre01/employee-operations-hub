using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.Models.Entities;

public class Employee
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string WorkEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    
    public bool IsInternal { get; set; } = false;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.ClientDedicated;
    public UserRole Role { get; set; } = UserRole.Developer;

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public TicketingRole TicketingRole { get; set; } = TicketingRole.None;
    public bool HasTicketingAccess { get; set; } = false;
    public bool CanAssignEmployees { get; set; } = false;

    public string? ClientName { get; set; }
    public string PrimaryTechStack { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<HardwareCustodyItem> HardwareItems { get; set; } = new List<HardwareCustodyItem>();
    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<PolicyAcknowledgement> PolicyAcknowledgements { get; set; } = new List<PolicyAcknowledgement>();
}
