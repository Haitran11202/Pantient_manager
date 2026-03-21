namespace PatientManage.Api.Models;

public enum AppointmentStatus
{
    Waiting,
    Completed,
    Cancelled
}

public enum InvoiceStatus
{
    Draft,
    Completed,
    Cancelled
}

public enum PaymentMethod
{
    Cash,
    BankTransfer,
    CreditCard
}
