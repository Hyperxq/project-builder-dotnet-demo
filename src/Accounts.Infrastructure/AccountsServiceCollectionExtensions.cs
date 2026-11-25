using Accounts.Application;
using Accounts.Application.Ports;
using Accounts.Infrastructure;

namespace Microsoft.Extensions.DependencyInjection;

public static class AccountsServiceCollectionExtensions
{
    public static IServiceCollection AddAccounts(this IServiceCollection services)
    {
        services.AddSingleton<IAccounts, InMemoryAccounts>();
        services.AddScoped<OpenAccount>();
        services.AddScoped<DepositMoney>();
        services.AddScoped<WithdrawMoney>();
        services.AddScoped<GetBalance>();
        services.AddScoped<MoveMoney>();
        return services;
    }
}
