using Microsoft.AspNetCore.Mvc;
using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Enums;
using Malayo.EmployeeHub.Api.Services.Interfaces;

namespace Malayo.EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet]
    public async Task<ActionResult<List<EmployeeDto>>> GetAll(
        [FromQuery] EmploymentType? type,
        [FromQuery] UserRole? role,
        [FromQuery] string? clientName)
    {
        var result = await _employeeService.GetEmployeesAsync(type, role, clientName);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeDetailDto>> GetById(int id)
    {
        var result = await _employeeService.GetEmployeeByIdAsync(id);
        if (result == null) return NotFound(new { message = $"Employee with ID {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> Create([FromBody] CreateEmployeeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.WorkEmail))
        {
            return BadRequest(new { message = "Full name and work email are required." });
        }

        var result = await _employeeService.CreateEmployeeAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EmployeeDto>> Update(int id, [FromBody] UpdateEmployeeDto dto)
    {
        var result = await _employeeService.UpdateEmployeeAsync(id, dto);
        if (result == null) return NotFound(new { message = $"Employee with ID {id} not found." });
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _employeeService.DeleteEmployeeAsync(id);
        if (!success) return NotFound(new { message = $"Employee with ID {id} not found." });
        return NoContent();
    }

    [HttpGet("{id:int}/hardware")]
    public async Task<ActionResult<List<HardwareItemDto>>> GetAssignedHardware(int id)
    {
        var result = await _employeeService.GetHardwareByEmployeeIdAsync(id);
        return Ok(result);
    }
}
