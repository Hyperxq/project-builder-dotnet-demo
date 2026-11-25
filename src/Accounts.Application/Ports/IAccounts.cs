using Accounts.Domain;

namespace Accounts.Application.Ports;

public interface IAccounts
{
    /// <summary>Null for an unknown id.</summary>
    Task<Account?> ById(Guid id);

    /// <summary>Stores every account given, adding or replacing each by id: all of them or none.</summary>
    Task Save(params Account[] accounts);
}
