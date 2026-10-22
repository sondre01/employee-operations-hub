using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Enums;

namespace Malayo.EmployeeHub.Api.Services.Interfaces;

public interface ITicketService
{
    Task<List<TicketDto>> GetTicketsAsync(TicketQueue? queue = null, TicketStatus? status = null, int? createdByEmployeeId = null);
    Task<TicketDto?> GetTicketByIdAsync(int id);
    Task<TicketDto> CreateTicketAsync(CreateTicketDto dto);
    Task<TicketDto?> UpdateTicketStatusAsync(int id, UpdateTicketStatusDto dto);
    Task<bool> DeleteTicketAsync(int id);
}
