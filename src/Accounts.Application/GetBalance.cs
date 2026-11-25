using Accounts.Application.Ports;
using Accounts.Domain;

namespace Accounts.Application;

public sealed record GetBalanceCommand(Guid AccountId);

public sealed record GetBalanceResult(Guid AccountId, string HolderName, decimal Balance);

public interface IGetBalance
{
    Task<GetBalanceResult> Handle(GetBalanceCommand command);
}

public sealed class GetBalance(IAccounts accounts) : IGetBalance
{
    public async Task<GetBalanceResult> Handle(GetBalanceCommand command)
    {
        var account = await accounts.ById(command.AccountId) ?? throw new AccountNotFound(command.AccountId);
        return new GetBalanceResult(account.Id, account.Holder.Value, account.Balance.Value);
    }
}
