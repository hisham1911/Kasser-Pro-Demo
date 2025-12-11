using KasserPro.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// استخدام PostgreSQL في Production و SQLite محلياً
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var pgHost = Environment.GetEnvironmentVariable("PGHOST");
var pgDatabase = Environment.GetEnvironmentVariable("PGDATABASE");
var pgUser = Environment.GetEnvironmentVariable("PGUSER");
var pgPassword = Environment.GetEnvironmentVariable("PGPASSWORD");
var pgPort = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";

string? connectionString = null;

// الطريقة 1: استخدام المتغيرات المنفصلة من Railway
if (!string.IsNullOrEmpty(pgHost) && !string.IsNullOrEmpty(pgDatabase))
{
    connectionString = $"Host={pgHost};Port={pgPort};Database={pgDatabase};Username={pgUser};Password={pgPassword};SSL Mode=Require;Trust Server Certificate=true";
    Console.WriteLine($"Using PostgreSQL with separate env vars: Host={pgHost}, Database={pgDatabase}");
}
// الطريقة 2: تحويل DATABASE_URL
else if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
        {
            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':');
            var database = uri.AbsolutePath.TrimStart('/');
            connectionString = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={database};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
            Console.WriteLine($"Converted DATABASE_URL to: Host={uri.Host}, Database={database}");
        }
        else
        {
            // ربما تكون الصيغة صحيحة مباشرة
            connectionString = databaseUrl;
            Console.WriteLine("Using DATABASE_URL directly");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error parsing DATABASE_URL: {ex.Message}");
    }
}

if (!string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("Configuring PostgreSQL...");
    builder.Services.AddDbContext<KasserDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Development - SQLite
    Console.WriteLine("Using SQLite for development...");
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
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<KasserDbContext>();
        
        // للـ PostgreSQL نستخدم EnsureCreated لإنشاء الجداول بشكل صحيح
        var isPostgres = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PGHOST")) ||
                         !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"));
        
        if (isPostgres)
        {
            Console.WriteLine("Using PostgreSQL - Creating database schema...");
            db.Database.EnsureCreated();
            Console.WriteLine("PostgreSQL schema created successfully!");
        }
        else
        {
            Console.WriteLine("Using SQLite - Applying migrations...");
            db.Database.Migrate();
            Console.WriteLine("SQLite migrations applied successfully!");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error setting up database: {ex.Message}");
}

// Enable Swagger in all environments
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "KasserPro API v1");
    c.RoutePrefix = "swagger";
});

// app.UseHttpsRedirection(); // معطل عشان نستخدم HTTP في التطوير
app.UseCors("AllowAll");
app.MapControllers();

// إضافة endpoint بسيط للتأكد أن الـ API يعمل
app.MapGet("/", () => Results.Ok(new { message = "KasserPro API is running!", swagger = "/swagger" }));

app.Run();