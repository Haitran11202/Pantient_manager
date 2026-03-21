using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;
using PatientManage.Api.Models;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController(ClinicDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var patients = await db.Patients
            .OrderBy(p => p.FullName)
            .Select(p => new
            {
                p.Id,
                p.FullName,
                p.PhoneNumber,
                p.BirthYear,
                p.Address,
                p.MedicalHistory
            })
            .ToListAsync();

        return Ok(patients);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] Patient request)
    {
        var patient = new Patient
        {
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            BirthYear = request.BirthYear,
            Address = request.Address?.Trim(),
            MedicalHistory = request.MedicalHistory?.Trim()
        };

        db.Patients.Add(patient);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = patient.Id }, new
        {
            patient.Id,
            patient.FullName,
            patient.PhoneNumber,
            patient.BirthYear,
            patient.Address,
            patient.MedicalHistory
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] Patient request)
    {
        var patient = await db.Patients.FindAsync(id);
        if (patient is null)
        {
            return NotFound();
        }

        patient.FullName = request.FullName.Trim();
        patient.PhoneNumber = request.PhoneNumber.Trim();
        patient.BirthYear = request.BirthYear;
        patient.Address = request.Address?.Trim();
        patient.MedicalHistory = request.MedicalHistory?.Trim();

        await db.SaveChangesAsync();

        return Ok(new
        {
            patient.Id,
            patient.FullName,
            patient.PhoneNumber,
            patient.BirthYear,
            patient.Address,
            patient.MedicalHistory
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var patient = await db.Patients.FindAsync(id);
        if (patient is null)
        {
            return NotFound();
        }

        db.Patients.Remove(patient);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
