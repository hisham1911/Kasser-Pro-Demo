using System.Text.Json.Serialization;

namespace KasserPro.Api.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal PriceAtTime { get; set; } // سعر الصنف وقت الطلب

        // العلاقات
        [JsonIgnore]
        public Order Order { get; set; } = null!;
        
        public Product? Product { get; set; }
    }
}