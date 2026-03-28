using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;
using PantryScan.Tests.Tests.Integration;

namespace PantryScan.Tests.Tests;

[Trait("Category", "Integration")]
public class AuditLogTests : IntegrationTestBase
{
    public AuditLogTests(WebAppFixture fixture) : base(fixture) { }

    [Fact]
    public async Task PostItem_DuplicateIdempotencyKey_ReturnsIdempotentTrue()
    {
        var key = Guid.NewGuid().ToString();
        var payload = new { name = $"Idempotent Item {key[..8]}", quantity = 1, idempotencyKey = key };

        var first = await Client.PostAsJsonAsync("/items", payload);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await Client.PostAsJsonAsync("/items", payload);
        second.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await second.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("idempotent").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task PostRecipe_DuplicateIdempotencyKey_ReturnsIdempotentTrue()
    {
        var key = Guid.NewGuid().ToString();
        var payload = new { name = $"Idempotent Recipe {key[..8]}", idempotencyKey = key };

        var first = await Client.PostAsJsonAsync("/recipes", payload);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await Client.PostAsJsonAsync("/recipes", payload);
        second.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await second.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("idempotent").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task PostItem_TwoRequestsWithoutIdempotencyKey_CreatesTwoItems()
    {
        var payload = new { name = "Non-Idempotent Item", quantity = 1 };

        var first = await Client.PostAsJsonAsync("/items", payload);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await Client.PostAsJsonAsync("/items", payload);
        second.StatusCode.Should().Be(HttpStatusCode.Created);

        // Both should return itemIds, and they should be different
        var firstId = (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("itemId").GetInt32();
        var secondId = (await second.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("itemId").GetInt32();
        firstId.Should().NotBe(secondId);
    }

    [Fact]
    public async Task PostMealPlan_DuplicateIdempotencyKey_ReturnsIdempotentTrue()
    {
        var key = Guid.NewGuid().ToString();
        var payload = new
        {
            planDate = "2099-01-01",
            mealType = "Dinner",
            recipeName = $"Test Recipe {key[..8]}",
            idempotencyKey = key
        };

        var first = await Client.PostAsJsonAsync("/meal-plans", payload);
        first.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);

        var second = await Client.PostAsJsonAsync("/meal-plans", payload);
        second.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await second.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("idempotent").GetBoolean().Should().BeTrue();
    }
}
