using Accounts.Application.Ports;
using Accounts.Domain;

namespace Accounts.Application;

public sealed record OpenAccountCommand(string HolderName);

public sealed record OpenAccountResult(Guid AccountId, string HolderName, decimal Balance);

public sealed class OpenAccount(IAccounts accounts)
{
    public async Task<OpenAccountResult> Handle(OpenAccountCommand command)
    {
        var account = Account.Open(HolderName.Of(command.HolderName));
        await accounts.Save(account);
        return new OpenAccountResult(account.Id, account.Holder.Value, account.Balance.Value);
    }
}
