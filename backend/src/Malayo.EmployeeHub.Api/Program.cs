using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Malayo.EmployeeHub.Api.Data;
using Malayo.EmployeeHub.Api.Services.Implementations;
using Malayo.EmployeeHub.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure EF Core (Auto-selects SQLite for instant local dev, or PostgreSQL when in Docker/configured)
var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "Sqlite";
var postgresConn = builder.Configuration.GetConnectionString("DefaultConnection");

if (dbProvider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase))
{
    var connectionString = postgresConn ?? "Host=localhost;Port=5432;Database=malayo_hub;Username=postgres;Password=postgres";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Frictionless local SQLite database (zero local database setup required)
    var sqliteConn = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=malayo_hub.db";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(sqliteConn));
}

// 2. Register Business Logic Services
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IHardwareService, HardwareService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IHolidayService, HolidayService>();
builder.Services.AddScoped<IPolicyService, PolicyService>();

// 3. Add Controllers with String Enum JSON Serializer
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 4. Configure CORS for Frontend Development (Supports Vite, Docker, and VS Code Go Live on port 5500)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => new Uri(origin).Host is "localhost" or "127.0.0.1")
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
        Title = "Malayo International Employee Operations Hub API", 
        Version = "v1",
        Description = "Backend REST API supporting Manila developers, Danish clients, hardware custody, service desk, and cross-border utilities."
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Malayo Ops Hub API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
