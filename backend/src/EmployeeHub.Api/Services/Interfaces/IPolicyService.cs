using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services.Interfaces;

public interface IPolicyService
{
    Task<List<PolicyDocumentDto>> GetPoliciesAsync(int? employeeId = null);
    Task<PolicyDocumentDto?> GetPolicyByIdAsync(int id, int? employeeId = null);
    Task<PolicyDocumentDto> CreatePolicyAsync(CreatePolicyDto dto);
    Task<bool> AcknowledgePolicyAsync(int policyId, int employeeId);
    Task<bool> DeletePolicyAsync(int id);
}
