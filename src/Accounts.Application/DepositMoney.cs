using Accounts.Application.Ports;
using Accounts.Domain;

namespace Accounts.Application;

public sealed record DepositMoneyCommand(Guid AccountId, decimal Amount);

public sealed record DepositMoneyResult(Guid AccountId, decimal Balance);

public sealed class DepositMoney(IAccounts accounts)
{
    public async Task<DepositMoneyResult> Handle(DepositMoneyCommand command)
    {
        var amount = Amount.Of(command.Amount);
        var account = await accounts.ById(command.AccountId) ?? throw new AccountNotFound(command.AccountId);
        var deposited = account.Deposit(amount);
        await accounts.Save(deposited);
        return new DepositMoneyResult(deposited.Id, deposited.Balance.Value);
    }
}
