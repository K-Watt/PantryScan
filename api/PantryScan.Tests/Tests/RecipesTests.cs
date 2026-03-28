using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests;

[Trait("Category", "Integration")]
public class RecipesTests : IClassFixture<WebAppFixture>
{
    private readonly HttpClient _client;

    public RecipesTests(WebAppFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task PostRecipe_MinimalPayload_Returns201()
    {
        var payload = new { name = "Test Pasta Dish" };
        var response = await _client.PostAsJsonAsync("/recipes", payload);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("recipeId").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task PostRecipe_MissingName_Returns400()
    {
        var payload = new { name = "" };
        var response = await _client.PostAsJsonAsync("/recipes", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task DeleteRecipe_NonExistentId_Returns404()
    {
        var response = await _client.DeleteAsync("/recipes/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
