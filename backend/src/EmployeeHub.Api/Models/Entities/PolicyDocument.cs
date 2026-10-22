namespace EmployeeHub.Api.Models.Entities;

public class PolicyDocument
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0";
    public string SummaryMarkdown { get; set; } = string.Empty;
    public bool IsMandatory { get; set; } = true;
    public DateTime PublishedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<PolicyAcknowledgement> Acknowledgements { get; set; } = new List<PolicyAcknowledgement>();
}
