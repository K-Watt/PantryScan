namespace PantryScan.Tests.Tests;

// TODO: Enable once Phase 4 idempotency is fully implemented in Program.cs
//
// [Fact, Trait("Category", "Integration")]
// public async Task PostItem_DuplicateIdempotencyKey_ReturnsIdempotentTrue()
// {
//     var key = Guid.NewGuid().ToString();
//     var payload = new { name = "Idempotent Item", quantity = 1, idempotencyKey = key };
//
//     var first  = await _client.PostAsJsonAsync("/items", payload);
//     first.StatusCode.Should().Be(HttpStatusCode.Created);
//
//     var second = await _client.PostAsJsonAsync("/items", payload);
//     second.StatusCode.Should().Be(HttpStatusCode.OK);
//
//     var body = await second.Content.ReadFromJsonAsync<JsonElement>();
//     body.GetProperty("idempotent").GetBoolean().Should().BeTrue();
// }
