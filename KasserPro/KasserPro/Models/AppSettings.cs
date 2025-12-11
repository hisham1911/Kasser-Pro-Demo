namespace KasserPro.Api.Models
{
    public class AppSettings
    {
        public int Id { get; set; } = 1; // دائماً صف واحد فقط
        public bool TaxEnabled { get; set; } = true;
        public decimal TaxRate { get; set; } = 14m; // نسبة مئوية
        public string StoreName { get; set; } = "KasserPro";
        public string Currency { get; set; } = "ج.م";
    }
}
