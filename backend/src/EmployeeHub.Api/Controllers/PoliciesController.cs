using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoliciesController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public PoliciesController(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PolicyDocumentDto>>> GetAll([FromQuery] int? employeeId)
    {
        var result = await _policyService.GetPoliciesAsync(employeeId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PolicyDocumentDto>> GetById(int id, [FromQuery] int? employeeId)
    {
        var result = await _policyService.GetPolicyByIdAsync(id, employeeId);
        if (result == null) return NotFound(new { message = $"Policy with ID {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PolicyDocumentDto>> Create([FromBody] CreatePolicyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.SummaryMarkdown))
        {
            return BadRequest(new { message = "Title and summary content are required." });
        }

        var result = await _policyService.CreatePolicyAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:int}/acknowledge")]
    public async Task<IActionResult> Acknowledge(int id, [FromBody] AcknowledgePolicyRequest request)
    {
        try
        {
            var success = await _policyService.AcknowledgePolicyAsync(id, request.EmployeeId);
            return Ok(new { success = true, message = "Policy successfully acknowledged." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _policyService.DeletePolicyAsync(id);
        if (!success) return NotFound(new { message = $"Policy with ID {id} not found." });
        return NoContent();
    }
}
