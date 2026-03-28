using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests;

[Trait("Category", "Integration")]
public class MealPlansTests : IClassFixture<WebAppFixture>
{
    private readonly HttpClient _client;

    public MealPlansTests(WebAppFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task PostMealPlan_NotesTypeMissingNotes_Returns400()
    {
        var payload = new
        {
            planDate = "2026-04-01",
            mealType = "Notes",
            notes = (string?)null
        };
        var response = await _client.PostAsJsonAsync("/meal-plans", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task PostMealPlan_DinnerTypeMissingRecipeName_Returns400()
    {
        var payload = new
        {
            planDate = "2026-04-01",
            mealType = "Dinner",
            recipeName = (string?)null
        };
        var response = await _client.PostAsJsonAsync("/meal-plans", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task PutMealPlanNote_ValidPayload_Returns200OrNoContent()
    {
        var payload = new
        {
            planDate = "2026-04-15",
            notes = "Family dinner tonight"
        };
        var response = await _client.PutAsJsonAsync("/meal-plans/note", payload);
        // PUT /meal-plans/note returns 204 NoContent on success
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }
}
