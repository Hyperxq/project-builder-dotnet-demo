using Bank.Api.Accounts;
using Bank.Api.Errors;
using Bank.Kernel;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddValidation();
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
    {
        // Every 400 the edge answers before a use case runs is a validation failure (docs/README.md).
        if (context.ProblemDetails.Status == StatusCodes.Status400BadRequest)
            context.ProblemDetails.Extensions.TryAdd("code", DomainError.ValidationFailed);
    });
builder.Services.AddExceptionHandler<DomainErrorHandler>();

builder.Services.AddAccounts();

var app = builder.Build();

app.UseExceptionHandler();
app.MapOpenApi();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithSummary("Reports that the API is up");

api.MapAccountsEndpoints();

app.Run();
