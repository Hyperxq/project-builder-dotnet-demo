using Accounts.Application;
using Accounts.Application.Ports;
using Accounts.Infrastructure;

namespace Microsoft.Extensions.DependencyInjection;

public static class AccountsServiceCollectionExtensions
{
    public static IServiceCollection AddAccounts(this IServiceCollection services)
    {
        services.AddSingleton<IAccounts, InMemoryAccounts>();
        services.AddScoped<IOpenAccount, OpenAccount>();
        services.AddScoped<IDepositMoney, DepositMoney>();
        services.AddScoped<IWithdrawMoney, WithdrawMoney>();
        services.AddScoped<IGetBalance, GetBalance>();
        services.AddScoped<IMoveMoney, MoveMoney>();
        return services;
    }
}
