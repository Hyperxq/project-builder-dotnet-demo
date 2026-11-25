using Accounts.Application;

namespace Bank.Api.Accounts;

public static class WithdrawMoneyEndpoint
{
    public sealed record Request(decimal Amount);

    public static RouteGroupBuilder MapWithdrawMoney(this RouteGroupBuilder group)
    {
        group.MapPost("/{accountId}/withdrawals", async (Guid accountId, Request request, WithdrawMoney useCase) =>
                TypedResults.Ok(await useCase.Handle(new WithdrawMoneyCommand(accountId, request.Amount))))
            .WithName(nameof(WithdrawMoney))
            .WithSummary("Withdraw money")
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity);
        return group;
    }
}
