using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetAll()
    {
        var result = await _departmentService.GetDepartmentsAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> GetById(int id)
    {
        var result = await _departmentService.GetDepartmentByIdAsync(id);
        if (result == null) return NotFound(new { message = $"Department with ID {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] CreateDepartmentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Department name is required." });
        }

        try
        {
            var result = await _departmentService.CreateDepartmentAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> Update(int id, [FromBody] UpdateDepartmentDto dto)
    {
        var result = await _departmentService.UpdateDepartmentAsync(id, dto);
        if (result == null) return NotFound(new { message = $"Department with ID {id} not found." });
        return Ok(result);
    }
}
