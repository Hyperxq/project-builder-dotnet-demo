using Accounts.Application;
using Bank.Kernel;
using Transfers.Application.Ports;
using Transfers.Domain;

namespace Transfers.Infrastructure;

/// <summary>
/// Anti-corruption layer: reaches Accounts only through its published MoveMoney use case and
/// answers Accounts' refusals with Transfers' own errors, by their published codes.
/// </summary>
public sealed class AccountsContextGateway(IMoveMoney moveMoney) : IAccountsGateway
{
    public async Task Move(Guid fromAccountId, Guid toAccountId, decimal amount)
    {
        try
        {
            await moveMoney.Handle(new MoveMoneyCommand(fromAccountId, toAccountId, amount));
        }
        catch (DomainError error) when (Translate(error.Code) is { } translated)
        {
            throw translated;
        }
    }

    private static DomainError? Translate(string code) => code switch
    {
        "accounts.same_account" => new SameAccount(),
        "accounts.account_not_found" => new AccountNotFound(),
        "accounts.insufficient_funds" => new InsufficientFunds(),
        _ => null,
    };
}
