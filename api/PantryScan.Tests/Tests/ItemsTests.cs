using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests;

[Trait("Category", "Integration")]
public class ItemsTests : IClassFixture<WebAppFixture>
{
    private readonly HttpClient _client;

    public ItemsTests(WebAppFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task PostItem_ValidPayload_Returns201()
    {
        var payload = new { name = "Test Milk", quantity = 2 };
        var response = await _client.PostAsJsonAsync("/items", payload);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("itemId").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task PostItem_MissingName_Returns400WithError()
    {
        var payload = new { name = "", quantity = 1 };
        var response = await _client.PostAsJsonAsync("/items", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task PostItem_NegativeQuantity_Returns400WithError()
    {
        var payload = new { name = "Bad Item", quantity = -5 };
        var response = await _client.PostAsJsonAsync("/items", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("error").GetString().Should().Contain("negative");
    }

    [Fact]
    public async Task PutItem_NonExistentId_Returns404()
    {
        var payload = new { quantity = 10 };
        var response = await _client.PutAsJsonAsync("/items/999999", payload);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteItem_NonExistentId_Returns404()
    {
        var response = await _client.DeleteAsync("/items/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
