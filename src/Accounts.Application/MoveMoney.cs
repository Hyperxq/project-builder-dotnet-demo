using Accounts.Application.Ports;
using Accounts.Domain;

namespace Accounts.Application;

public sealed record MoveMoneyCommand(Guid FromAccountId, Guid ToAccountId, decimal Amount);

public sealed record MoveMoneyResult(decimal FromBalance, decimal ToBalance);

public interface IMoveMoney
{
    Task<MoveMoneyResult> Handle(MoveMoneyCommand command);
}

public sealed class MoveMoney(IAccounts accounts) : IMoveMoney
{
    // The checks run in the order docs/accounts/domain-model.md publishes: same account, existence, balance.
    public async Task<MoveMoneyResult> Handle(MoveMoneyCommand command)
    {
        var amount = Amount.Of(command.Amount);
        if (command.FromAccountId == command.ToAccountId) throw new SameAccount();
        var source = await accounts.ById(command.FromAccountId) ?? throw new AccountNotFound(command.FromAccountId);
        var destination = await accounts.ById(command.ToAccountId) ?? throw new AccountNotFound(command.ToAccountId);
        var (from, to) = source.MoveTo(destination, amount);
        await accounts.Save(from, to);
        return new MoveMoneyResult(from.Balance.Value, to.Balance.Value);
    }
}
