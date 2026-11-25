using Transfers.Application.Ports;
using Transfers.Infrastructure;
using Transfers.Application;

namespace Microsoft.Extensions.DependencyInjection;

public static class TransfersServiceCollectionExtensions
{
    public static IServiceCollection AddTransfers(this IServiceCollection services)
    {
        services.AddScoped<IAccountsGateway, AccountsContextGateway>();
        services.AddSingleton<ITransferLog, InMemoryTransferLog>();
        services.AddScoped<ITransferMoney, TransferMoney>();
        services.AddScoped<IGetTransfer, GetTransfer>();
        return services;
    }
}
