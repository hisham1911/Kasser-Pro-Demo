using KasserPro.Api.Data;
using KasserPro.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KasserPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly KasserDbContext _context;

        public CategoriesController(KasserDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        // جلب كل التصنيفات
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Color,
                    c.Icon,
                    ProductsCount = _context.Products.Count(p => p.CategoryId == c.Id)
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/categories/5
        // جلب تصنيف واحد بالـ Id
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "التصنيف غير موجود" });
            }

            return category;
        }

        // GET: api/categories/5/products
        // جلب كل الأصناف في تصنيف معين
        [HttpGet("{id}/products")]
        public async Task<ActionResult<IEnumerable<Product>>> GetCategoryProducts(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "التصنيف غير موجود" });
            }

            var products = await _context.Products
                .Where(p => p.CategoryId == id)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return products;
        }

        // POST: api/categories
        // إضافة تصنيف جديد
        [HttpPost]
        public async Task<ActionResult<Category>> CreateCategory(Category category)
        {
            // التحقق من عدم وجود تصنيف بنفس الاسم
            var exists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower());

            if (exists)
            {
                return BadRequest(new { message = "يوجد تصنيف بنفس الاسم بالفعل" });
            }

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        // PUT: api/categories/5
        // تعديل تصنيف موجود
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, Category category)
        {
            if (id != category.Id)
            {
                return BadRequest(new { message = "رقم التصنيف غير متطابق" });
            }

            // التحقق من وجود التصنيف
            var exists = await _context.Categories.AnyAsync(c => c.Id == id);
            if (!exists)
            {
                return NotFound(new { message = "التصنيف غير موجود" });
            }

            // التحقق من عدم تكرار الاسم
            var duplicate = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower() && c.Id != id);

            if (duplicate)
            {
                return BadRequest(new { message = "يوجد تصنيف آخر بنفس الاسم" });
            }

            _context.Entry(category).State = EntityState.Modified;

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

        // DELETE: api/categories/5
        // حذف تصنيف
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "التصنيف غير موجود" });
            }

            // التحقق من عدم وجود أصناف في هذا التصنيف
            var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);

            if (hasProducts)
            {
                return BadRequest(new { message = "لا يمكن حذف التصنيف لأنه يحتوي على أصناف" });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
