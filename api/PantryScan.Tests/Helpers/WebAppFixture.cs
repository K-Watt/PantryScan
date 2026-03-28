using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;

namespace PantryScan.Tests.Helpers;

public class WebAppFixture : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Sql",
            "Server=localhost,1433;Database=PantryScanDB_Test;User Id=sa;Password=PantryScanP@ss1;TrustServerCertificate=True;");
    }
}
