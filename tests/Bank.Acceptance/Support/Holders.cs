namespace Bank.Acceptance.Support;

/// <summary>The accounts a scenario opened, by the holder's first name ("Ana Smith" → "Ana").</summary>
public sealed class Holders
{
    private readonly Dictionary<string, Guid> _accounts = new();

    public static string FirstName(string holderName) => holderName.Trim().Split(' ')[0];

    public void Add(string holderName, Guid accountId) => _accounts[FirstName(holderName)] = accountId;

    public Guid this[string firstName] => _accounts[firstName];
}
