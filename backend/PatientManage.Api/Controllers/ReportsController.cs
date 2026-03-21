using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController(ClinicDbContext db) : ControllerBase
{
    [HttpGet("revenue/excel")]
    public async Task<IActionResult> ExportRevenueReport([FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        var from = ParseDate(fromDate);
        var to = ParseDate(toDate);

        if (from is not null && to is not null && from > to)
        {
            return BadRequest("Khoảng ngày không hợp lệ. fromDate phải nhỏ hơn hoặc bằng toDate.");
        }

        var query = db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .AsQueryable();

        if (from is not null)
        {
            query = query.Where(i => i.Date >= from.Value);
        }

        if (to is not null)
        {
            query = query.Where(i => i.Date <= to.Value);
        }

        var invoices = await query
            .OrderBy(i => i.Date)
            .ThenBy(i => i.Patient.FullName)
            .AsNoTracking()
            .ToListAsync();

        var rows = invoices.Select(i =>
        {
            var servicesTotal = i.Items.Sum(item => item.Subtotal);
            var total = servicesTotal + i.ExistingDebt;

            return new
            {
                Date = i.Date,
                PatientName = i.Patient.FullName,
                Total = total,
                Paid = i.AmountPaid
            };
        }).ToList();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("BaoCaoDoanhThu");

        ws.Cell(1, 1).Value = "Ngày";
        ws.Cell(1, 2).Value = "Bệnh Nhân";
        ws.Cell(1, 3).Value = "Tổng Tiền";
        ws.Cell(1, 4).Value = "Đã Thanh Toán";
        ws.Cell(1, 5).Value = "Còn Lại";

        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index];
            var excelRow = index + 2;
            var remaining = row.Total - row.Paid;

            ws.Cell(excelRow, 1).Value = row.Date.ToString("yyyy-MM-dd");
            ws.Cell(excelRow, 2).Value = row.PatientName;
            ws.Cell(excelRow, 3).Value = Convert.ToDouble(row.Total);
            ws.Cell(excelRow, 4).Value = Convert.ToDouble(row.Paid);
            ws.Cell(excelRow, 5).Value = Convert.ToDouble(remaining < 0 ? 0 : remaining);
        }

        var header = ws.Range(1, 1, 1, 5);
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#E6F4FF");

        var moneyRange = ws.Range(2, 3, Math.Max(rows.Count + 1, 2), 5);
        moneyRange.Style.NumberFormat.Format = "#,##0";

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var fileName = $"bao-cao-doanh-thu-{DateTime.Now:yyyyMMdd-HHmmss}.xlsx";

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName
        );
    }

    private static DateOnly? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateOnly.TryParse(value, out var parsed) ? parsed : null;
    }
}
