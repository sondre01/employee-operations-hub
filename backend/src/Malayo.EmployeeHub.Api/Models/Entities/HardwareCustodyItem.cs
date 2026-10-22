namespace Malayo.EmployeeHub.Api.Models.Entities;

public class HardwareCustodyItem
{
    public int Id { get; set; }
    
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public string ModelName { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    
    public DateOnly AssignedDate { get; set; }
    public DateOnly? ReturnDate { get; set; }
    
    public string Status { get; set; } = "Active"; // Active, InRepair, Returned
    public string? Notes { get; set; }
}
