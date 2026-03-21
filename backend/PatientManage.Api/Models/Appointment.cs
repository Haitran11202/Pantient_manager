namespace PatientManage.Api.Models;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? PatientId { get; set; }
    public Patient? Patient { get; set; }

    public string PatientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Waiting;
    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
    public string? Notes { get; set; }
}
