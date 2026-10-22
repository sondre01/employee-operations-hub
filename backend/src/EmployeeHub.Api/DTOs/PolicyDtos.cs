namespace EmployeeHub.Api.DTOs;

public record PolicyDocumentDto(
    int Id,
    string Title,
    string Version,
    string SummaryMarkdown,
    bool IsMandatory,
    DateTime PublishedAtUtc,
    int TotalAcknowledgements,
    bool IsAcknowledgedByCurrentEmployee,
    DateTime? AcknowledgedAtUtc
);

public record CreatePolicyDto(
    string Title,
    string Version,
    string SummaryMarkdown,
    bool IsMandatory
);

public record AcknowledgePolicyRequest(
    int EmployeeId
);
