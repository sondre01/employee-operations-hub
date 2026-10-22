using Malayo.EmployeeHub.Api.Models.Enums;

namespace Malayo.EmployeeHub.Api.Models.Entities;

public class Employee
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string WorkEmail { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.ClientDedicated;
    public UserRole Role { get; set; } = UserRole.Developer;
    
    /// <summary>
    /// Assigned Danish Client name (e.g. "Maersk Logistics", "Kobenhavn Digital A/S").
    /// Null if InternalCore.
    /// </summary>
    public string? ClientName { get; set; }
    
    /// <summary>
    /// Core technologies (e.g. ".NET 8 / React", "TypeScript / Node", "DevOps / Azure").
    /// </summary>
    public string PrimaryTechStack { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<HardwareCustodyItem> HardwareItems { get; set; } = new List<HardwareCustodyItem>();
    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<PolicyAcknowledgement> PolicyAcknowledgements { get; set; } = new List<PolicyAcknowledgement>();
}
