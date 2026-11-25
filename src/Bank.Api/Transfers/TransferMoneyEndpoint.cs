using Transfers.Application;

namespace Bank.Api.Transfers;

public static class TransferMoneyEndpoint
{
    public sealed record Request(Guid FromAccountId, Guid ToAccountId, decimal Amount);

    public static RouteGroupBuilder MapTransferMoney(this RouteGroupBuilder group)
    {
        group.MapPost("/", async (Request request, ITransferMoney useCase) =>
                TypedResults.Created((string?)null, await useCase.Handle(new TransferMoneyCommand(request.FromAccountId, request.ToAccountId, request.Amount))))
            .WithName(nameof(TransferMoney))
            .WithSummary("Transfer money")
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity);
        return group;
    }
}
