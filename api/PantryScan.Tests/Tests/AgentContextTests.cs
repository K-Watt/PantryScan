using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests;

[Trait("Category", "Integration")]
public class AgentContextTests : IClassFixture<WebAppFixture>
{
    private readonly HttpClient _client;

    public AgentContextTests(WebAppFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task GetAgentContext_Returns200WithExpectedShape()
    {
        var response = await _client.GetAsync("/agent/context");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // Verify the top-level "counts" key exists
        body.TryGetProperty("counts", out var counts).Should().BeTrue("response should have a 'counts' key");

        // Verify the expected sub-properties under "counts"
        counts.TryGetProperty("items", out _).Should().BeTrue("counts should have 'items'");
        counts.TryGetProperty("recipes", out _).Should().BeTrue("counts should have 'recipes'");
        counts.TryGetProperty("mealPlanEntries", out _).Should().BeTrue("counts should have 'mealPlanEntries'");
    }
}
