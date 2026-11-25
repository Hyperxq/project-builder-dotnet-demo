namespace Accounts.Domain;

public sealed record HolderName
{
    public const int MaxLength = 100;

    private HolderName(string value) => Value = value;

    public string Value { get; }

    public static HolderName Of(string? value)
    {
        var trimmed = value?.Trim() ?? "";
        return trimmed.Length is >= 1 and <= MaxLength ? new HolderName(trimmed) : throw new InvalidHolderName(MaxLength);
    }
}
