using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests;

[Trait("Category", "Integration")]
public class ShoppingTests : IClassFixture<WebAppFixture>
{
    private readonly HttpClient _client;

    public ShoppingTests(WebAppFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task PostShoppingItem_MissingName_Returns400()
    {
        var payload = new { clientId = Guid.NewGuid().ToString(), name = "" };
        var response = await _client.PostAsJsonAsync("/shopping/items", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task PostShoppingItem_ValidPayload_Returns201OrOk()
    {
        var payload = new
        {
            clientId = Guid.NewGuid().ToString(),
            name = "Test Bread",
            qty = "1 loaf",
            category = "Bakery"
        };
        var response = await _client.PostAsJsonAsync("/shopping/items", payload);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }
}
