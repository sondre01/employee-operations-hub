using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Data;
using EmployeeHub.Api.Services.Implementations;
using EmployeeHub.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure EF Core (Auto-supports Supabase, PostgreSQL, or local SQLite)
var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider");
var rawConnection = Environment.GetEnvironmentVariable("SUPABASE_DB_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

bool isPostgres = (!string.IsNullOrWhiteSpace(dbProvider) && dbProvider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase))
    || (!string.IsNullOrWhiteSpace(rawConnection) && (
        rawConnection.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        rawConnection.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
        rawConnection.Contains("supabase.co", StringComparison.OrdinalIgnoreCase) ||
        rawConnection.Contains("supabase.com", StringComparison.OrdinalIgnoreCase) ||
        rawConnection.Contains("Host=", StringComparison.OrdinalIgnoreCase)
    ));

if (isPostgres)
{
    var connectionString = ParsePostgreSqlConnectionString(rawConnection ?? "Host=localhost;Port=5432;Database=employee_hub;Username=postgres;Password=postgres");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "employee_hub");
        }));
}
else
{
    // Frictionless local SQLite database (zero local database setup required)
    var sqliteConn = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=employee_hub.db";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(sqliteConn));
}

builder.Services.AddSingleton<IVerificationService, VerificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IAccessService, AccessService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IHardwareService, HardwareService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IHolidayService, HolidayService>();
builder.Services.AddScoped<IPolicyService, PolicyService>();
builder.Services.AddSingleton<IGmailInboundEmailService, GmailInboundEmailService>();
builder.Services.AddHostedService(sp => (GmailInboundEmailService)sp.GetRequiredService<IGmailInboundEmailService>());

// 3. Add Controllers with String Enum JSON Serializer
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 4. Configure CORS (Supports Localhost, Vite, Docker, Vercel, and Cloud Hosting)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() 
    { 
        Title = "Employee Operations Hub API", 
        Version = "v1",
        Description = "Enterprise REST API supporting workforce operations, client delivery, hardware custody, service desk, and cross-border utilities."
    });
});

var app = builder.Build();

// 6. Initialize Database & Seed Realistic Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        await DbInitializer.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Database connection not available yet or initialization deferred. Skipping immediate seed.");
    }
}

// 7. Configure HTTP Pipeline
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Operations Hub API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();

static string ParsePostgreSqlConnectionString(string raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return raw;
    if (!raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
        !raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        return raw;
    }

    try
    {
        var uri = new Uri(raw);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "postgres";
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        if (string.IsNullOrEmpty(database)) database = "postgres";

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;Pooling=true;";
    }
    catch
    {
        return raw;
    }
}
