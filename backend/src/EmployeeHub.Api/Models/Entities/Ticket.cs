using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.Models.Entities;

public class Ticket
{
    public int Id { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public TicketQueue Queue { get; set; } = TicketQueue.ItInfrastructure;
    public TicketStatus Status { get; set; } = TicketStatus.Open;

    public int CreatedByEmployeeId { get; set; }
    public Employee? CreatedByEmployee { get; set; }

    public int? AssignedToEmployeeId { get; set; }
    public Employee? AssignedToEmployee { get; set; }

    public string? ResolutionNotes { get; set; }
    
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
