using Accounts.Application.Ports;
using Accounts.Domain;

namespace Accounts.Infrastructure;

public sealed class InMemoryAccounts : IAccounts
{
    private readonly Dictionary<Guid, Account> _accounts = new();
    private readonly Lock _lock = new();

    public Task<Account?> ById(Guid id)
    {
        lock (_lock) return Task.FromResult(_accounts.GetValueOrDefault(id));
    }

    public Task Save(params Account[] accounts)
    {
        lock (_lock)
        {
            foreach (var account in accounts) _accounts[account.Id] = account;
        }
        return Task.CompletedTask;
    }
}
