using Bank.Kernel;

namespace Accounts.Domain;

public sealed class AccountNotFound(Guid accountId)
    : DomainError("accounts.account_not_found", ErrorKind.NotFound, $"Account {accountId} was not found.");

public sealed class DepositLimitExceeded(decimal limit)
    : DomainError("accounts.deposit_limit_exceeded", ErrorKind.Refused, $"A single deposit is at most {limit:0.00}.");

public sealed class InsufficientFunds()
    : DomainError("accounts.insufficient_funds", ErrorKind.Refused, "The account holds less than the amount.");

public sealed class SameAccount()
    : DomainError("accounts.same_account", ErrorKind.Refused, "Money moves only between two different accounts.");

public sealed class InvalidHolderName(int maxLength)
    : DomainError(ValidationFailed, ErrorKind.Invalid, $"The holder name has 1 to {maxLength} characters.");

public sealed class InvalidAmount(decimal amount)
    : DomainError(ValidationFailed, ErrorKind.Invalid, $"{amount} is not more than zero with at most two decimal places.");
