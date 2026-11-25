using Transfers.Application.Ports;
using Transfers.Domain;

namespace Transfers.Application;

public sealed record GetTransferCommand(Guid TransferId);

public sealed record GetTransferResult(Guid TransferId, Guid FromAccountId, Guid ToAccountId, decimal Amount);

public interface IGetTransfer
{
    Task<GetTransferResult> Handle(GetTransferCommand command);
}

public sealed class GetTransfer(ITransferLog transferLog) : IGetTransfer
{
    public async Task<GetTransferResult> Handle(GetTransferCommand command)
    {
        var transfer = await transferLog.ById(command.TransferId) ?? throw new TransferNotFound(command.TransferId);
        return new GetTransferResult(transfer.Id, transfer.FromAccountId, transfer.ToAccountId, transfer.Amount.Value);
    }
}
