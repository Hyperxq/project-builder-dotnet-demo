namespace Transfers.Domain;

/// <summary>One sending of money the bank made; it exists only for money that moved.</summary>
public sealed class Transfer
{
    private Transfer(Guid id, Guid fromAccountId, Guid toAccountId, Amount amount)
    {
        Id = id;
        FromAccountId = fromAccountId;
        ToAccountId = toAccountId;
        Amount = amount;
    }

    public Guid Id { get; }

    public Guid FromAccountId { get; }

    public Guid ToAccountId { get; }

    public Amount Amount { get; }

    /// <summary>Records money that already moved (rule 3): call it only after the move succeeded.</summary>
    public static Transfer Made(Guid fromAccountId, Guid toAccountId, Amount amount) =>
        new(Guid.NewGuid(), fromAccountId, toAccountId, amount);
}
