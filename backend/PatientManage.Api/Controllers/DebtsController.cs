using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;
using PatientManage.Api.Models;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebtsController(ClinicDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetDebts()
    {
        var patients = await db.Patients
            .Include(p => p.Invoices)
            .ThenInclude(i => i.Items)
            .Include(p => p.Payments)
            .OrderBy(p => p.FullName)
            .ToListAsync();

        var result = patients.Select(p =>
        {
            var totalInvoiced = p.Invoices.Sum(i => i.Items.Sum(ii => ii.Subtotal) + i.ExistingDebt);
            var totalPaidFromInvoices = p.Invoices.Sum(i => i.AmountPaid);
            var totalPaidFromPayments = p.Payments.Sum(pay => pay.Amount);
            var totalPaid = totalPaidFromInvoices + totalPaidFromPayments;
            var remainingDebt = totalInvoiced - totalPaid;

            return new
            {
                id = p.Id,
                patientName = p.FullName,
                phoneNumber = p.PhoneNumber,
                totalInvoiced,
                totalPaid,
                remainingDebt = remainingDebt < 0 ? 0 : remainingDebt,
                paymentHistory = p.Payments
                    .OrderBy(pay => pay.Date)
                    .Select(pay => new
                    {
                        id = pay.Id,
                        date = pay.Date.ToString("yyyy-MM-dd"),
                        amount = pay.Amount,
                        method = ToClientMethod(pay.Method),
                        notes = pay.Notes
                    })
            };
        });

        return Ok(result);
    }

    [HttpPost("{patientId:guid}/payments")]
    public async Task<ActionResult> CreatePayment(Guid patientId, [FromBody] PaymentRequest request)
    {
        var patient = await db.Patients.FindAsync(patientId);
        if (patient is null)
        {
            return NotFound();
        }

        var payment = new Payment
        {
            PatientId = patient.Id,
            Date = DateOnly.Parse(request.PaymentDate),
            Amount = request.Amount,
            Method = ParseMethod(request.PaymentMethod),
            Notes = request.Notes?.Trim() ?? string.Empty
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        return Ok();
    }

    private static PaymentMethod ParseMethod(string method)
    {
        return method switch
        {
            "bank_transfer" => PaymentMethod.BankTransfer,
            "credit_card" => PaymentMethod.CreditCard,
            _ => PaymentMethod.Cash
        };
    }

    private static string ToClientMethod(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.BankTransfer => "bank_transfer",
            PaymentMethod.CreditCard => "credit_card",
            _ => "cash"
        };
    }

    public record PaymentRequest(string PaymentDate, decimal Amount, string PaymentMethod, string? Notes);
}
