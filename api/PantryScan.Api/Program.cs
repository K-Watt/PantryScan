using Dapper;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

// Local dev connection string (matches your local.publish.xml)
var connString = builder.Configuration.GetConnectionString("Sql")
	?? "Server=localhost;Database=PantryScanDB;Trusted_Connection=True;TrustServerCertificate=True;";

// Allow local HTML to call this API
builder.Services.AddCors(opt =>
{
	opt.AddDefaultPolicy(p => p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var app = builder.Build();
app.UseCors();

// Simple health check
app.MapGet("/", () => "PantryScan API running");

// GET /items  -> returns all items
app.MapGet("/items", async () =>
{
	using var conn = new SqlConnection(connString);
	var rows = await conn.QueryAsync("SELECT ItemId, Name, Quantity, CreatedAt FROM dbo.Items ORDER BY ItemId DESC");
	return Results.Ok(rows);
});

// POST /items -> create item { name, quantity }
app.MapPost("/items", async (ItemDto dto) =>
{
	using var conn = new SqlConnection(connString);
	var sql = @"INSERT INTO dbo.Items(Name, Quantity) VALUES (@Name, @Quantity);
				SELECT CAST(SCOPE_IDENTITY() AS int);";
	var id = await conn.ExecuteScalarAsync<int>(sql, new { dto.Name, dto.Quantity });
	return Results.Created($"/items/{id}", new { ItemId = id, dto.Name, dto.Quantity });
});

app.Run();

record ItemDto(string Name, int Quantity);
