using Bank.Kernel;

namespace Transfers.Domain;

public sealed class SameAccount()
    : DomainError("transfers.same_account", ErrorKind.Refused, "A transfer needs two different accounts.");

public sealed class AccountNotFound()
    : DomainError("transfers.account_not_found", ErrorKind.NotFound, "An account of the transfer was not found.");

public sealed class InsufficientFunds()
    : DomainError("transfers.insufficient_funds", ErrorKind.Refused, "The source account holds less than the amount.");

public sealed class TransferNotFound(Guid transferId)
    : DomainError("transfers.transfer_not_found", ErrorKind.NotFound, $"Transfer {transferId} was not found.");

public sealed class InvalidAmount(decimal amount)
    : DomainError(ValidationFailed, ErrorKind.Invalid, $"{amount} is not more than zero with at most two decimal places.");
