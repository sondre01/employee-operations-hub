using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccessController : ControllerBase
{
    private readonly IAccessService _accessService;

    public AccessController(IAccessService accessService)
    {
        _accessService = accessService;
    }

    [HttpGet("employees")]
    public async Task<ActionResult<List<EmployeeAccessDto>>> GetAccessList()
    {
        var result = await _accessService.GetAccessListAsync();
        return Ok(result);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<EmployeeAccessDto>> UpdateAccess(int id, [FromBody] UpdateAccessRequestDto dto)
    {
        var result = await _accessService.UpdateAccessAsync(id, dto);
        if (result == null) return NotFound(new { message = $"Employee with ID {id} not found." });
        return Ok(result);
    }
}
