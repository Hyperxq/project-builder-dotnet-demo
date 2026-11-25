using Transfers.Domain;

namespace Transfers.Application.Ports;

/// <summary>Record adds the transfer and never replaces one · ById answers null for an id never recorded</summary>
public interface ITransferLog
{
    Task Record(Transfer transfer);

    Task<Transfer?> ById(Guid id);
}
