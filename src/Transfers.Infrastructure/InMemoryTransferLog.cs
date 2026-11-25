using Transfers.Application.Ports;
using Transfers.Domain;

namespace Transfers.Infrastructure;

public sealed class InMemoryTransferLog : ITransferLog
{
    public Task Record(Transfer transfer) => throw new NotImplementedException();

    public Task<Transfer?> ById(Guid id) => throw new NotImplementedException();
}
