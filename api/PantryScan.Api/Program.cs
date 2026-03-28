using Dapper;
using Microsoft.Data.SqlClient;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var connString = builder.Configuration.GetConnectionString("Sql")
	?? "Server=localhost,1433;Database=PantryScanDB;User Id=sa;Password=PantryScanP@ss1;TrustServerCertificate=True;";

builder.Services.AddCors(opt =>
{
	opt.AddDefaultPolicy(p => p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});
builder.Services.AddHttpClient();

var app = builder.Build();

// Allow Chrome Private Network Access (file:// → localhost)
app.Use(async (ctx, next) =>
{
	ctx.Response.OnStarting(() =>
	{
		if (ctx.Request.Headers.ContainsKey("Access-Control-Request-Private-Network"))
			ctx.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
		return Task.CompletedTask;
	});
	await next(ctx);
});

app.UseCors();

await EnsureDatabaseAsync(connString);
await EnsureSchemaAsync(connString);

app.MapGet("/", () => "PantryScan API running");

app.MapGet("/items", async () =>
{
	using var conn = new SqlConnection(connString);
	var rows = await conn.QueryAsync("SELECT ItemId, Name, Quantity, CreatedAt FROM dbo.Items ORDER BY ItemId DESC");
	return Results.Ok(rows);
});

app.MapPost("/items", async (ItemDto dto) =>
{
	if (string.IsNullOrWhiteSpace(dto.Name)) return Results.BadRequest(new { error = "Name is required." });
	if (dto.Quantity < 0) return Results.BadRequest(new { error = "Quantity cannot be negative." });

	using var conn = new SqlConnection(connString);
	var id = await conn.ExecuteScalarAsync<int>(@"
		INSERT INTO dbo.Items(Name, Quantity) VALUES (@Name, @Quantity);
		SELECT CAST(SCOPE_IDENTITY() AS int);",
		new { Name = dto.Name.Trim(), dto.Quantity });

	return Results.Created($"/items/{id}", new { ItemId = id, Name = dto.Name.Trim(), dto.Quantity });
});

app.MapGet("/agent/context", async () =>
{
	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();

	var itemsCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.Items;");
	var recipesCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.Recipes;");
	var mealPlansCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.MealPlanEntries;");
	var shoppingCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.ShoppingItems;");

	return Results.Ok(new
	{
		counts = new
		{
			items = itemsCount,
			recipes = recipesCount,
			mealPlanEntries = mealPlansCount,
			shoppingItems = shoppingCount
		},
		capabilities = new { inventory = true, recipes = true, mealPlans = true, shopping = true },
		storage = new { planner = "sql", recipes = "sql", shopping = "sql" }
	});
});

app.MapGet("/agent/schema", () =>
{
	return Results.Ok(new
	{
		version = "1.0",
		entities = new[]
		{
			new
			{
				name = "PantryItem",
				endpoint = "/items",
				fields = new[]
				{
					new { name = "itemId", type = "int", required = false, note = "Auto-assigned" },
					new { name = "name", type = "string", required = true, note = "Trimmed, max 200 chars" },
					new { name = "quantity", type = "int", required = true, note = "Must be >= 0; 0 = out of stock" }
				},
				safeOperations = new[] { "GET /items" },
				destructiveOperations = new[] { "DELETE /items/{id}" }
			},
			new
			{
				name = "Recipe",
				endpoint = "/recipes",
				fields = new[]
				{
					new { name = "recipeId", type = "int", required = false, note = "Auto-assigned" },
					new { name = "name", type = "string", required = true, note = "" },
					new { name = "course", type = "string", required = false, note = "Breakfast|Lunch|Dinner|Snack|Dessert|Side|Drink" },
					new { name = "cuisine", type = "string", required = false, note = "Free text" },
					new { name = "tags", type = "string[]", required = false, note = "Free-form array" },
					new { name = "rating", type = "int", required = false, note = "0-5; 0=unrated" },
					new { name = "servings", type = "int", required = false, note = "" },
					new { name = "ingredients", type = "string[]", required = false, note = "" },
					new { name = "steps", type = "string[]", required = false, note = "Ordered instructions" }
				},
				safeOperations = new[] { "GET /recipes" },
				destructiveOperations = new[] { "DELETE /recipes/{id}" }
			},
			new
			{
				name = "MealPlanEntry",
				endpoint = "/meal-plans",
				fields = new[]
				{
					new { name = "planDate", type = "date", required = true, note = "YYYY-MM-DD" },
					new { name = "mealType", type = "string", required = true, note = "Breakfast|Lunch|Dinner|Snack|Notes" },
					new { name = "recipeId", type = "int?", required = false, note = "Links to Recipe" },
					new { name = "recipeName", type = "string", required = true, note = "Required unless mealType=Notes" },
					new { name = "notes", type = "string", required = false, note = "Required if mealType=Notes" }
				},
				safeOperations = new[] { "GET /meal-plans", "POST /meal-plans (upsert)" },
				destructiveOperations = new[] { "DELETE /meal-plans" }
			},
			new
			{
				name = "ShoppingItem",
				endpoint = "/shopping",
				fields = new[]
				{
					new { name = "clientId", type = "string", required = true, note = "Client-provided unique ID (UUID recommended)" },
					new { name = "name", type = "string", required = true, note = "" },
					new { name = "qty", type = "string", required = false, note = "Free text e.g. '2 lbs'" },
					new { name = "category", type = "string", required = false, note = "Produce|Dairy|Meat|Pantry|Frozen|etc." },
					new { name = "isChecked", type = "bool", required = false, note = "True = purchased/in cart" }
				},
				safeOperations = new[] { "GET /shopping", "POST /shopping/items" },
				destructiveOperations = new[] { "DELETE /shopping/items/{clientId}", "DELETE /shopping/checked" }
			}
		},
		allowedValues = new
		{
			mealType = new[] { "Breakfast", "Lunch", "Dinner", "Snack", "Notes" },
			course = new[] { "Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Side", "Drink", "Uncategorized" },
			shoppingCategory = new[] { "Produce", "Dairy", "Meat", "Seafood", "Bakery", "Frozen", "Pantry", "Beverages", "Snacks", "Household", "Personal Care", "Other" }
		},
		writeEnvelope = new
		{
			note = "Write endpoints accept optional idempotencyKey and audit fields",
			idempotencyKey = "string (UUID) — prevents duplicate writes on retry",
			audit = new { actionId = "string", actor = "string", source = "string", requestedAtUtc = "ISO 8601 datetime" }
		}
	});
});

app.MapGet("/recipes", async () =>
{
	using var conn = new SqlConnection(connString);
	var rows = await conn.QueryAsync(@"
		SELECT
			RecipeId,
			Name,
			Course,
			Cuisine,
			Source,
			TagsJson,
			Rating,
			COALESCE(AddedAt, CreatedAt) AS AddedAt,
			Servings,
			IngredientsJson,
			StepsJson,
			Comments,
			ImageUrl,
			CreatedAt
		FROM dbo.Recipes
		ORDER BY RecipeId DESC");
	return Results.Ok(rows);
});

app.MapPost("/recipes", async (RecipeCreateDto dto) =>
{
	if (string.IsNullOrWhiteSpace(dto.Name)) return Results.BadRequest(new { error = "Name is required." });

	var name = dto.Name.Trim();
	var tags = dto.Tags ?? [];
	var ingredients = dto.Ingredients ?? [];
	var steps = dto.Steps ?? [];
	var addedAt = dto.AddedAtUnixMs.HasValue
		? DateTimeOffset.FromUnixTimeMilliseconds(dto.AddedAtUnixMs.Value).UtcDateTime
		: (DateTime?)null;

	using var conn = new SqlConnection(connString);
	var id = await conn.ExecuteScalarAsync<int>(@"
		INSERT INTO dbo.Recipes(Name, Course, Cuisine, Source, TagsJson, Rating, AddedAt, Servings, IngredientsJson, StepsJson, Comments, ImageUrl)
		VALUES (@Name, @Course, @Cuisine, @Source, @TagsJson, @Rating, @AddedAt, @Servings, @IngredientsJson, @StepsJson, @Comments, @ImageUrl);
		SELECT CAST(SCOPE_IDENTITY() AS int);",
		new
		{
			Name = name,
			Course = string.IsNullOrWhiteSpace(dto.Course) ? "Uncategorized" : dto.Course.Trim(),
			Cuisine = string.IsNullOrWhiteSpace(dto.Cuisine) ? null : dto.Cuisine.Trim(),
			Source = string.IsNullOrWhiteSpace(dto.Source) ? null : dto.Source.Trim(),
			TagsJson = JsonSerializer.Serialize(tags),
			Rating = dto.Rating.GetValueOrDefault(0),
			AddedAt = addedAt,
			dto.Servings,
			IngredientsJson = JsonSerializer.Serialize(ingredients),
			StepsJson = JsonSerializer.Serialize(steps),
			Comments = string.IsNullOrWhiteSpace(dto.Comments) ? null : dto.Comments.Trim(),
			ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim()
		});

	return Results.Created($"/recipes/{id}", new { recipeId = id, Name = name, dto.Servings });
});

app.MapPost("/recipes/bulk", async (RecipeBulkCreateDto dto) =>
{
	if (dto.Entries is null || dto.Entries.Length == 0)
	{
		return Results.BadRequest(new { error = "At least one entry is required." });
	}

	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();
	using var tx = conn.BeginTransaction();

	var processed = 0;
	foreach (var entry in dto.Entries)
	{
		if (string.IsNullOrWhiteSpace(entry.Name))
		{
			continue;
		}

		var name = entry.Name.Trim();
		var tags = entry.Tags ?? [];
		var ingredients = entry.Ingredients ?? [];
		var steps = entry.Steps ?? [];
		var addedAt = entry.AddedAtUnixMs.HasValue
			? DateTimeOffset.FromUnixTimeMilliseconds(entry.AddedAtUnixMs.Value).UtcDateTime
			: (DateTime?)null;

		await conn.ExecuteAsync(@"
			IF NOT EXISTS (SELECT 1 FROM dbo.Recipes WHERE Name = @Name)
			BEGIN
				INSERT INTO dbo.Recipes(Name, Course, Cuisine, Source, TagsJson, Rating, AddedAt, Servings, IngredientsJson, StepsJson, Comments, ImageUrl)
				VALUES (@Name, @Course, @Cuisine, @Source, @TagsJson, @Rating, @AddedAt, @Servings, @IngredientsJson, @StepsJson, @Comments, @ImageUrl);
			END",
			new
			{
				Name = name,
				Course = string.IsNullOrWhiteSpace(entry.Course) ? "Uncategorized" : entry.Course.Trim(),
				Cuisine = string.IsNullOrWhiteSpace(entry.Cuisine) ? null : entry.Cuisine.Trim(),
				Source = string.IsNullOrWhiteSpace(entry.Source) ? null : entry.Source.Trim(),
				TagsJson = JsonSerializer.Serialize(tags),
				Rating = entry.Rating.GetValueOrDefault(0),
				AddedAt = addedAt,
				entry.Servings,
				IngredientsJson = JsonSerializer.Serialize(ingredients),
				StepsJson = JsonSerializer.Serialize(steps),
				Comments = string.IsNullOrWhiteSpace(entry.Comments) ? null : entry.Comments.Trim(),
				ImageUrl = string.IsNullOrWhiteSpace(entry.ImageUrl) ? null : entry.ImageUrl.Trim()
			}, tx);

		processed++;
	}

	await tx.CommitAsync();
	return Results.Ok(new { accepted = dto.Entries.Length, processed });
});

app.MapPatch("/recipes/{id:int}", async (int id, RecipePatchDto dto) =>
{
	using var conn = new SqlConnection(connString);

	var exists = await conn.ExecuteScalarAsync<int?>("SELECT RecipeId FROM dbo.Recipes WHERE RecipeId = @id", new { id });
	if (exists is null) return Results.NotFound();

	var setClauses = new List<string>();
	var parameters = new DynamicParameters();
	parameters.Add("id", id);

	if (dto.Name is not null)
	{
		var name = dto.Name.Trim();
		if (!string.IsNullOrWhiteSpace(name)) { setClauses.Add("Name = @Name"); parameters.Add("Name", name); }
	}
	if (dto.Course is not null) { setClauses.Add("Course = @Course"); parameters.Add("Course", string.IsNullOrWhiteSpace(dto.Course) ? "Uncategorized" : dto.Course.Trim()); }
	if (dto.Cuisine is not null) { setClauses.Add("Cuisine = @Cuisine"); parameters.Add("Cuisine", string.IsNullOrWhiteSpace(dto.Cuisine) ? null : dto.Cuisine.Trim()); }
	if (dto.Source is not null) { setClauses.Add("Source = @Source"); parameters.Add("Source", string.IsNullOrWhiteSpace(dto.Source) ? null : dto.Source.Trim()); }
	if (dto.Tags is not null) { setClauses.Add("TagsJson = @TagsJson"); parameters.Add("TagsJson", JsonSerializer.Serialize(dto.Tags)); }
	if (dto.Rating is not null) { setClauses.Add("Rating = @Rating"); parameters.Add("Rating", dto.Rating.Value); }
	if (dto.Servings is not null) { setClauses.Add("Servings = @Servings"); parameters.Add("Servings", dto.Servings.Value); }
	if (dto.Ingredients is not null) { setClauses.Add("IngredientsJson = @IngredientsJson"); parameters.Add("IngredientsJson", JsonSerializer.Serialize(dto.Ingredients)); }
	if (dto.Steps is not null) { setClauses.Add("StepsJson = @StepsJson"); parameters.Add("StepsJson", JsonSerializer.Serialize(dto.Steps)); }
	if (dto.Comments is not null) { setClauses.Add("Comments = @Comments"); parameters.Add("Comments", string.IsNullOrWhiteSpace(dto.Comments) ? null : dto.Comments.Trim()); }
	if (dto.ImageUrl is not null) { setClauses.Add("ImageUrl = @ImageUrl"); parameters.Add("ImageUrl", string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim()); }

	if (setClauses.Count == 0) return Results.NoContent();

	await conn.ExecuteAsync($"UPDATE dbo.Recipes SET {string.Join(", ", setClauses)} WHERE RecipeId = @id", parameters);
	return Results.NoContent();
});

app.MapGet("/recipes/find-image", async (string name) =>
{
	try
	{
		using var http = new HttpClient();
		http.DefaultRequestHeaders.UserAgent.ParseAdd(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
		http.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");

		var url = $"https://www.bing.com/images/search?q={Uri.EscapeDataString(name + " recipe")}&first=1&count=1&safeSearch=Moderate";
		var html = await http.GetStringAsync(url);

		var match = System.Text.RegularExpressions.Regex.Match(html, @"th\?id=(OIP\.[A-Za-z0-9_\-]+)");
		if (!match.Success)
			return Results.Ok(new { imageUrl = (string?)null });

		var imageUrl = $"https://www.bing.com/th?id={match.Groups[1].Value}&pid=Api&w=600&h=400&rs=1&c=4";
		return Results.Ok(new { imageUrl });
	}
	catch
	{
		return Results.Ok(new { imageUrl = (string?)null });
	}
});

app.MapGet("/meal-plans", async () =>
{
	using var conn = new SqlConnection(connString);
	var rows = await conn.QueryAsync("SELECT MealPlanEntryId, PlanDate, MealType, RecipeId, RecipeName, Notes, CreatedAt FROM dbo.MealPlanEntries ORDER BY PlanDate DESC, MealPlanEntryId DESC");
	return Results.Ok(rows);
});

app.MapPost("/meal-plans", async (MealPlanEntryCreateDto dto) =>
{
	if (dto.PlanDate == default) return Results.BadRequest(new { error = "PlanDate is required." });
	if (string.IsNullOrWhiteSpace(dto.MealType)) return Results.BadRequest(new { error = "MealType is required." });

	var mealType = dto.MealType.Trim();
	if (string.Equals(mealType, "Notes", StringComparison.OrdinalIgnoreCase))
	{
		if (string.IsNullOrWhiteSpace(dto.Notes)) return Results.BadRequest(new { error = "Notes is required for Notes meal type." });
		var planDateValue = dto.PlanDate.ToDateTime(TimeOnly.MinValue);

		using var conn = new SqlConnection(connString);
		var id = await conn.ExecuteScalarAsync<int>(@"
			DECLARE @ExistingId INT = (
				SELECT TOP 1 MealPlanEntryId FROM dbo.MealPlanEntries
				WHERE PlanDate = @PlanDate AND MealType = 'Notes'
				ORDER BY MealPlanEntryId DESC
			);

			IF @ExistingId IS NULL
			BEGIN
				INSERT INTO dbo.MealPlanEntries(PlanDate, MealType, RecipeId, RecipeName, Notes)
				VALUES (@PlanDate, 'Notes', NULL, 'Note', @Notes);
				SELECT CAST(SCOPE_IDENTITY() AS int);
			END
			ELSE
			BEGIN
				UPDATE dbo.MealPlanEntries SET Notes = @Notes WHERE MealPlanEntryId = @ExistingId;
				SELECT @ExistingId;
			END",
			new { PlanDate = planDateValue, Notes = dto.Notes?.Trim() });

		return Results.Created($"/meal-plans/{id}", new { mealPlanEntryId = id });
	}

	if (string.IsNullOrWhiteSpace(dto.RecipeName)) return Results.BadRequest(new { error = "RecipeName is required." });
	var entryDateValue = dto.PlanDate.ToDateTime(TimeOnly.MinValue);

	using (var conn = new SqlConnection(connString))
	{
		var id = await conn.ExecuteScalarAsync<int>(@"
			DECLARE @ExistingId INT = (
				SELECT TOP 1 MealPlanEntryId FROM dbo.MealPlanEntries
				WHERE PlanDate = @PlanDate AND MealType = @MealType AND RecipeName = @RecipeName
				ORDER BY MealPlanEntryId DESC
			);

			IF @ExistingId IS NULL
			BEGIN
				INSERT INTO dbo.MealPlanEntries(PlanDate, MealType, RecipeId, RecipeName, Notes)
				VALUES (@PlanDate, @MealType, @RecipeId, @RecipeName, @Notes);
				SELECT CAST(SCOPE_IDENTITY() AS int);
			END
			ELSE
			BEGIN
				SELECT @ExistingId;
			END",
			new
			{
				PlanDate = entryDateValue,
				MealType = mealType,
				dto.RecipeId,
				RecipeName = dto.RecipeName.Trim(),
				Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim()
			});

		return Results.Created($"/meal-plans/{id}", new { mealPlanEntryId = id });
	}
});

app.MapPost("/meal-plans/bulk", async (MealPlanBulkCreateDto dto) =>
{
	if (dto.Entries is null || dto.Entries.Length == 0) return Results.BadRequest(new { error = "At least one entry is required." });

	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();
	using var tx = conn.BeginTransaction();

	var processed = 0;
	foreach (var entry in dto.Entries)
	{
		if (entry.PlanDate == default || string.IsNullOrWhiteSpace(entry.MealType)) continue;
		var bulkPlanDateValue = entry.PlanDate.ToDateTime(TimeOnly.MinValue);

		var mealType = entry.MealType.Trim();
		if (string.Equals(mealType, "Notes", StringComparison.OrdinalIgnoreCase))
		{
			if (string.IsNullOrWhiteSpace(entry.Notes)) continue;
			await conn.ExecuteAsync(@"
				IF NOT EXISTS (SELECT 1 FROM dbo.MealPlanEntries WHERE PlanDate = @PlanDate AND MealType = 'Notes')
				BEGIN
					INSERT INTO dbo.MealPlanEntries(PlanDate, MealType, RecipeId, RecipeName, Notes)
					VALUES (@PlanDate, 'Notes', NULL, 'Note', @Notes);
				END
				ELSE
				BEGIN
					UPDATE dbo.MealPlanEntries SET Notes = @Notes WHERE PlanDate = @PlanDate AND MealType = 'Notes';
				END",
				new { PlanDate = bulkPlanDateValue, Notes = entry.Notes?.Trim() }, tx);
			processed++;
			continue;
		}

		if (string.IsNullOrWhiteSpace(entry.RecipeName)) continue;

		await conn.ExecuteAsync(@"
			IF NOT EXISTS (
				SELECT 1 FROM dbo.MealPlanEntries
				WHERE PlanDate = @PlanDate AND MealType = @MealType AND RecipeName = @RecipeName
			)
			BEGIN
				INSERT INTO dbo.MealPlanEntries(PlanDate, MealType, RecipeId, RecipeName, Notes)
				VALUES (@PlanDate, @MealType, @RecipeId, @RecipeName, @Notes);
			END",
			new
			{
				PlanDate = bulkPlanDateValue,
				MealType = mealType,
				entry.RecipeId,
				RecipeName = entry.RecipeName?.Trim(),
				Notes = string.IsNullOrWhiteSpace(entry.Notes) ? null : entry.Notes.Trim()
			}, tx);
		processed++;
	}

	await tx.CommitAsync();
	return Results.Ok(new { accepted = dto.Entries.Length, processed });
});

app.MapDelete("/meal-plans", async (string planDate, string mealType, string recipeName) =>
{
	if (!DateOnly.TryParse(planDate, out var parsedDate)) return Results.BadRequest(new { error = "planDate must be YYYY-MM-DD." });
	if (string.IsNullOrWhiteSpace(mealType) || string.IsNullOrWhiteSpace(recipeName)) return Results.BadRequest(new { error = "mealType and recipeName are required." });

	using var conn = new SqlConnection(connString);
	var deleted = await conn.ExecuteAsync(@"
		DELETE TOP (1)
		FROM dbo.MealPlanEntries
		WHERE PlanDate = @PlanDate AND MealType = @MealType AND RecipeName = @RecipeName;",
		new { PlanDate = parsedDate.ToDateTime(TimeOnly.MinValue), MealType = mealType.Trim(), RecipeName = recipeName.Trim() });

	return deleted > 0 ? Results.NoContent() : Results.NotFound(new { error = "Meal entry not found." });
});

app.MapPut("/meal-plans/note", async (MealPlanNoteUpsertDto dto) =>
{
	if (dto.PlanDate == default) return Results.BadRequest(new { error = "PlanDate is required." });
	var noteDateValue = dto.PlanDate.ToDateTime(TimeOnly.MinValue);

	using var conn = new SqlConnection(connString);
	await conn.ExecuteAsync(@"
		IF NOT EXISTS (SELECT 1 FROM dbo.MealPlanEntries WHERE PlanDate = @PlanDate AND MealType = 'Notes')
		BEGIN
			INSERT INTO dbo.MealPlanEntries(PlanDate, MealType, RecipeId, RecipeName, Notes)
			VALUES (@PlanDate, 'Notes', NULL, 'Note', @Notes);
		END
		ELSE
		BEGIN
			UPDATE dbo.MealPlanEntries SET Notes = @Notes
			WHERE PlanDate = @PlanDate AND MealType = 'Notes';
		END",
		new { PlanDate = noteDateValue, Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim() });

	return Results.NoContent();
});

static async Task EnsureDatabaseAsync(string connString)
{
	var masterConn = new SqlConnectionStringBuilder(connString) { InitialCatalog = "master" }.ConnectionString;
	using var conn = new SqlConnection(masterConn);
	await conn.OpenAsync();
	await conn.ExecuteAsync("IF DB_ID('PantryScanDB') IS NULL CREATE DATABASE PantryScanDB;");
}

static async Task EnsureSchemaAsync(string connString)
{
	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();

	await conn.ExecuteAsync(@"
		IF OBJECT_ID('dbo.Items', 'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[Items]
			(
				[ItemId] INT IDENTITY (1, 1) NOT NULL,
				[Name] NVARCHAR (200) NOT NULL,
				[Quantity] INT CONSTRAINT [DF_Items_Quantity] DEFAULT (0) NOT NULL,
				[CreatedAt] DATETIME2 (7) CONSTRAINT [DF_Items_CreatedAt] DEFAULT (SYSDATETIME()) NOT NULL,
				CONSTRAINT [PK_Items] PRIMARY KEY CLUSTERED ([ItemId] ASC)
			);
		END;

		IF OBJECT_ID('dbo.Recipes', 'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[Recipes]
			(
				[RecipeId] INT IDENTITY (1, 1) NOT NULL,
				[Name] NVARCHAR (200) NOT NULL,
				[Course] NVARCHAR (100) NULL,
				[Cuisine] NVARCHAR (300) NULL,
				[Source] NVARCHAR (200) NULL,
				[TagsJson] NVARCHAR (MAX) NULL,
				[Rating] INT CONSTRAINT [DF_Recipes_Rating] DEFAULT (0) NOT NULL,
				[AddedAt] DATETIME2 (7) NULL,
				[Servings] INT NULL,
				[IngredientsJson] NVARCHAR (MAX) NOT NULL,
				[StepsJson] NVARCHAR (MAX) NOT NULL,
				[CreatedAt] DATETIME2 (7) CONSTRAINT [DF_Recipes_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
				CONSTRAINT [PK_Recipes] PRIMARY KEY CLUSTERED ([RecipeId] ASC)
			);
		END;

		IF COL_LENGTH('dbo.Recipes', 'Course') IS NULL ALTER TABLE dbo.Recipes ADD [Course] NVARCHAR (100) NULL;
		IF COL_LENGTH('dbo.Recipes', 'Cuisine') IS NULL ALTER TABLE dbo.Recipes ADD [Cuisine] NVARCHAR (300) NULL;
		IF COL_LENGTH('dbo.Recipes', 'Source') IS NULL ALTER TABLE dbo.Recipes ADD [Source] NVARCHAR (200) NULL;
		IF COL_LENGTH('dbo.Recipes', 'TagsJson') IS NULL ALTER TABLE dbo.Recipes ADD [TagsJson] NVARCHAR (MAX) NULL;
		IF COL_LENGTH('dbo.Recipes', 'Rating') IS NULL ALTER TABLE dbo.Recipes ADD [Rating] INT CONSTRAINT [DF_Recipes_Rating_Upgrade] DEFAULT (0) NOT NULL;
		IF COL_LENGTH('dbo.Recipes', 'AddedAt') IS NULL ALTER TABLE dbo.Recipes ADD [AddedAt] DATETIME2 (7) NULL;

		IF OBJECT_ID('dbo.MealPlanEntries', 'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[MealPlanEntries]
			(
				[MealPlanEntryId] INT IDENTITY (1, 1) NOT NULL,
				[PlanDate] DATE NOT NULL,
				[MealType] NVARCHAR (40) NOT NULL,
				[RecipeId] INT NULL,
				[RecipeName] NVARCHAR (200) NOT NULL,
				[Notes] NVARCHAR (1000) NULL,
				[CreatedAt] DATETIME2 (7) CONSTRAINT [DF_MealPlanEntries_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
				CONSTRAINT [PK_MealPlanEntries] PRIMARY KEY CLUSTERED ([MealPlanEntryId] ASC),
				CONSTRAINT [FK_MealPlanEntries_Recipes_RecipeId] FOREIGN KEY ([RecipeId]) REFERENCES [dbo].[Recipes] ([RecipeId])
			);
		END;

		IF OBJECT_ID('dbo.ShoppingItems', 'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[ShoppingItems]
			(
				[ShoppingItemId] INT IDENTITY (1, 1) NOT NULL,
				[ClientId] NVARCHAR (64) NOT NULL,
				[Name] NVARCHAR (200) NOT NULL,
				[Qty] NVARCHAR (100) NULL,
				[Category] NVARCHAR (100) NULL,
				[Store] NVARCHAR (200) NULL,
				[Note] NVARCHAR (500) NULL,
				[RecipesJson] NVARCHAR (MAX) NULL,
				[IsChecked] BIT CONSTRAINT [DF_ShoppingItems_IsChecked] DEFAULT (0) NOT NULL,
				[CreatedAt] DATETIME2 (7) CONSTRAINT [DF_ShoppingItems_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
				CONSTRAINT [PK_ShoppingItems] PRIMARY KEY CLUSTERED ([ShoppingItemId] ASC),
				CONSTRAINT [UQ_ShoppingItems_ClientId] UNIQUE ([ClientId])
			);
		END;

		IF OBJECT_ID('dbo.Users', 'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[Users]
			(
				[UserId] INT IDENTITY (1, 1) NOT NULL,
				[DisplayName] NVARCHAR (100) NOT NULL,
				[Email] NVARCHAR (200) NOT NULL,
				[PasswordHash] NVARCHAR (200) NOT NULL,
				[Role] NVARCHAR (20) CONSTRAINT [DF_Users_Role] DEFAULT ('member') NOT NULL,
				[CreatedAt] DATETIME2 (7) CONSTRAINT [DF_Users_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
				CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserId] ASC),
				CONSTRAINT [UQ_Users_Email] UNIQUE ([Email])
			);
		END;

		IF OBJECT_ID('dbo.UserSessions', 'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[UserSessions]
			(
				[SessionId] INT IDENTITY (1, 1) NOT NULL,
				[SessionToken] NVARCHAR (64) NOT NULL,
				[UserId] INT NOT NULL,
				[ExpiresAt] DATETIME2 (7) NOT NULL,
				[CreatedAt] DATETIME2 (7) CONSTRAINT [DF_UserSessions_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
				CONSTRAINT [PK_UserSessions] PRIMARY KEY CLUSTERED ([SessionId] ASC),
				CONSTRAINT [UQ_UserSessions_Token] UNIQUE ([SessionToken]),
				CONSTRAINT [FK_UserSessions_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId])
			);
		END;
	");
}

app.MapPost("/recipes/import", async (RecipeImportDto dto, IHttpClientFactory httpClientFactory) =>
{
	if (string.IsNullOrWhiteSpace(dto.Url)) return Results.BadRequest(new { error = "Url is required." });
	if (!Uri.TryCreate(dto.Url?.Trim(), UriKind.Absolute, out var uri) || (uri.Scheme != "http" && uri.Scheme != "https"))
		return Results.BadRequest(new { error = "Invalid URL. Must start with http:// or https://" });

	try
	{
		using var client = httpClientFactory.CreateClient();
		client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36");
		client.DefaultRequestHeaders.Accept.ParseAdd("text/html,application/xhtml+xml");
		client.Timeout = TimeSpan.FromSeconds(20);

		var html = await client.GetStringAsync(uri);

		var jsonLdRegex = new System.Text.RegularExpressions.Regex(
			@"<script[^>]+type\s*=\s*[""']application/ld\+json[""'][^>]*>([\s\S]*?)<\/script>",
			System.Text.RegularExpressions.RegexOptions.IgnoreCase);

		JsonElement? recipeNode = null;
		foreach (System.Text.RegularExpressions.Match m in jsonLdRegex.Matches(html))
		{
			var jsonText = m.Groups[1].Value.Trim();
			try
			{
				using var doc = JsonDocument.Parse(jsonText);
				var found = FindRecipeNode(doc.RootElement);
				if (found.HasValue) { recipeNode = found.Value.Clone(); break; }
			}
			catch { /* skip malformed */ }
		}

		if (recipeNode is null)
			return Results.NotFound(new { error = "No recipe data found on that page. The site may not embed structured recipe data." });

		var node = recipeNode.Value;
		var name = GetStringProp(node, "name") ?? "Untitled Recipe";

		var ingredients = new List<string>();
		if (node.TryGetProperty("recipeIngredient", out var ingProp) && ingProp.ValueKind == JsonValueKind.Array)
			foreach (var el in ingProp.EnumerateArray())
				if (el.ValueKind == JsonValueKind.String) ingredients.Add(el.GetString()!);

		var steps = new List<string>();
		if (node.TryGetProperty("recipeInstructions", out var instProp))
		{
			if (instProp.ValueKind == JsonValueKind.String)
			{
				steps.Add(instProp.GetString()!);
			}
			else if (instProp.ValueKind == JsonValueKind.Array)
			{
				foreach (var el in instProp.EnumerateArray())
				{
					if (el.ValueKind == JsonValueKind.String)
					{
						steps.Add(el.GetString()!);
					}
					else if (el.ValueKind == JsonValueKind.Object)
					{
						var elType = GetStringProp(el, "@type") ?? "";
						if (elType == "HowToSection" && el.TryGetProperty("itemListElement", out var sectionItems) && sectionItems.ValueKind == JsonValueKind.Array)
							foreach (var sEl in sectionItems.EnumerateArray())
							{
								var t2 = GetStringProp(sEl, "text") ?? GetStringProp(sEl, "name");
								if (t2 != null) steps.Add(t2);
							}
						else
						{
							var t2 = GetStringProp(el, "text") ?? GetStringProp(el, "name");
							if (t2 != null) steps.Add(t2);
						}
					}
				}
			}
		}

		int? servings = null;
		if (node.TryGetProperty("recipeYield", out var yieldProp))
		{
			var yieldStr = yieldProp.ValueKind == JsonValueKind.Array
				? yieldProp.EnumerateArray().Select(e => e.ToString()).FirstOrDefault()
				: yieldProp.ToString();
			var yieldMatch = System.Text.RegularExpressions.Regex.Match(yieldStr ?? "", @"\d+");
			if (yieldMatch.Success && int.TryParse(yieldMatch.Value, out var n)) servings = n;
		}

		var cuisine = GetStringOrFirstArray(node, "recipeCuisine");
		var course = GetStringOrFirstArray(node, "recipeCategory") ?? GetStringOrFirstArray(node, "recipeCourse");

		var tags = new List<string>();
		if (node.TryGetProperty("keywords", out var kwProp))
		{
			if (kwProp.ValueKind == JsonValueKind.String)
				tags = kwProp.GetString()!.Split(',').Select(t => t.Trim()).Where(t => t.Length > 0).ToList();
			else if (kwProp.ValueKind == JsonValueKind.Array)
				tags = kwProp.EnumerateArray().Select(e => e.GetString() ?? "").Where(t => t.Length > 0).ToList();
		}

		return Results.Ok(new { name, course, cuisine, source = uri.Host, tags, servings, ingredients, steps, sourceUrl = dto.Url });
	}
	catch (HttpRequestException ex)
	{
		return Results.BadRequest(new { error = $"Could not fetch the page: {ex.Message}" });
	}
	catch (TaskCanceledException)
	{
		return Results.BadRequest(new { error = "Request timed out. The site may be slow or blocking scrapers." });
	}
	catch (Exception ex)
	{
		return Results.Problem($"Import failed: {ex.Message}");
	}
});

app.MapGet("/shopping", async () =>
{
	using var conn = new SqlConnection(connString);
	var rows = (await conn.QueryAsync<ShoppingItemRow>(@"
		SELECT ClientId, Name, Qty, Category, Store, Note, RecipesJson, IsChecked
		FROM dbo.ShoppingItems
		ORDER BY ShoppingItemId ASC")).AsList();

	var items = rows.Select(r => new
	{
		id = r.ClientId,
		name = r.Name,
		qty = r.Qty ?? "",
		category = r.Category ?? "Other",
		store = r.Store ?? "",
		note = r.Note ?? "",
		recipes = string.IsNullOrEmpty(r.RecipesJson)
			? Array.Empty<string>()
			: JsonSerializer.Deserialize<string[]>(r.RecipesJson) ?? Array.Empty<string>()
	}).ToList();

	var checkedMap = rows
		.Where(r => r.IsChecked)
		.ToDictionary(r => r.ClientId, _ => true);

	return Results.Ok(new { items, @checked = checkedMap });
});

app.MapPost("/shopping/items", async (ShoppingItemDto dto) =>
{
	if (string.IsNullOrWhiteSpace(dto.Name)) return Results.BadRequest(new { error = "Name is required." });
	if (string.IsNullOrWhiteSpace(dto.ClientId)) return Results.BadRequest(new { error = "ClientId is required." });

	var recipesJson = dto.Recipes?.Length > 0 ? JsonSerializer.Serialize(dto.Recipes) : null;

	using var conn = new SqlConnection(connString);
	await conn.ExecuteAsync(@"
		IF NOT EXISTS (SELECT 1 FROM dbo.ShoppingItems WHERE ClientId = @ClientId)
		INSERT INTO dbo.ShoppingItems(ClientId, Name, Qty, Category, Store, Note, RecipesJson)
		VALUES (@ClientId, @Name, @Qty, @Category, @Store, @Note, @RecipesJson);",
		new
		{
			ClientId = dto.ClientId.Trim(),
			Name = dto.Name.Trim(),
			Qty = dto.Qty?.Trim(),
			Category = string.IsNullOrWhiteSpace(dto.Category) ? "Other" : dto.Category.Trim(),
			Store = dto.Store?.Trim(),
			Note = dto.Note?.Trim(),
			RecipesJson = recipesJson
		});

	return Results.Created($"/shopping/items/{dto.ClientId}", new { dto.ClientId });
});

app.MapPut("/shopping/items/{clientId}/check", async (string clientId, ShoppingCheckDto dto) =>
{
	using var conn = new SqlConnection(connString);
	await conn.ExecuteAsync(
		"UPDATE dbo.ShoppingItems SET IsChecked = @IsChecked WHERE ClientId = @ClientId;",
		new { IsChecked = dto.Checked, ClientId = clientId });
	return Results.NoContent();
});

app.MapDelete("/shopping/items/{clientId}", async (string clientId) =>
{
	using var conn = new SqlConnection(connString);
	var deleted = await conn.ExecuteAsync(
		"DELETE FROM dbo.ShoppingItems WHERE ClientId = @ClientId;",
		new { ClientId = clientId });
	return deleted > 0 ? Results.NoContent() : Results.NotFound(new { error = "Item not found." });
});

app.MapDelete("/shopping/checked", async () =>
{
	using var conn = new SqlConnection(connString);
	await conn.ExecuteAsync("DELETE FROM dbo.ShoppingItems WHERE IsChecked = 1;");
	return Results.NoContent();
});

app.MapPost("/shopping/bulk", async (ShoppingBulkDto dto) =>
{
	if (dto.Items is null || dto.Items.Length == 0) return Results.Ok(new { accepted = 0, processed = 0 });

	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();
	using var tx = conn.BeginTransaction();

	var processed = 0;
	foreach (var item in dto.Items)
	{
		if (string.IsNullOrWhiteSpace(item.Name) || string.IsNullOrWhiteSpace(item.ClientId)) continue;
		var recipesJson = item.Recipes?.Length > 0 ? JsonSerializer.Serialize(item.Recipes) : null;

		await conn.ExecuteAsync(@"
			IF NOT EXISTS (SELECT 1 FROM dbo.ShoppingItems WHERE ClientId = @ClientId)
			INSERT INTO dbo.ShoppingItems(ClientId, Name, Qty, Category, Store, Note, RecipesJson, IsChecked)
			VALUES (@ClientId, @Name, @Qty, @Category, @Store, @Note, @RecipesJson, @IsChecked);",
			new
			{
				ClientId = item.ClientId.Trim(),
				Name = item.Name.Trim(),
				Qty = item.Qty?.Trim(),
				Category = string.IsNullOrWhiteSpace(item.Category) ? "Other" : item.Category.Trim(),
				Store = item.Store?.Trim(),
				Note = item.Note?.Trim(),
				RecipesJson = recipesJson,
				IsChecked = item.Checked
			}, tx);
		processed++;
	}

	await tx.CommitAsync();
	return Results.Ok(new { accepted = dto.Items.Length, processed });
});

// ── Auth endpoints ──────────────────────────────────────────────────────────

app.MapPost("/auth/register", async (AuthRegisterDto dto) =>
{
	if (string.IsNullOrWhiteSpace(dto.DisplayName)) return Results.BadRequest(new { error = "DisplayName is required." });
	if (string.IsNullOrWhiteSpace(dto.Email)) return Results.BadRequest(new { error = "Email is required." });
	if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6) return Results.BadRequest(new { error = "Password must be at least 6 characters." });

	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();

	var existing = await conn.ExecuteScalarAsync<int?>("SELECT UserId FROM dbo.Users WHERE Email = @Email", new { Email = dto.Email.Trim().ToLowerInvariant() });
	if (existing.HasValue) return Results.Conflict(new { error = "An account with that email already exists." });

	// Determine role: first user becomes owner
	var userCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.Users");
	var role = userCount == 0 ? "owner" : "member";

	var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
	var userId = await conn.ExecuteScalarAsync<int>(@"
		INSERT INTO dbo.Users (DisplayName, Email, PasswordHash, Role)
		VALUES (@DisplayName, @Email, @PasswordHash, @Role);
		SELECT CAST(SCOPE_IDENTITY() AS int);",
		new { DisplayName = dto.DisplayName.Trim(), Email = dto.Email.Trim().ToLowerInvariant(), PasswordHash = hash, Role = role });

	return Results.Created($"/auth/me", new { userId, displayName = dto.DisplayName.Trim(), role });
});

app.MapPost("/auth/login", async (AuthLoginDto dto) =>
{
	if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
		return Results.BadRequest(new { error = "Email and password are required." });

	using var conn = new SqlConnection(connString);
	var user = await conn.QueryFirstOrDefaultAsync<UserRow>(
		"SELECT UserId, DisplayName, Email, PasswordHash, Role FROM dbo.Users WHERE Email = @Email",
		new { Email = dto.Email.Trim().ToLowerInvariant() });

	if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
		return Results.Unauthorized();

	var token = Guid.NewGuid().ToString("N");
	var expires = DateTime.UtcNow.AddDays(30);
	await conn.ExecuteAsync(@"
		INSERT INTO dbo.UserSessions (SessionToken, UserId, ExpiresAt)
		VALUES (@Token, @UserId, @ExpiresAt);",
		new { Token = token, UserId = user.UserId, ExpiresAt = expires });

	return Results.Ok(new { sessionToken = token, userId = user.UserId, displayName = user.DisplayName, role = user.Role, expiresAt = expires });
});

app.MapPost("/auth/logout", async (HttpContext ctx) =>
{
	var token = ctx.Request.Headers["X-Session-Token"].FirstOrDefault();
	if (string.IsNullOrWhiteSpace(token)) return Results.NoContent();

	using var conn = new SqlConnection(connString);
	await conn.ExecuteAsync("DELETE FROM dbo.UserSessions WHERE SessionToken = @Token", new { Token = token });
	return Results.NoContent();
});

app.MapGet("/auth/me", async (HttpContext ctx) =>
{
	var token = ctx.Request.Headers["X-Session-Token"].FirstOrDefault();
	if (string.IsNullOrWhiteSpace(token)) return Results.Unauthorized();

	using var conn = new SqlConnection(connString);
	var session = await conn.QueryFirstOrDefaultAsync<SessionWithUser>(@"
		SELECT u.UserId, u.DisplayName, u.Email, u.Role, s.ExpiresAt
		FROM dbo.UserSessions s
		JOIN dbo.Users u ON u.UserId = s.UserId
		WHERE s.SessionToken = @Token AND s.ExpiresAt > SYSUTCDATETIME()",
		new { Token = token });

	if (session is null) return Results.Unauthorized();
	return Results.Ok(new { session.UserId, session.DisplayName, session.Email, session.Role });
});

// ────────────────────────────────────────────────────────────────────────────

app.Run();

static JsonElement? FindRecipeNode(JsonElement root)
{
	if (root.ValueKind == JsonValueKind.Object)
	{
		if (root.TryGetProperty("@type", out var typeProp))
		{
			if (IsRecipeType(typeProp)) return root;
		}
		if (root.TryGetProperty("@graph", out var graph) && graph.ValueKind == JsonValueKind.Array)
			foreach (var node in graph.EnumerateArray())
			{
				var found = FindRecipeNode(node);
				if (found.HasValue) return found;
			}
	}
	else if (root.ValueKind == JsonValueKind.Array)
		foreach (var node in root.EnumerateArray())
		{
			var found = FindRecipeNode(node);
			if (found.HasValue) return found;
		}
	return null;
}

static bool IsRecipeType(JsonElement typeProp)
{
	if (typeProp.ValueKind == JsonValueKind.String)
		return typeProp.GetString()?.Contains("Recipe", StringComparison.OrdinalIgnoreCase) == true;
	if (typeProp.ValueKind == JsonValueKind.Array)
		return typeProp.EnumerateArray().Any(t => t.GetString()?.Contains("Recipe", StringComparison.OrdinalIgnoreCase) == true);
	return false;
}

static string? GetStringProp(JsonElement el, string key)
{
	if (el.TryGetProperty(key, out var prop))
	{
		if (prop.ValueKind == JsonValueKind.String) return prop.GetString();
		if (prop.ValueKind == JsonValueKind.Array)
		{
			var first = prop.EnumerateArray().FirstOrDefault();
			if (first.ValueKind == JsonValueKind.String) return first.GetString();
		}
	}
	return null;
}

static string? GetStringOrFirstArray(JsonElement el, string key)
{
	if (!el.TryGetProperty(key, out var prop)) return null;
	if (prop.ValueKind == JsonValueKind.String) return prop.GetString();
	if (prop.ValueKind == JsonValueKind.Array)
	{
		var items = prop.EnumerateArray()
			.Where(e => e.ValueKind == JsonValueKind.String)
			.Select(e => e.GetString()!)
			.Where(s => s.Length > 0).ToList();
		return items.Count > 0 ? string.Join(", ", items) : null;
	}
	return null;
}

record ItemDto(string Name, int Quantity);
record RecipeCreateDto(
	string Name,
	string? Course,
	string? Cuisine,
	string? Source,
	string[]? Tags,
	int? Rating,
	long? AddedAtUnixMs,
	int? Servings,
	string[]? Ingredients,
	string[]? Steps,
	string? Comments,
	string? ImageUrl);
record RecipeBulkCreateDto(RecipeCreateDto[] Entries);
record RecipePatchDto(
	string? Name,
	string? Course,
	string? Cuisine,
	string? Source,
	string[]? Tags,
	int? Rating,
	int? Servings,
	string[]? Ingredients,
	string[]? Steps,
	string? Comments,
	string? ImageUrl);
record MealPlanEntryCreateDto(DateOnly PlanDate, string MealType, int? RecipeId, string? RecipeName, string? Notes);
record MealPlanBulkCreateDto(MealPlanEntryCreateDto[] Entries);
record MealPlanNoteUpsertDto(DateOnly PlanDate, string? Notes);
record ShoppingItemRow(string ClientId, string Name, string? Qty, string? Category, string? Store, string? Note, string? RecipesJson, bool IsChecked);
record ShoppingItemDto(string ClientId, string Name, string? Qty, string? Category, string? Store, string? Note, string[]? Recipes);
record ShoppingCheckDto(bool Checked);
record ShoppingBulkItemDto(string ClientId, string Name, string? Qty, string? Category, string? Store, string? Note, string[]? Recipes, bool Checked);
record ShoppingBulkDto(ShoppingBulkItemDto[] Items);
record RecipeImportDto(string Url);
record AuthRegisterDto(string DisplayName, string Email, string Password);
record AuthLoginDto(string Email, string Password);
record UserRow(int UserId, string DisplayName, string Email, string PasswordHash, string Role);
record SessionWithUser(int UserId, string DisplayName, string Email, string Role, DateTime ExpiresAt);
