namespace EmployeeHub.Api.Models.Enums;

/// <summary>
/// Operational queues for routing internal support requests.
/// </summary>
public enum TicketQueue
{
    ItInfrastructure = 1, // Laptops, hardware custody, VPN, security access, dual monitors
    HrLegal = 2           // Certificate of Employment (COE), HMO, statutory deductions (SSS/PhilHealth/Pag-IBIG)
}
