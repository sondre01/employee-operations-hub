using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Services.Interfaces;

namespace EmployeeHub.Api.Services.Implementations;

public class PolicyService : IPolicyService
{
    private readonly AppDbContext _context;

    public PolicyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PolicyDocumentDto>> GetPoliciesAsync(int? employeeId = null)
    {
        var policies = await _context.PolicyDocuments
            .Include(p => p.Acknowledgements)
            .OrderBy(p => p.Id)
            .AsNoTracking()
            .ToListAsync();

        return policies.Select(p =>
        {
            var userAck = employeeId.HasValue
                ? p.Acknowledgements.FirstOrDefault(a => a.EmployeeId == employeeId.Value)
                : null;

            return new PolicyDocumentDto(
                p.Id,
                p.Title,
                p.Version,
                p.SummaryMarkdown,
                p.IsMandatory,
                p.PublishedAtUtc,
                p.Acknowledgements.Count,
                userAck != null,
                userAck?.AcknowledgedAtUtc
            );
        }).ToList();
    }

    public async Task<PolicyDocumentDto?> GetPolicyByIdAsync(int id, int? employeeId = null)
    {
        var policy = await _context.PolicyDocuments
            .Include(p => p.Acknowledgements)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (policy == null) return null;

        var userAck = employeeId.HasValue
            ? policy.Acknowledgements.FirstOrDefault(a => a.EmployeeId == employeeId.Value)
            : null;

        return new PolicyDocumentDto(
            policy.Id,
            policy.Title,
            policy.Version,
            policy.SummaryMarkdown,
            policy.IsMandatory,
            policy.PublishedAtUtc,
            policy.Acknowledgements.Count,
            userAck != null,
            userAck?.AcknowledgedAtUtc
        );
    }

    public async Task<PolicyDocumentDto> CreatePolicyAsync(CreatePolicyDto dto)
    {
        var policy = new PolicyDocument
        {
            Title = dto.Title.Trim(),
            Version = dto.Version.Trim(),
            SummaryMarkdown = dto.SummaryMarkdown.Trim(),
            IsMandatory = dto.IsMandatory,
            PublishedAtUtc = DateTime.UtcNow
        };

        _context.PolicyDocuments.Add(policy);
        await _context.SaveChangesAsync();

        return new PolicyDocumentDto(
            policy.Id,
            policy.Title,
            policy.Version,
            policy.SummaryMarkdown,
            policy.IsMandatory,
            policy.PublishedAtUtc,
            0,
            false,
            null
        );
    }

    public async Task<bool> AcknowledgePolicyAsync(int policyId, int employeeId)
    {
        var policyExists = await _context.PolicyDocuments.AnyAsync(p => p.Id == policyId);
        if (!policyExists)
        {
            throw new ArgumentException($"Policy document with ID {policyId} does not exist.");
        }

        var employeeExists = await _context.Employees.AnyAsync(e => e.Id == employeeId);
        if (!employeeExists)
        {
            throw new ArgumentException($"Employee with ID {employeeId} does not exist.");
        }

        var existingAck = await _context.PolicyAcknowledgements
            .FirstOrDefaultAsync(a => a.PolicyDocumentId == policyId && a.EmployeeId == employeeId);

        if (existingAck != null)
        {
            return true; // Already acknowledged
        }

        var ack = new PolicyAcknowledgement
        {
            PolicyDocumentId = policyId,
            EmployeeId = employeeId,
            AcknowledgedAtUtc = DateTime.UtcNow
        };

        _context.PolicyAcknowledgements.Add(ack);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeletePolicyAsync(int id)
    {
        var policy = await _context.PolicyDocuments.FindAsync(id);
        if (policy == null) return false;

        _context.PolicyDocuments.Remove(policy);
        await _context.SaveChangesAsync();
        return true;
    }
}
