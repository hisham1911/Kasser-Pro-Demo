using KasserPro.Api.Data;
using KasserPro.Api.Models;
using KasserPro.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KasserPro.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly KasserDbContext _context;

        public OrdersController(KasserDbContext context)
        {
            _context = context;
        }

        // جلب كل الطلبات
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(o => MapToDto(o)).ToList();
        }

        // إنشاء طلب جديد
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto dto)
        {
            // التحقق من توفر المخزون أولاً
            foreach (var item in dto.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                {
                    return BadRequest(new { message = $"المنتج رقم {item.ProductId} غير موجود" });
                }
                if (!product.IsAvailable)
                {
                    return BadRequest(new { message = $"المنتج {product.Name} غير متاح حالياً" });
                }
                if (product.Stock < item.Quantity)
                {
                    return BadRequest(new { message = $"الكمية المطلوبة من {product.Name} غير متوفرة. المتاح: {product.Stock}" });
                }
            }

            // توليد رقم الطلب تلقائي (20251208-0001)
            var today = DateTime.Today.ToString("yyyyMMdd");
            var lastOrderToday = await _context.Orders
                .Where(o => o.OrderNumber.StartsWith(today))
                .OrderByDescending(o => o.Id)
                .FirstOrDefaultAsync();

            int nextNumber = lastOrderToday == null ? 1 :
                int.Parse(lastOrderToday.OrderNumber.Split('-').Last()) + 1;

            string orderNumber = $"{today}-{nextNumber:D4}";

            var order = new Order
            {
                OrderNumber = orderNumber,
                CreatedAt = DateTime.Now,
                Subtotal = dto.Items.Sum(i => i.PriceAtTime * i.Quantity),
                Discount = dto.Discount,
                PaymentMethod = dto.PaymentMethod,
                Items = dto.Items.Select(i => new OrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    PriceAtTime = i.PriceAtTime
                }).ToList()
            };

            _context.Orders.Add(order);

            // تحديث المخزون
            foreach (var item in dto.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.Stock -= item.Quantity;
                    // إذا المخزون صفر، نخلي المنتج غير متاح
                    if (product.Stock <= 0)
                    {
                        product.Stock = 0;
                        product.IsAvailable = false;
                    }
                    _context.Products.Update(product);
                }
            }

            await _context.SaveChangesAsync();

            // جلب الطلب كامل بالأصناف عشان نرجعه
            var fullOrder = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == order.Id);

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToDto(fullOrder!));
        }

        // جلب طلب واحد
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();
            return MapToDto(order);
        }
        [HttpGet("{id}/print")]
        public async Task<IActionResult> PrintOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            var receipt = "       مطعمك الحلو\n";
            receipt += "========================\n";
            receipt += $"فاتورة رقم: {order.OrderNumber}\n";
            receipt += $"التاريخ: {order.CreatedAt:yyyy-MM-dd HH:mm}\n";
            receipt += "========================\n";

            foreach (var item in order.Items)
            {
                var productName = item.Product?.Name ?? "منتج";
                receipt += $"{productName} x{item.Quantity}     {item.PriceAtTime * item.Quantity} ج.م\n";
            }

            receipt += "------------------------\n";
            receipt += $"الإجمالي: {order.Subtotal} ج.م\n";
            receipt += $"الخصم: {order.Discount} ج.م\n";
            receipt += $"الصافي: {order.Total} ج.م\n";
            receipt += $"طريقة الدفع: {order.PaymentMethod}\n";
            receipt += "========================\n";
            receipt += "     شكرا لزيارتك ❤️\n\n\n";

            // أوامر ESC/POS للطابعة الحرارية
            var escPos = "\x1B\x40" + receipt + "\x1D\x56\x00";  // Initialize + Cut

            return File(System.Text.Encoding.UTF8.GetBytes(escPos), "application/octet-stream");
        }

        // تحويل Order إلى OrderDto
        private static OrderDto MapToDto(Order order)
        {
            return new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CreatedAt = order.CreatedAt,
                Subtotal = order.Subtotal,
                Discount = order.Discount,
                TaxAmount = order.TaxAmount,
                Total = order.Total,
                PaymentMethod = order.PaymentMethod,
                Items = order.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.Product?.Name ?? "منتج محذوف",
                    Quantity = i.Quantity,
                    PriceAtTime = i.PriceAtTime
                }).ToList()
            };
        }
    }
}
