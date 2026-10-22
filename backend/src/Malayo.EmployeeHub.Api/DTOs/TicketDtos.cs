using Malayo.EmployeeHub.Api.Models.Enums;

namespace Malayo.EmployeeHub.Api.DTOs;

public record TicketDto(
    int Id,
    string Title,
    string Description,
    TicketQueue Queue,
    TicketStatus Status,
    int CreatedByEmployeeId,
    string CreatedByEmployeeName,
    int? AssignedToEmployeeId,
    string? AssignedToEmployeeName,
    string? ResolutionNotes,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc
);

public record CreateTicketDto(
    int CreatedByEmployeeId,
    TicketQueue Queue,
    string Title,
    string Description
);

public record UpdateTicketStatusDto(
    TicketStatus Status,
    int? AssignedToEmployeeId,
    string? ResolutionNotes
);
