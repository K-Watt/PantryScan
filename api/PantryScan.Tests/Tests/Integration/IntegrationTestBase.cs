using PantryScan.Tests.Helpers;

namespace PantryScan.Tests.Tests.Integration;

/// <summary>
/// Base class for integration tests. Provides a shared WebAppFixture and
/// an HttpClient configured to talk to the in-process test server.
/// </summary>
public abstract class IntegrationTestBase : IClassFixture<WebAppFixture>
{
    protected readonly HttpClient Client;

    protected IntegrationTestBase(WebAppFixture fixture)
    {
        Client = fixture.CreateClient();
    }
}
