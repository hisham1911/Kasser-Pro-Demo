using System.Text.Json.Serialization;

namespace KasserPro.Api.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? CategoryId { get; set; }    // رقم التصنيف (Foreign Key)
        public string? ImageUrl { get; set; }
        public int Stock { get; set; } = 0;     // الكمية المتوفرة في المخزون
        public bool IsAvailable { get; set; } = true; // هل الصنف متاح للبيع؟

        // العلاقات
        [JsonIgnore]
        public Category? Category { get; set; } // التصنيف اللي ينتمي له
        
        [JsonIgnore]
        public List<OrderItem> OrderItems { get; set; } = new();
    }
}