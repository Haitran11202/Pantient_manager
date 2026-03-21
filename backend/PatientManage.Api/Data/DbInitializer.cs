using Microsoft.EntityFrameworkCore;
using PatientManage.Api.Models;

namespace PatientManage.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ClinicDbContext db)
    {
        if (await db.Services.AnyAsync())
        {
            return;
        }

        var services = new[]
        {
            new Service { ServiceCode = "DV001", ServiceName = "Nhổ răng khôn", UnitPrice = 1500000, Description = "Nhổ răng khôn mọc lệch, mọc ngầm hoặc gây đau", IsActive = true },
            new Service { ServiceCode = "DV002", ServiceName = "Cạo vôi răng", UnitPrice = 200000, Description = "Làm sạch cao răng và mảng bám trên bề mặt răng", IsActive = true },
            new Service { ServiceCode = "DV003", ServiceName = "Trám răng Composite", UnitPrice = 350000, Description = "Trám răng bằng vật liệu composite thẩm mỹ cao", IsActive = true },
            new Service { ServiceCode = "DV004", ServiceName = "Điều trị tủy răng", UnitPrice = 800000, Description = "Điều trị tủy răng bị viêm nhiễm hoặc chết tủy", IsActive = true },
            new Service { ServiceCode = "DV005", ServiceName = "Bọc răng sứ", UnitPrice = 2500000, Description = "Bọc răng sứ cao cấp, thẩm mỹ tự nhiên", IsActive = true },
            new Service { ServiceCode = "DV006", ServiceName = "Niềng răng mắc cài kim loại", UnitPrice = 25000000, Description = "Niềng răng chỉnh nha bằng mắc cài kim loại truyền thống", IsActive = true },
            new Service { ServiceCode = "DV007", ServiceName = "Tẩy trắng răng", UnitPrice = 3000000, Description = "Tẩy trắng răng công nghệ Laser Whitening", IsActive = true },
            new Service { ServiceCode = "DV008", ServiceName = "Cấy ghép Implant", UnitPrice = 20000000, Description = "Cấy ghép răng Implant titanium cao cấp", IsActive = true }
        };

        await db.Services.AddRangeAsync(services);
        await db.SaveChangesAsync();
    }
}
