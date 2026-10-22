namespace EmployeeHub.Api.Models.Entities;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Employee> Members { get; set; } = new List<Employee>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
