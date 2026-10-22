using EmployeeHub.Api.Models.Enums;

namespace EmployeeHub.Api.Models.Entities;

public class Holiday
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly HolidayDate { get; set; }
    public CountryLocation Country { get; set; }
    
    /// <summary>
    /// Indicates whether developers are operating on this day (e.g. Philippine Special Working holiday, or Danish observance).
    /// </summary>
    public bool IsWorkingDay { get; set; } = false;
    
    public string? Notes { get; set; }
}
