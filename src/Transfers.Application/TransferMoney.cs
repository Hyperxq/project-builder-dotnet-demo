using Transfers.Application.Ports;

namespace Transfers.Application;

public sealed record TransferMoneyCommand(Guid FromAccountId, Guid ToAccountId, decimal Amount);

public sealed record TransferMoneyResult(Guid TransferId);

public interface ITransferMoney
{
    Task<TransferMoneyResult> Handle(TransferMoneyCommand command);
}

public sealed class TransferMoney(IAccountsGateway accountsGateway, ITransferLog transferLog) : ITransferMoney
{
    public Task<TransferMoneyResult> Handle(TransferMoneyCommand command) => throw new NotImplementedException();
}
