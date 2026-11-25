using Transfers.Application.Ports;
using Transfers.Domain;

namespace Transfers.Application;

public sealed record TransferMoneyCommand(Guid FromAccountId, Guid ToAccountId, decimal Amount);

public sealed record TransferMoneyResult(Guid TransferId);

public interface ITransferMoney
{
    Task<TransferMoneyResult> Handle(TransferMoneyCommand command);
}

public sealed class TransferMoney(IAccountsGateway accountsGateway, ITransferLog transferLog) : ITransferMoney
{
    public async Task<TransferMoneyResult> Handle(TransferMoneyCommand command)
    {
        var amount = Amount.Of(command.Amount);
        await accountsGateway.Move(command.FromAccountId, command.ToAccountId, amount.Value);
        var transfer = Transfer.Made(command.FromAccountId, command.ToAccountId, amount);
        await transferLog.Record(transfer);
        return new TransferMoneyResult(transfer.Id);
    }
}
