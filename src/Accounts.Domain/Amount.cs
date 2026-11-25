namespace Accounts.Domain;

/// <summary>Money being deposited, withdrawn or moved: more than zero, at most two decimal places.</summary>
public readonly record struct Amount
{
    private Amount(decimal value) => Value = value;

    public decimal Value { get; }

    public static Amount Of(decimal value) =>
        value > 0 && decimal.Round(value, 2) == value ? new Amount(value) : throw new InvalidAmount(value);
}
