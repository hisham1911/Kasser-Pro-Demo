using System.Text.Json.Serialization;

namespace KasserPro.Api.Models
{
    public class User
    {
        public int Id { get; set; }                          // رقم المستخدم
        public string Username { get; set; } = string.Empty; // اسم المستخدم للدخول
        public string PasswordHash { get; set; } = string.Empty; // كلمة المرور (مشفرة)
        public string FullName { get; set; } = string.Empty; // الاسم الكامل
        public string Role { get; set; } = "Cashier";        // الدور: Admin, Cashier, Manager
        public bool IsActive { get; set; } = true;           // هل الحساب نشط؟
        public DateTime CreatedAt { get; set; } = DateTime.Now; // تاريخ إنشاء الحساب
        
        // علاقة: مستخدم واحد ممكن يعمل طلبات كتير
        [JsonIgnore]
        public List<Order> Orders { get; set; } = new();
    }
}
