namespace Transfers.Application.Ports;

/// <summary>calls Accounts' MoveMoney; answers accounts.same_account as SameAccount, accounts.account_not_found as AccountNotFound and accounts.insufficient_funds as InsufficientFunds; any other Accounts failure is passed on unchanged and nothing is recorded</summary>
public interface IAccountsGateway
{
    Task Move(Guid fromAccountId, Guid toAccountId, decimal amount);
}
