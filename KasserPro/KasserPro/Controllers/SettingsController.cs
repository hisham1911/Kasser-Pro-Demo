using KasserPro.Api.Data;
using KasserPro.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KasserPro.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly KasserDbContext _context;

        public SettingsController(KasserDbContext context)
        {
            _context = context;
        }

        // GET: api/settings
        // جلب الإعدادات
        [HttpGet]
        public async Task<ActionResult<AppSettings>> GetSettings()
        {
            var settings = await _context.AppSettings.FirstOrDefaultAsync();
            
            if (settings == null)
            {
                // إنشاء إعدادات افتراضية إذا لم تكن موجودة
                settings = new AppSettings
                {
                    Id = 1,
                    TaxEnabled = true,
                    TaxRate = 14m,
                    StoreName = "KasserPro",
                    Currency = "ج.م"
                };
                _context.AppSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return settings;
        }

        // PUT: api/settings
        // تحديث الإعدادات
        [HttpPut]
        public async Task<IActionResult> UpdateSettings(AppSettings newSettings)
        {
            var settings = await _context.AppSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                newSettings.Id = 1;
                _context.AppSettings.Add(newSettings);
            }
            else
            {
                settings.TaxEnabled = newSettings.TaxEnabled;
                settings.TaxRate = newSettings.TaxRate;
                settings.StoreName = newSettings.StoreName;
                settings.Currency = newSettings.Currency;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/settings/tax
        // تحديث إعدادات الضريبة فقط
        [HttpPatch("tax")]
        public async Task<IActionResult> UpdateTaxSettings([FromBody] TaxSettingsDto dto)
        {
            var settings = await _context.AppSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                settings = new AppSettings { Id = 1 };
                _context.AppSettings.Add(settings);
            }

            settings.TaxEnabled = dto.TaxEnabled;
            settings.TaxRate = dto.TaxRate;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTO للضريبة
    public class TaxSettingsDto
    {
        public bool TaxEnabled { get; set; }
        public decimal TaxRate { get; set; }
    }
}
