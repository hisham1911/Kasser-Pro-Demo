using System.Text.Json.Serialization;

namespace KasserPro.Api.Models
{
    public class Order
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty; // هيتولد أوتوماتيك
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public decimal Subtotal { get; set; }                    // المجموع قبل الخصم والضريبة
        public decimal Discount { get; set; } = 0;               // الخصم
        public decimal TaxRate { get; set; } = 0.14m;            // نسبة الضريبة (14% في مصر)
        public decimal TaxAmount => (Subtotal - Discount) * TaxRate;  // قيمة الضريبة المحسوبة
        public decimal Total => Subtotal - Discount + TaxAmount; // الإجمالي النهائي
        public string PaymentMethod { get; set; } = "Cash";      // Cash, Card, Wallet
        public int? UserId { get; set; }                         // رقم الكاشير اللي عمل الطلب (Foreign Key)
        public string? Notes { get; set; }                       // ملاحظات على الطلب

        // العلاقات
        [JsonIgnore]
        public User? User { get; set; }  // الكاشير اللي عمل الطلب
        
        public List<OrderItem> Items { get; set; } = new();
    }
}