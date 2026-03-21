using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Data;
using PatientManage.Api.Models;

namespace PatientManage.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController(ClinicDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var services = await db.Services
            .OrderBy(s => s.ServiceCode)
            .Select(s => new
            {
                id = s.Id,
                serviceId = s.ServiceCode,
                serviceName = s.ServiceName,
                unitPrice = s.UnitPrice,
                description = s.Description,
                status = s.IsActive
            })
            .ToListAsync();

        return Ok(services);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] ServiceRequest request)
    {
        var service = new Service
        {
            ServiceCode = request.ServiceId.Trim(),
            ServiceName = request.ServiceName.Trim(),
            UnitPrice = request.UnitPrice,
            Description = request.Description.Trim(),
            IsActive = request.Status
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = service.Id }, new
        {
            id = service.Id,
            serviceId = service.ServiceCode,
            serviceName = service.ServiceName,
            unitPrice = service.UnitPrice,
            description = service.Description,
            status = service.IsActive
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] ServiceRequest request)
    {
        var service = await db.Services.FindAsync(id);
        if (service is null)
        {
            return NotFound();
        }

        service.ServiceCode = request.ServiceId.Trim();
        service.ServiceName = request.ServiceName.Trim();
        service.UnitPrice = request.UnitPrice;
        service.Description = request.Description.Trim();
        service.IsActive = request.Status;

        await db.SaveChangesAsync();

        return Ok(new
        {
            id = service.Id,
            serviceId = service.ServiceCode,
            serviceName = service.ServiceName,
            unitPrice = service.UnitPrice,
            description = service.Description,
            status = service.IsActive
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var service = await db.Services.FindAsync(id);
        if (service is null)
        {
            return NotFound();
        }

        db.Services.Remove(service);
        await db.SaveChangesAsync();
        return NoContent();
    }

    public record ServiceRequest(string ServiceId, string ServiceName, decimal UnitPrice, string Description, bool Status);
}
