using KasserPro.Api.Data;
using KasserPro.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KasserPro.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly KasserDbContext _context;

        public ProductsController(KasserDbContext context)
        {
            _context = context;
        }

        // GET: api/products
        // جلب كل الأصناف مع معلومات التصنيف
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProducts(
            [FromQuery] int? categoryId = null,
            [FromQuery] bool? isAvailable = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Products
                .Include(p => p.Category) // جلب معلومات التصنيف
                .AsQueryable();

            // فلترة بالتصنيف
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // فلترة بالتوفر
            if (isAvailable.HasValue)
            {
                query = query.Where(p => p.IsAvailable == isAvailable.Value);
            }

            // البحث بالاسم
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Name.Contains(search));
            }

            var products = await query
                .OrderBy(p => p.CategoryId)
                .ThenBy(p => p.Name)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Price,
                    p.Stock,
                    p.IsAvailable,
                    p.ImageUrl,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    CategoryColor = p.Category != null ? p.Category.Color : null,
                    CategoryIcon = p.Category != null ? p.Category.Icon : null
                })
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/products/5
        // جلب صنف واحد
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = "الصنف غير موجود" });
            }

            return product;
        }

        // POST: api/products
        // إضافة صنف جديد
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            // لا يمكن إنشاء منتج متاح بمخزون صفر
            if (product.IsAvailable && product.Stock <= 0)
            {
                product.IsAvailable = false;
            }

            // التحقق من وجود التصنيف إذا تم تحديده
            if (product.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == product.CategoryId.Value);

                if (!categoryExists)
                {
                    return BadRequest(new { message = "التصنيف المحدد غير موجود" });
                }
            }

            // التحقق من عدم تكرار الاسم
            var nameExists = await _context.Products
                .AnyAsync(p => p.Name.ToLower() == product.Name.ToLower());

            if (nameExists)
            {
                return BadRequest(new { message = "يوجد صنف بنفس الاسم بالفعل" });
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        // PUT: api/products/5
        // تعديل صنف
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, Product product)
        {
            if (id != product.Id)
            {
                return BadRequest(new { message = "رقم الصنف غير متطابق" });
            }

            // لا يمكن تفعيل منتج بمخزون صفر
            if (product.IsAvailable && product.Stock <= 0)
            {
                return BadRequest(new { message = "لا يمكن تفعيل منتج مخزونه صفر" });
            }

            // التحقق من وجود الصنف
            var exists = await _context.Products.AnyAsync(p => p.Id == id);
            if (!exists)
            {
                return NotFound(new { message = "الصنف غير موجود" });
            }

            // التحقق من وجود التصنيف
            if (product.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == product.CategoryId.Value);

                if (!categoryExists)
                {
                    return BadRequest(new { message = "التصنيف المحدد غير موجود" });
                }
            }

            // التحقق من عدم تكرار الاسم
            var duplicate = await _context.Products
                .AnyAsync(p => p.Name.ToLower() == product.Name.ToLower() && p.Id != id);

            if (duplicate)
            {
                return BadRequest(new { message = "يوجد صنف آخر بنفس الاسم" });
            }

            _context.Entry(product).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء التحديث" });
            }

            return NoContent();
        }

        // DELETE: api/products/5
        // حذف صنف
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(new { message = "الصنف غير موجود" });
            }

            // التحقق من عدم وجود الصنف في طلبات
            var hasOrders = await _context.OrderItems.AnyAsync(oi => oi.ProductId == id);

            if (hasOrders)
            {
                return BadRequest(new { message = "لا يمكن حذف الصنف لأنه موجود في طلبات سابقة" });
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/products/5/stock
        // تحديث المخزون
        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] int stock)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(new { message = "الصنف غير موجود" });
            }

            product.Stock = stock;

            // إذا المخزون صفر، نخلي الصنف غير متاح
            if (stock == 0)
            {
                product.IsAvailable = false;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/products/5/availability
        // تغيير حالة التوفر
        [HttpPatch("{id}/availability")]
        public async Task<IActionResult> UpdateAvailability(int id, [FromBody] bool isAvailable)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(new { message = "الصنف غير موجود" });
            }

            // لا يمكن تفعيل منتج مخزونه صفر
            if (isAvailable && product.Stock <= 0)
            {
                return BadRequest(new { message = "لا يمكن تفعيل منتج مخزونه صفر" });
            }

            product.IsAvailable = isAvailable;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}