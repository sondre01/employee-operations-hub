using Microsoft.AspNetCore.Mvc;
using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Enums;
using Malayo.EmployeeHub.Api.Services.Interfaces;

namespace Malayo.EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HolidaysController : ControllerBase
{
    private readonly IHolidayService _holidayService;

    public HolidaysController(IHolidayService holidayService)
    {
        _holidayService = holidayService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HolidayDto>>> GetAll([FromQuery] int? year, [FromQuery] CountryLocation? country)
    {
        var result = await _holidayService.GetHolidaysAsync(year, country);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HolidayDto>> GetById(int id)
    {
        var result = await _holidayService.GetHolidayByIdAsync(id);
        if (result == null) return NotFound(new { message = $"Holiday with ID {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<HolidayDto>> Create([FromBody] CreateHolidayDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "Holiday title is required." });
        }

        var result = await _holidayService.CreateHolidayAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _holidayService.DeleteHolidayAsync(id);
        if (!success) return NotFound(new { message = $"Holiday with ID {id} not found." });
        return NoContent();
    }
}
