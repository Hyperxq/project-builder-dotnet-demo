using Transfers.Application.Ports;

namespace Transfers.Infrastructure;

public sealed class AccountsContextGateway : IAccountsGateway
{
    public Task Move(Guid fromAccountId, Guid toAccountId, decimal amount) => throw new NotImplementedException();
}
