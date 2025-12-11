using KasserPro.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// استخدام PostgreSQL في Production و SQLite محلياً
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(connectionString))
{
    // Production - PostgreSQL on Render
    // تحويل رابط Render إلى صيغة Npgsql
    if (connectionString.StartsWith("postgres://"))
    {
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':');
        connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    }
    
    builder.Services.AddDbContext<KasserDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Development - SQLite
    builder.Services.AddDbContext<KasserDbContext>(options =>
        options.UseSqlite("Data Source=database.db"));
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS عشان React يشتغل
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// إنشاء الداتابيز أوتوماتيك لو مش موجودة
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KasserDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Enable Swagger in production for testing
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // معطل عشان نستخدم HTTP في التطوير
app.UseCors("AllowAll");
app.MapControllers();

app.Run();