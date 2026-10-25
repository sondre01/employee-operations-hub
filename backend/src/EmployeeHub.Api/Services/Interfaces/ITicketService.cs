using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.Services.Interfaces;

public interface ITicketService
{
    Task<List<TicketDto>> GetTicketsAsync(
        TicketQueue? queue = null,
        TicketStatus? status = null,
        int? createdByEmployeeId = null,
        int? departmentId = null,
        int? assignedToEmployeeId = null
    );

    Task<TicketDto?> GetTicketByIdAsync(int id);
    Task<TicketDto> CreateTicketAsync(CreateTicketDto dto);
    Task<TicketDto?> UpdateTicketStatusAsync(int id, UpdateTicketStatusDto dto);
    Task<TicketDto?> AssignTicketAsync(int id, int assignedToEmployeeId);
    Task<TicketStatsSummaryDto> GetTicketStatsAsync(int? callerEmployeeId);
    Task<bool> DeleteTicketAsync(int id);
    Task<InboundEmailResultDto> ProcessInboundEmailAsync(InboundEmailTicketDto dto);
}
