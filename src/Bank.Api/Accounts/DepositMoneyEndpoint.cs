using Accounts.Application;

namespace Bank.Api.Accounts;

public static class DepositMoneyEndpoint
{
    public sealed record Request(decimal Amount);

    public static RouteGroupBuilder MapDepositMoney(this RouteGroupBuilder group)
    {
        group.MapPost("/{accountId}/deposits", async (Guid accountId, Request request, IDepositMoney useCase) =>
                TypedResults.Ok(await useCase.Handle(new DepositMoneyCommand(accountId, request.Amount))))
            .WithName(nameof(DepositMoney))
            .WithSummary("Deposit money")
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity);
        return group;
    }
}
