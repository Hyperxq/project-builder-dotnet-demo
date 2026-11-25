using Bank.Acceptance.Support;
using Reqnroll;

namespace Bank.Acceptance.Steps;

[Binding]
public sealed class TransfersSteps(ApiDriver api, Holders holders)
{
    private Guid _transferId;

    [When("""^(\w+) transfers (-?[\d.]+) to (\w+)$""")]
    public Task WhenTransfersTo(string from, decimal amount, string to) => Transfer(holders[from], holders[to], amount);

    [When("""^(\w+) transfers (-?[\d.]+) from (?:her|his|their) account to the same account$""")]
    public Task WhenTransfersToTheSameAccount(string holder, decimal amount) => Transfer(holders[holder], holders[holder], amount);

    [When("""^(\w+) transfers (-?[\d.]+) to an account that does not exist$""")]
    public Task WhenTransfersToAnUnknownAccount(string from, decimal amount) => Transfer(holders[from], Guid.NewGuid(), amount);

    [When("""^(-?[\d.]+) is transferred from an account that does not exist to (\w+)$""")]
    public Task WhenIsTransferredFromAnUnknownAccount(decimal amount, string to) => Transfer(Guid.NewGuid(), holders[to], amount);

    [Given("""^(\w+) transferred (-?[\d.]+) to (\w+)$""")]
    public async Task GivenTransferredTo(string from, decimal amount, string to)
    {
        await Transfer(holders[from], holders[to], amount);
        _transferId = api.Last.Body.GetProperty("transferId").GetGuid();
    }

    [When("""^(\w+) reads that transfer$""")]
    public Task WhenReadsThatTransfer(string holder) => ReadTransfer(_transferId);

    [When("a transfer that was never made is read")]
    public Task WhenATransferThatWasNeverMadeIsRead() => ReadTransfer(Guid.NewGuid());

    [Then("""^the transfer is recorded from (\w+)'s account to (\w+)'s for (-?[\d.]+)$""")]
    public async Task ThenTheTransferIsRecorded(string from, string to, decimal amount)
    {
        Assert.That(api.Last.Status, Is.EqualTo(201));
        await ReadTransfer(api.Last.Body.GetProperty("transferId").GetGuid());
        ThenTheTransferShownIs(from, to, amount);
    }

    [Then("""^the transfer shown is from (\w+)'s account to (\w+)'s for (-?[\d.]+)$""")]
    public void ThenTheTransferShownIs(string from, string to, decimal amount)
    {
        Assert.That(api.Last.Status, Is.EqualTo(200));
        Assert.That(api.Last.Body.GetProperty("fromAccountId").GetGuid(), Is.EqualTo(holders[from]));
        Assert.That(api.Last.Body.GetProperty("toAccountId").GetGuid(), Is.EqualTo(holders[to]));
        Assert.That(api.Last.Body.GetProperty("amount").GetDecimal(), Is.EqualTo(amount));
    }

    [Then("no transfer id is given")]
    public void ThenNoTransferIdIsGiven() => Assert.That(api.Last.Body.TryGetProperty("transferId", out _), Is.False);

    private Task Transfer(Guid from, Guid to, decimal amount) =>
        api.Send(HttpMethod.Post, "/api/transfers", new { fromAccountId = from, toAccountId = to, amount });

    private Task ReadTransfer(Guid transferId) => api.Send(HttpMethod.Get, $"/api/transfers/{transferId}");
}
