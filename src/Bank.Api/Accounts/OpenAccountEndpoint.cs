using Accounts.Application;

namespace Bank.Api.Accounts;

public static class OpenAccountEndpoint
{
    public sealed record Request(string HolderName);

    public static RouteGroupBuilder MapOpenAccount(this RouteGroupBuilder group)
    {
        group.MapPost("/", async (Request request, IOpenAccount useCase) =>
            {
                var result = await useCase.Handle(new OpenAccountCommand(request.HolderName));
                return TypedResults.Created($"/api/accounts/{result.AccountId}", result);
            })
            .WithName(nameof(OpenAccount))
            .WithSummary("Open an account")
            .ProducesValidationProblem();
        return group;
    }
}
