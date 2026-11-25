using Transfers.Application;

namespace Bank.Api.Transfers;

public static class GetTransferEndpoint
{
    public static RouteGroupBuilder MapGetTransfer(this RouteGroupBuilder group)
    {
        group.MapGet("/{transferId}", async (Guid transferId, IGetTransfer useCase) =>
                TypedResults.Ok(await useCase.Handle(new GetTransferCommand(transferId))))
            .WithName(nameof(GetTransfer))
            .WithSummary("Get a transfer")
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);
        return group;
    }
}
