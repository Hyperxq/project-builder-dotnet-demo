namespace Accounts.Domain;

/// <summary>
/// Immutable: every operation answers a new account, so nothing changes until the use case saves it,
/// and a refused operation leaves no trace.
/// </summary>
public sealed class Account
{
    public const decimal DepositLimit = 10_000.00m;

    private Account(Guid id, HolderName holder, Balance balance)
    {
        Id = id;
        Holder = holder;
        Balance = balance;
    }

    public Guid Id { get; }

    public HolderName Holder { get; }

    public Balance Balance { get; }

    public static Account Open(HolderName holder) => new(Guid.NewGuid(), holder, Balance.Zero);

    public Account Deposit(Amount amount) =>
        amount.Value > DepositLimit ? throw new DepositLimitExceeded(DepositLimit) : WithBalance(Balance.Plus(amount));

    public Account Withdraw(Amount amount) => WithBalance(Balance.Minus(amount));

    public (Account From, Account To) MoveTo(Account destination, Amount amount) =>
        destination.Id == Id
            ? throw new SameAccount()
            : (WithBalance(Balance.Minus(amount)), destination.WithBalance(destination.Balance.Plus(amount)));

    private Account WithBalance(Balance balance) => new(Id, Holder, balance);
}
