using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.DTOs;

public record TicketDto(
    int Id,
    string Title,
    string Description,
    string Priority,
    int? DepartmentId,
    string? DepartmentName,
    TicketQueue Queue,
    TicketStatus Status,
    int CreatedByEmployeeId,
    string CreatedByEmployeeName,
    int? AssignedToEmployeeId,
    string? AssignedToEmployeeName,
    string? ResolutionNotes,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    string? DepartmentSupportEmail = null,
    string? CreatedByEmployeeEmail = null
);

public record CreateTicketDto(
    int CreatedByEmployeeId,
    int? DepartmentId,
    string? Priority,
    TicketQueue Queue,
    string Title,
    string Description
);

public record UpdateTicketStatusDto(
    TicketStatus Status,
    int? AssignedToEmployeeId,
    string? ResolutionNotes
);

public record AssignTicketDto(
    int? AssignedToEmployeeId
);

public record InboundEmailTicketDto(
    string FromEmail,
    string ToEmail,
    string Subject,
    string Body,
    string? SenderName = null,
    string? Priority = "Medium"
);

public record InboundEmailResultDto(
    bool Success,
    string Message,
    TicketDto? Ticket = null
);
