namespace Bank.Kernel;

public enum ErrorKind
{
    Invalid,
    NotFound,
    Refused,
}

/// <summary>A refusal a domain rule raises. Its <see cref="Code"/> is the one the domain model's Errors table publishes.</summary>
public abstract class DomainError(string code, ErrorKind kind, string message) : Exception(message)
{
    public const string ValidationFailed = "validation.failed";

    public string Code { get; } = code;

    public ErrorKind Kind { get; } = kind;
}
