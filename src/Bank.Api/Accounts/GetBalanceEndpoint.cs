using Accounts.Application;

namespace Bank.Api.Accounts;

public static class GetBalanceEndpoint
{
    public static RouteGroupBuilder MapGetBalance(this RouteGroupBuilder group)
    {
        group.MapGet("/{accountId}/balance", async (Guid accountId, IGetBalance useCase) =>
                TypedResults.Ok(await useCase.Handle(new GetBalanceCommand(accountId))))
            .WithName(nameof(GetBalance))
            .WithSummary("Get the balance")
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);
        return group;
    }
}
