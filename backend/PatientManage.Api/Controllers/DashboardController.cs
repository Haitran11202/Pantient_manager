using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(ClinicDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<object>> GetSummary([FromQuery] string? date)
    {
        var selectedDate = ParseDate(date);

        var invoices = await db.Invoices
            .Include(i => i.Items)
            .ToListAsync();

        var payments = await db.Payments.ToListAsync();
        var appointments = await db.Appointments.ToListAsync();

        decimal RevenueForDate(DateOnly day)
        {
            var invoiceRevenue = invoices.Where(i => i.Date == day).Sum(i => i.AmountPaid);
            var paymentRevenue = payments.Where(p => p.Date == day).Sum(p => p.Amount);
            return invoiceRevenue + paymentRevenue;
        }

        decimal RevenueForMonth(int year, int month)
        {
            var invoiceRevenue = invoices.Where(i => i.Date.Year == year && i.Date.Month == month).Sum(i => i.AmountPaid);
            var paymentRevenue = payments.Where(p => p.Date.Year == year && p.Date.Month == month).Sum(p => p.Amount);
            return invoiceRevenue + paymentRevenue;
        }

        decimal RevenueForYear(int year)
        {
            var invoiceRevenue = invoices.Where(i => i.Date.Year == year).Sum(i => i.AmountPaid);
            var paymentRevenue = payments.Where(p => p.Date.Year == year).Sum(p => p.Amount);
            return invoiceRevenue + paymentRevenue;
        }

        var totalInvoiced = invoices.Sum(i => i.Items.Sum(ii => ii.Subtotal) + i.ExistingDebt);
        var totalPaid = invoices.Sum(i => i.AmountPaid) + payments.Sum(p => p.Amount);
        var totalOutstandingDebt = totalInvoiced - totalPaid;

        var daysInMonth = DateTime.DaysInMonth(selectedDate.Year, selectedDate.Month);
        var monthlySeries = Enumerable.Range(1, daysInMonth)
            .Select(day =>
            {
                var currentDate = new DateOnly(selectedDate.Year, selectedDate.Month, day);
                return new
                {
                    day,
                    revenue = RevenueForDate(currentDate)
                };
            })
            .ToList();

        var yearlySeries = Enumerable.Range(1, 12)
            .Select(month => new
            {
                month,
                revenue = RevenueForMonth(selectedDate.Year, month)
            })
            .ToList();

        var result = new
        {
            selectedDate = selectedDate.ToString("yyyy-MM-dd"),
            revenue = new
            {
                day = RevenueForDate(selectedDate),
                month = RevenueForMonth(selectedDate.Year, selectedDate.Month),
                year = RevenueForYear(selectedDate.Year)
            },
            debt = new
            {
                totalOutstanding = totalOutstandingDebt < 0 ? 0 : totalOutstandingDebt
            },
            appointments = new
            {
                day = appointments.Count(a => a.Date == selectedDate),
                month = appointments.Count(a => a.Date.Year == selectedDate.Year && a.Date.Month == selectedDate.Month),
                year = appointments.Count(a => a.Date.Year == selectedDate.Year),
                total = appointments.Count
            },
            monthlyRevenueByDay = monthlySeries,
            yearlyRevenueByMonth = yearlySeries
        };

        return Ok(result);
    }

    private static DateOnly ParseDate(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) && DateOnly.TryParse(value, out var parsed))
        {
            return parsed;
        }

        return DateOnly.FromDateTime(DateTime.Today);
    }
}
