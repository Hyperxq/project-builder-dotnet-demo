namespace Bank.Api.Transfers;

public static class TransfersEndpoints
{
    public static IEndpointRouteBuilder MapTransfersEndpoints(this IEndpointRouteBuilder api)
    {
        api.MapGroup("/transfers")
            .WithTags("Transfers")
            .MapTransferMoney()
            .MapGetTransfer();
        return api;
    }
}
