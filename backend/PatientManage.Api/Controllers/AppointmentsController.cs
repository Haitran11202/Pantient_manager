using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;
using PatientManage.Api.Models;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController(ClinicDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var appointments = await db.Appointments
            .OrderBy(a => a.Date)
            .ThenBy(a => a.Time)
            .Select(a => new
            {
                a.Id,
                patientName = a.PatientName,
                phone = a.Phone,
                reason = a.Reason,
                status = ToClientStatus(a.Status),
                date = a.Date.ToString("yyyy-MM-dd"),
                time = a.Time.ToString("HH:mm"),
                notes = a.Notes
            })
            .ToListAsync();

        return Ok(appointments);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] AppointmentRequest request)
    {
        var patientName = request.PatientName.Trim();
        var phone = request.Phone.Trim();

        var patient = await FindOrCreatePatientByPhoneAsync(patientName, phone);

        var appointment = new Appointment
        {
            PatientId = patient.Id,
            PatientName = patientName,
            Phone = phone,
            Reason = request.Reason.Trim(),
            Status = ParseStatus(request.Status),
            Date = DateOnly.Parse(request.Date),
            Time = TimeOnly.Parse(request.Time),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = appointment.Id }, new
        {
            appointment.Id,
            patientName = appointment.PatientName,
            phone = appointment.Phone,
            reason = appointment.Reason,
            status = ToClientStatus(appointment.Status),
            date = appointment.Date.ToString("yyyy-MM-dd"),
            time = appointment.Time.ToString("HH:mm"),
            notes = appointment.Notes
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] AppointmentRequest request)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment is null)
        {
            return NotFound();
        }

        var patientName = request.PatientName.Trim();
        var phone = request.Phone.Trim();

        var patient = await FindOrCreatePatientByPhoneAsync(patientName, phone);

        appointment.PatientId = patient.Id;
        appointment.PatientName = patientName;
        appointment.Phone = phone;
        appointment.Reason = request.Reason.Trim();
        appointment.Status = ParseStatus(request.Status);
        appointment.Date = DateOnly.Parse(request.Date);
        appointment.Time = TimeOnly.Parse(request.Time);
        appointment.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await db.SaveChangesAsync();

        return Ok(new
        {
            appointment.Id,
            patientName = appointment.PatientName,
            phone = appointment.Phone,
            reason = appointment.Reason,
            status = ToClientStatus(appointment.Status),
            date = appointment.Date.ToString("yyyy-MM-dd"),
            time = appointment.Time.ToString("HH:mm"),
            notes = appointment.Notes
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment is null)
        {
            return NotFound();
        }

        db.Appointments.Remove(appointment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<Patient> FindOrCreatePatientByPhoneAsync(string patientName, string phone)
    {
        var patient = await db.Patients.FirstOrDefaultAsync(p => p.PhoneNumber == phone);
        if (patient is not null)
        {
            return patient;
        }

        patient = new Patient
        {
            FullName = patientName,
            PhoneNumber = phone
        };

        db.Patients.Add(patient);
        await db.SaveChangesAsync();
        return patient;
    }

    private static AppointmentStatus ParseStatus(string status)
    {
        return status switch
        {
            "completed" => AppointmentStatus.Completed,
            "cancelled" => AppointmentStatus.Cancelled,
            _ => AppointmentStatus.Waiting
        };
    }

    private static string ToClientStatus(AppointmentStatus status)
    {
        return status switch
        {
            AppointmentStatus.Completed => "completed",
            AppointmentStatus.Cancelled => "cancelled",
            _ => "waiting"
        };
    }

    public record AppointmentRequest(
        string PatientName,
        string Phone,
        string Reason,
        string Status,
        string Date,
        string Time,
        string? Notes
    );
}
