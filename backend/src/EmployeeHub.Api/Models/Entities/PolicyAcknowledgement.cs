namespace EmployeeHub.Api.Models.Entities;

public class PolicyAcknowledgement
{
    public int Id { get; set; }
    
    public int PolicyDocumentId { get; set; }
    public PolicyDocument? PolicyDocument { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime AcknowledgedAtUtc { get; set; } = DateTime.UtcNow;
}
