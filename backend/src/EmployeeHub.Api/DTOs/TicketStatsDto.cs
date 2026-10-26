namespace EmployeeHub.Api.DTOs;

public record DepartmentStatDto(
    int DepartmentId,
    string DepartmentName,
    int Total,
    int Open,
    int InProgress,
    int Resolved
);

public record ResolverStatDto(
    int EmployeeId,
    string EmployeeName,
    string DepartmentName,
    int AssignedCount,
    int ResolvedCount,
    int InProgress = 0,
    int Resolved = 0,
    int Total = 0,
    int? ResolverId = null,
    string? ResolverName = null
);

public record PersonalStatsDto(
    int RaisedByMe,
    int AssignedToMe,
    int ResolvedByMe
);

public record TicketStatsSummaryDto(
    int TotalTickets,
    int OpenTickets,
    int InProgressTickets,
    int ResolvedTickets,
    List<DepartmentStatDto> ByDepartment,
    List<ResolverStatDto> ByResolver,
    PersonalStatsDto MyStats
);
