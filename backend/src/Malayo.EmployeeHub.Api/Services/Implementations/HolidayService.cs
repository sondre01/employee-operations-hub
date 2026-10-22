using Microsoft.EntityFrameworkCore;
using Malayo.EmployeeHub.Api.Data;
using Malayo.EmployeeHub.Api.DTOs;
using Malayo.EmployeeHub.Api.Models.Entities;
using Malayo.EmployeeHub.Api.Models.Enums;
using Malayo.EmployeeHub.Api.Services.Interfaces;

namespace Malayo.EmployeeHub.Api.Services.Implementations;

public class HolidayService : IHolidayService
{
    private readonly AppDbContext _context;

    public HolidayService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<HolidayDto>> GetHolidaysAsync(int? year = null, CountryLocation? country = null)
    {
        var query = _context.Holidays.AsNoTracking();

        if (year.HasValue)
        {
            query = query.Where(h => h.HolidayDate.Year == year.Value);
        }

        if (country.HasValue)
        {
            query = query.Where(h => h.Country == country.Value);
        }

        return await query
            .OrderBy(h => h.HolidayDate)
            .Select(h => new HolidayDto(
                h.Id,
                h.Title,
                h.HolidayDate,
                h.Country,
                h.IsWorkingDay,
                h.Notes
            ))
            .ToListAsync();
    }

    public async Task<HolidayDto?> GetHolidayByIdAsync(int id)
    {
        var holiday = await _context.Holidays.AsNoTracking().FirstOrDefaultAsync(h => h.Id == id);
        if (holiday == null) return null;

        return new HolidayDto(
            holiday.Id,
            holiday.Title,
            holiday.HolidayDate,
            holiday.Country,
            holiday.IsWorkingDay,
            holiday.Notes
        );
    }

    public async Task<HolidayDto> CreateHolidayAsync(CreateHolidayDto dto)
    {
        var holiday = new Holiday
        {
            Title = dto.Title.Trim(),
            HolidayDate = dto.HolidayDate,
            Country = dto.Country,
            IsWorkingDay = dto.IsWorkingDay,
            Notes = dto.Notes?.Trim()
        };

        _context.Holidays.Add(holiday);
        await _context.SaveChangesAsync();

        return new HolidayDto(
            holiday.Id,
            holiday.Title,
            holiday.HolidayDate,
            holiday.Country,
            holiday.IsWorkingDay,
            holiday.Notes
        );
    }

    public async Task<bool> DeleteHolidayAsync(int id)
    {
        var holiday = await _context.Holidays.FindAsync(id);
        if (holiday == null) return false;

        _context.Holidays.Remove(holiday);
        await _context.SaveChangesAsync();
        return true;
    }
}
