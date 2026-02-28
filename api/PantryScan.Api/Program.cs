using Dapper;
using Microsoft.Data.SqlClient;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var connString = builder.Configuration.GetConnectionString("Sql")
	?? "Server=localhost;Database=PantryScanDB;Trusted_Connection=True;TrustServerCertificate=True;";

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
		INSERT INTO dbo.Recipes(Name, Course, Cuisine, Source, TagsJson, Rating, AddedAt, Servings, IngredientsJson, StepsJson)
		VALUES (@Name, @Course, @Cuisine, @Source, @TagsJson, @Rating, @AddedAt, @Servings, @IngredientsJson, @StepsJson);
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
			StepsJson = JsonSerializer.Serialize(steps)
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
				INSERT INTO dbo.Recipes(Name, Course, Cuisine, Source, TagsJson, Rating, AddedAt, Servings, IngredientsJson, StepsJson)
				VALUES (@Name, @Course, @Cuisine, @Source, @TagsJson, @Rating, @AddedAt, @Servings, @IngredientsJson, @StepsJson);
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
				StepsJson = JsonSerializer.Serialize(steps)
			}, tx);

		processed++;
	}

	await tx.CommitAsync();
	return Results.Ok(new { accepted = dto.Entries.Length, processed });
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

static async Task EnsureSchemaAsync(string connString)
{
	using var conn = new SqlConnection(connString);
	await conn.OpenAsync();

	await conn.ExecuteAsync(@"
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
	string[]? Steps);
record RecipeBulkCreateDto(RecipeCreateDto[] Entries);
record MealPlanEntryCreateDto(DateOnly PlanDate, string MealType, int? RecipeId, string? RecipeName, string? Notes);
record MealPlanBulkCreateDto(MealPlanEntryCreateDto[] Entries);
record MealPlanNoteUpsertDto(DateOnly PlanDate, string? Notes);
record ShoppingItemRow(string ClientId, string Name, string? Qty, string? Category, string? Store, string? Note, string? RecipesJson, bool IsChecked);
record ShoppingItemDto(string ClientId, string Name, string? Qty, string? Category, string? Store, string? Note, string[]? Recipes);
record ShoppingCheckDto(bool Checked);
record ShoppingBulkItemDto(string ClientId, string Name, string? Qty, string? Category, string? Store, string? Note, string[]? Recipes, bool Checked);
record ShoppingBulkDto(ShoppingBulkItemDto[] Items);
record RecipeImportDto(string Url);
