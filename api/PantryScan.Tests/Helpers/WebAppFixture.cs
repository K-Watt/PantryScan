using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;

namespace PantryScan.Tests.Helpers;

public class WebAppFixture : WebApplicationFactory<Program>
{
    // Integration tests need a real PostgreSQL instance. CI supplies one via a
    // service container and sets PANTRYSCAN_TEST_DB; the fallback is a local
    // default so the suite still runs from a dev machine.
    private const string DefaultTestDb =
        "Host=localhost;Port=5432;Database=pantryscandb_test;Username=postgres;Password=postgres;";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var connString = Environment.GetEnvironmentVariable("PANTRYSCAN_TEST_DB") ?? DefaultTestDb;
        builder.UseSetting("ConnectionStrings:Sql", connString);
    }
}
