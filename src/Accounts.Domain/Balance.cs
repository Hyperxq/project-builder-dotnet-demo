namespace Accounts.Domain;

/// <summary>The money an account holds; never below zero.</summary>
public readonly record struct Balance
{
    public static readonly Balance Zero = new(0.00m);

    private Balance(decimal value) => Value = value;

    public decimal Value { get; }

    public Balance Plus(Amount amount) => new(Value + amount.Value);

    public Balance Minus(Amount amount) => amount.Value > Value ? throw new InsufficientFunds() : new(Value - amount.Value);
}
