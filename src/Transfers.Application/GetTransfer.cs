using Transfers.Application.Ports;

namespace Transfers.Application;

public sealed record GetTransferCommand(Guid TransferId);

public sealed record GetTransferResult(Guid TransferId, Guid FromAccountId, Guid ToAccountId, decimal Amount);

public interface IGetTransfer
{
    Task<GetTransferResult> Handle(GetTransferCommand command);
}

public sealed class GetTransfer(ITransferLog transferLog) : IGetTransfer
{
    public Task<GetTransferResult> Handle(GetTransferCommand command) => throw new NotImplementedException();
}
