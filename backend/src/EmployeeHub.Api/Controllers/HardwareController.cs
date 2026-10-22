using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HardwareController : ControllerBase
{
    private readonly IHardwareService _hardwareService;

    public HardwareController(IHardwareService hardwareService)
    {
        _hardwareService = hardwareService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HardwareItemDto>>> GetAll([FromQuery] int? employeeId, [FromQuery] string? status)
    {
        var result = await _hardwareService.GetAllHardwareAsync(employeeId, status);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HardwareItemDto>> GetById(int id)
    {
        var result = await _hardwareService.GetHardwareByIdAsync(id);
        if (result == null) return NotFound(new { message = $"Hardware item with ID {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<HardwareItemDto>> Create([FromBody] CreateHardwareItemDto dto)
    {
        try
        {
            var result = await _hardwareService.CreateHardwareAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HardwareItemDto>> Update(int id, [FromBody] UpdateHardwareItemDto dto)
    {
        try
        {
            var result = await _hardwareService.UpdateHardwareAsync(id, dto);
            if (result == null) return NotFound(new { message = $"Hardware item with ID {id} not found." });
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
        var success = await _hardwareService.DeleteHardwareAsync(id);
        if (!success) return NotFound(new { message = $"Hardware item with ID {id} not found." });
        return NoContent();
    }
}
