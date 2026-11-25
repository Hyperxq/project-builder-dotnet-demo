using Microsoft.AspNetCore.Mvc.Testing;
using Reqnroll;

namespace Bank.Acceptance.Support;

[Binding]
public sealed class ApiDriver
{
    private static WebApplicationFactory<Program> _factory = null!;

    public HttpClient Client { get; } = _factory.CreateClient();

    public HttpResponseMessage? LastResponse { get; set; }

    [BeforeTestRun]
    public static void StartApi() => _factory = new WebApplicationFactory<Program>();

    [AfterTestRun]
    public static void StopApi() => _factory.Dispose();
}
