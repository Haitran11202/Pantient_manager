namespace PatientManage.Api.Models;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateOnly Date { get; set; }

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public string DoctorNotes { get; set; } = string.Empty;
    public decimal ExistingDebt { get; set; }
    public decimal AmountPaid { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
