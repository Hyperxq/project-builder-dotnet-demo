using System.Net.Http.Json;
using System.Text.Json;
using Bank.Kernel;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Reqnroll;

namespace Bank.Acceptance.Support;

public sealed record Outcome(int Status, string? Code, JsonElement Body);

[Binding]
public sealed class ApiDriver
{
    private static WebApplicationFactory<Program> _factory = null!;

    private readonly HttpClient _client = _factory.CreateClient();

    public Outcome Last { get; private set; } = null!;

    public async Task<Outcome> Send(HttpMethod method, string url, object? body = null)
    {
        using var request = new HttpRequestMessage(method, url) { Content = body is null ? null : JsonContent.Create(body) };
        using var response = await _client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        var json = text.Length > 0 ? JsonDocument.Parse(text).RootElement.Clone() : default;
        var code = json.ValueKind == JsonValueKind.Object && json.TryGetProperty("code", out var c) ? c.GetString() : null;
        return Last = new Outcome((int)response.StatusCode, code, json);
    }

    /// <summary>
    /// Runs a use case that has no route, the way another context's adapter does, and records its
    /// outcome as the route would answer it.
    /// </summary>
    public async Task<Outcome> Run<TUseCase>(Func<TUseCase, Task<object>> call) where TUseCase : notnull
    {
        using var scope = _factory.Services.CreateScope();
        try
        {
            var result = await call(scope.ServiceProvider.GetRequiredService<TUseCase>());
            return Last = new Outcome(200, null, JsonSerializer.SerializeToElement(result, JsonSerializerOptions.Web));
        }
        catch (DomainError error)
        {
            return Last = new Outcome(StatusOf(error.Kind), error.Code, default);
        }
    }

    private static int StatusOf(ErrorKind kind) => kind switch
    {
        ErrorKind.Invalid => 400,
        ErrorKind.NotFound => 404,
        _ => 422,
    };

    [BeforeTestRun]
    public static void StartApi() => _factory = new WebApplicationFactory<Program>();

    [AfterTestRun]
    public static void StopApi() => _factory.Dispose();
}
