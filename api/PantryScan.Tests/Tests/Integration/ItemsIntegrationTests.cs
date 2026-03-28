using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests.Integration;

/// <summary>
/// Full round-trip integration tests for pantry items:
/// Add → confirm exists → update quantity → delete → confirm gone.
/// </summary>
[Trait("Category", "Integration")]
public class ItemsIntegrationTests : IntegrationTestBase
{
    public ItemsIntegrationTests(WebAppFixture fixture) : base(fixture) { }

    [Fact]
    public async Task Item_FullRoundTrip_AddUpdateDelete()
    {
        // 1. Add a new item
        var createPayload = new { name = "Integration Test Butter", quantity = 3 };
        var createResponse = await Client.PostAsJsonAsync("/items", createPayload);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var itemId = created.GetProperty("itemId").GetInt32();
        itemId.Should().BeGreaterThan(0);

        // 2. Confirm the item exists in GET /items
        var listResponse = await Client.GetAsync("/items");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var items = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        items.ValueKind.Should().Be(JsonValueKind.Array);

        var found = items.EnumerateArray()
            .Any(i => i.TryGetProperty("itemId", out var idProp) && idProp.GetInt32() == itemId);
        found.Should().BeTrue("the newly created item should appear in the list");

        // 3. Update the quantity
        var updatePayload = new { quantity = 10 };
        var updateResponse = await Client.PutAsJsonAsync($"/items/{itemId}", updatePayload);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 4. Delete the item
        var deleteResponse = await Client.DeleteAsync($"/items/{itemId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 5. Confirm the item is gone (second delete should return 404)
        var secondDeleteResponse = await Client.DeleteAsync($"/items/{itemId}");
        secondDeleteResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
