using Transfers.Application.Ports;
using Transfers.Domain;

namespace Transfers.Infrastructure;

public sealed class InMemoryTransferLog : ITransferLog
{
    private readonly Dictionary<Guid, Transfer> _transfers = new();
    private readonly Lock _lock = new();

    public Task Record(Transfer transfer)
    {
        lock (_lock)
        {
            if (!_transfers.TryAdd(transfer.Id, transfer)) throw new InvalidOperationException($"Transfer {transfer.Id} is recorded already.");
        }
        return Task.CompletedTask;
    }

    public Task<Transfer?> ById(Guid id)
    {
        lock (_lock) return Task.FromResult(_transfers.GetValueOrDefault(id));
    }
}
