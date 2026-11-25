namespace Bank.Api.Accounts;

public static class AccountsEndpoints
{
    public static IEndpointRouteBuilder MapAccountsEndpoints(this IEndpointRouteBuilder api)
    {
        api.MapGroup("/accounts")
            .WithTags("Accounts")
            .MapOpenAccount()
            .MapDepositMoney()
            .MapWithdrawMoney()
            .MapGetBalance();
        return api;
    }
}
