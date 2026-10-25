using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Enums;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TicketDto>>> GetAll(
        [FromQuery] TicketQueue? queue,
        [FromQuery] TicketStatus? status,
        [FromQuery] int? createdByEmployeeId,
        [FromQuery] int? departmentId,
        [FromQuery] int? assignedToEmployeeId)
    {
        var result = await _ticketService.GetTicketsAsync(queue, status, createdByEmployeeId, departmentId, assignedToEmployeeId);
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<TicketStatsSummaryDto>> GetStats([FromQuery] int? callerEmployeeId)
    {
        var result = await _ticketService.GetTicketStatsAsync(callerEmployeeId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TicketDto>> GetById(int id)
    {
        var result = await _ticketService.GetTicketByIdAsync(id);
        if (result == null) return NotFound(new { message = $"Ticket with ID {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> Create([FromBody] CreateTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description))
        {
            return BadRequest(new { message = "Title and description are required." });
        }

        try
        {
            var result = await _ticketService.CreateTicketAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<TicketDto>> UpdateStatus(int id, [FromBody] UpdateTicketStatusDto dto)
    {
        var result = await _ticketService.UpdateTicketStatusAsync(id, dto);
        if (result == null) return NotFound(new { message = $"Ticket with ID {id} not found." });
        return Ok(result);
    }

    [HttpPatch("{id:int}/assign")]
    public async Task<ActionResult<TicketDto>> AssignTicket(int id, [FromBody] AssignTicketDto dto)
    {
        try
        {
            var result = await _ticketService.AssignTicketAsync(id, dto.AssignedToEmployeeId);
            if (result == null) return NotFound(new { message = $"Ticket with ID {id} not found." });
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _ticketService.DeleteTicketAsync(id);
        if (!success) return NotFound(new { message = $"Ticket with ID {id} not found." });
        return NoContent();
    }

    [HttpPost("inbound-email")]
    public async Task<ActionResult<InboundEmailResultDto>> InboundEmail([FromBody] InboundEmailTicketDto dto)
    {
        var result = await _ticketService.ProcessInboundEmailAsync(dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
