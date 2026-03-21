using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;
using PatientManage.Api.Models;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController(ClinicDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var invoices = await db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Service)
            .OrderByDescending(i => i.Date)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                date = i.Date.ToString("yyyy-MM-dd"),
                patient = new
                {
                    id = i.Patient.Id,
                    name = i.Patient.FullName,
                    phone = i.Patient.PhoneNumber
                },
                services = i.Items.Select(ii => new
                {
                    key = ii.Id.ToString(),
                    serviceId = ii.Service != null ? ii.Service.ServiceCode : string.Empty,
                    serviceName = ii.ServiceName,
                    quantity = ii.Quantity,
                    unitPrice = ii.UnitPrice,
                    subtotal = ii.Subtotal
                }),
                doctorNotes = i.DoctorNotes,
                existingDebt = i.ExistingDebt,
                amountPaid = i.AmountPaid,
                status = ToClientStatus(i.Status)
            })
            .ToListAsync();

        return Ok(invoices);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] InvoiceRequest request)
    {
        var patient = await db.Patients.FindAsync(request.PatientId);
        if (patient is null)
        {
            return BadRequest("Bệnh nhân không tồn tại.");
        }

        var invoice = new Invoice
        {
            InvoiceNumber = await NextInvoiceNumberAsync(),
            Date = string.IsNullOrWhiteSpace(request.Date) ? DateOnly.FromDateTime(DateTime.Now) : DateOnly.Parse(request.Date),
            PatientId = patient.Id,
            DoctorNotes = request.DoctorNotes?.Trim() ?? string.Empty,
            ExistingDebt = request.ExistingDebt,
            AmountPaid = request.AmountPaid,
            Status = ParseStatus(request.Status)
        };

        invoice.Items = await BuildItemsAsync(request.Services);

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        return Ok(await GetInvoiceResponse(invoice.Id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] InvoiceRequest request)
    {
        var invoice = await db.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice is null)
        {
            return NotFound();
        }

        var patient = await db.Patients.FindAsync(request.PatientId);
        if (patient is null)
        {
            return BadRequest("Bệnh nhân không tồn tại.");
        }

        invoice.PatientId = patient.Id;
        invoice.Date = string.IsNullOrWhiteSpace(request.Date) ? invoice.Date : DateOnly.Parse(request.Date);
        invoice.DoctorNotes = request.DoctorNotes?.Trim() ?? string.Empty;
        invoice.ExistingDebt = request.ExistingDebt;
        invoice.AmountPaid = request.AmountPaid;
        invoice.Status = ParseStatus(request.Status);

        db.InvoiceItems.RemoveRange(invoice.Items);
        invoice.Items = await BuildItemsAsync(request.Services);

        await db.SaveChangesAsync();

        return Ok(await GetInvoiceResponse(invoice.Id));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var invoice = await db.Invoices.FindAsync(id);
        if (invoice is null)
        {
            return NotFound();
        }

        db.Invoices.Remove(invoice);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<object?> GetInvoiceResponse(Guid id)
    {
        return await db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Service)
            .Where(i => i.Id == id)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                date = i.Date.ToString("yyyy-MM-dd"),
                patient = new
                {
                    id = i.Patient.Id,
                    name = i.Patient.FullName,
                    phone = i.Patient.PhoneNumber
                },
                services = i.Items.Select(ii => new
                {
                    key = ii.Id.ToString(),
                    serviceId = ii.Service != null ? ii.Service.ServiceCode : string.Empty,
                    serviceName = ii.ServiceName,
                    quantity = ii.Quantity,
                    unitPrice = ii.UnitPrice,
                    subtotal = ii.Subtotal
                }),
                doctorNotes = i.DoctorNotes,
                existingDebt = i.ExistingDebt,
                amountPaid = i.AmountPaid,
                status = ToClientStatus(i.Status)
            })
            .FirstOrDefaultAsync();
    }

    private async Task<ICollection<InvoiceItem>> BuildItemsAsync(IEnumerable<InvoiceServiceRequest> items)
    {
        var results = new List<InvoiceItem>();

        foreach (var item in items)
        {
            Service? service = null;
            if (!string.IsNullOrWhiteSpace(item.ServiceId))
            {
                service = await db.Services.FirstOrDefaultAsync(s => s.ServiceCode == item.ServiceId);
            }

            var serviceName = service?.ServiceName ?? item.ServiceName;
            var unitPrice = service?.UnitPrice ?? item.UnitPrice;
            var quantity = item.Quantity <= 0 ? 1 : item.Quantity;

            results.Add(new InvoiceItem
            {
                ServiceId = service?.Id,
                ServiceName = serviceName,
                Quantity = quantity,
                UnitPrice = unitPrice,
                Subtotal = unitPrice * quantity
            });
        }

        return results;
    }

    private async Task<string> NextInvoiceNumberAsync()
    {
        var year = DateTime.Now.Year;
        var count = await db.Invoices.CountAsync(i => i.Date.Year == year);
        return $"HD-{year}-{(count + 1):000}";
    }

    private static InvoiceStatus ParseStatus(string status)
    {
        return status switch
        {
            "completed" => InvoiceStatus.Completed,
            "cancelled" => InvoiceStatus.Cancelled,
            _ => InvoiceStatus.Draft
        };
    }

    private static string ToClientStatus(InvoiceStatus status)
    {
        return status switch
        {
            InvoiceStatus.Completed => "completed",
            InvoiceStatus.Cancelled => "cancelled",
            _ => "draft"
        };
    }

    public record InvoiceRequest(
        Guid PatientId,
        string Date,
        IEnumerable<InvoiceServiceRequest> Services,
        string? DoctorNotes,
        decimal ExistingDebt,
        decimal AmountPaid,
        string Status
    );

    public record InvoiceServiceRequest(
        string ServiceId,
        string ServiceName,
        int Quantity,
        decimal UnitPrice
    );
}
