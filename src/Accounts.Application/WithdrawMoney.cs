using Accounts.Application.Ports;
using Accounts.Domain;

namespace Accounts.Application;

public sealed record WithdrawMoneyCommand(Guid AccountId, decimal Amount);

public sealed record WithdrawMoneyResult(Guid AccountId, decimal Balance);

public interface IWithdrawMoney
{
    Task<WithdrawMoneyResult> Handle(WithdrawMoneyCommand command);
}

public sealed class WithdrawMoney(IAccounts accounts) : IWithdrawMoney
{
    public async Task<WithdrawMoneyResult> Handle(WithdrawMoneyCommand command)
    {
        var amount = Amount.Of(command.Amount);
        var account = await accounts.ById(command.AccountId) ?? throw new AccountNotFound(command.AccountId);
        var withdrawn = account.Withdraw(amount);
        await accounts.Save(withdrawn);
        return new WithdrawMoneyResult(withdrawn.Id, withdrawn.Balance.Value);
    }
}
