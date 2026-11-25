using Accounts.Application;
using Bank.Acceptance.Support;
using Reqnroll;

namespace Bank.Acceptance.Steps;

[Binding]
public sealed class AccountsSteps(ApiDriver api, Holders holders)
{
    private const decimal DepositLimit = 10_000.00m;

    [Given("""^"(.*)" has an account with a balance of (-?[\d.]+)$""")]
    public async Task GivenHasAnAccountWithABalanceOf(string holderName, decimal balance)
    {
        var opened = await api.Send(HttpMethod.Post, "/api/accounts", new { holderName });
        var accountId = opened.Body.GetProperty("accountId").GetGuid();
        holders.Add(holderName, accountId);
        for (var left = balance; left > 0; left -= DepositLimit)
        {
            await api.Send(HttpMethod.Post, $"/api/accounts/{accountId}/deposits", new { amount = Math.Min(left, DepositLimit) });
        }
    }

    [When("""^"(.*)" opens an account$""")]
    public Task WhenOpensAnAccount(string holderName) => OpenAccount(holderName);

    [When("an account is opened with a holder name of {int} characters")]
    public Task WhenAnAccountIsOpenedWithAHolderNameOfCharacters(int length) => OpenAccount(new string('A', length));

    [When("an account is opened with an empty holder name")]
    public Task WhenAnAccountIsOpenedWithAnEmptyHolderName() => OpenAccount("");

    [When("an account is opened with a holder name of only spaces")]
    public Task WhenAnAccountIsOpenedWithAHolderNameOfOnlySpaces() => OpenAccount("   ");

    [When("""^(-?[\d.]+) is deposited into (\w+)'s account$""")]
    public Task WhenIsDepositedInto(decimal amount, string holder) => Deposit(holders[holder], amount);

    [When("""^(-?[\d.]+) is deposited into an account that does not exist$""")]
    public Task WhenIsDepositedIntoAnUnknownAccount(decimal amount) => Deposit(Guid.NewGuid(), amount);

    [When("""^(-?[\d.]+) is withdrawn from (\w+)'s account$""")]
    public Task WhenIsWithdrawnFrom(decimal amount, string holder) => Withdraw(holders[holder], amount);

    [When("""^(-?[\d.]+) is withdrawn from an account that does not exist$""")]
    public Task WhenIsWithdrawnFromAnUnknownAccount(decimal amount) => Withdraw(Guid.NewGuid(), amount);

    [When("""^(\w+) reads (?:her|his|their) balance$""")]
    public Task WhenReadsTheirBalance(string holder) => ReadBalance(holders[holder]);

    [When("the balance of an account that does not exist is read")]
    public Task WhenTheBalanceOfAnUnknownAccountIsRead() => ReadBalance(Guid.NewGuid());

    [When("""^(-?[\d.]+) is moved from (\w+)'s account to (\w+)'s$""")]
    public Task WhenIsMovedFromTo(decimal amount, string from, string to) => Move(holders[from], holders[to], amount);

    [When("""^(-?[\d.]+) is moved from (\w+)'s account to an account that does not exist$""")]
    public Task WhenIsMovedToAnUnknownAccount(decimal amount, string from) => Move(holders[from], Guid.NewGuid(), amount);

    [When("""^(-?[\d.]+) is moved from an account that does not exist to (\w+)'s$""")]
    public Task WhenIsMovedFromAnUnknownAccount(decimal amount, string to) => Move(Guid.NewGuid(), holders[to], amount);

    [Then("the account is opened")]
    public void ThenTheAccountIsOpened() => Assert.That(api.Last.Status, Is.EqualTo(201));

    [Then("""^the account is opened in the name of "(.*)"$""")]
    public void ThenTheAccountIsOpenedInTheNameOf(string holderName)
    {
        ThenTheAccountIsOpened();
        Assert.That(api.Last.Body.GetProperty("holderName").GetString(), Is.EqualTo(holderName));
    }

    [Then("""^its balance is (-?[\d.]+)$""")]
    public void ThenItsBalanceIs(decimal balance) =>
        Assert.That(api.Last.Body.GetProperty("balance").GetDecimal(), Is.EqualTo(balance));

    [Then("""^(\w+)'s balance is (-?[\d.]+)$""")]
    public async Task ThenTheBalanceOfIs(string holder, decimal balance)
    {
        var read = await api.Send(HttpMethod.Get, $"/api/accounts/{holders[holder]}/balance");
        Assert.That(read.Body.GetProperty("balance").GetDecimal(), Is.EqualTo(balance));
    }

    [Then("""^the balance shown is (-?[\d.]+) in the name of "(.*)"$""")]
    public void ThenTheBalanceShownIs(decimal balance, string holderName)
    {
        Assert.That(api.Last.Status, Is.EqualTo(200));
        Assert.That(api.Last.Body.GetProperty("balance").GetDecimal(), Is.EqualTo(balance));
        Assert.That(api.Last.Body.GetProperty("holderName").GetString(), Is.EqualTo(holderName));
    }

    private Task OpenAccount(string holderName) => api.Send(HttpMethod.Post, "/api/accounts", new { holderName });

    private Task Deposit(Guid accountId, decimal amount) =>
        api.Send(HttpMethod.Post, $"/api/accounts/{accountId}/deposits", new { amount });

    private Task Withdraw(Guid accountId, decimal amount) =>
        api.Send(HttpMethod.Post, $"/api/accounts/{accountId}/withdrawals", new { amount });

    // MoveMoney has no route: only the Transfers context calls it.
    private Task Move(Guid from, Guid to, decimal amount) =>
        api.Run<IMoveMoney>(async useCase => await useCase.Handle(new MoveMoneyCommand(from, to, amount)));

    private Task ReadBalance(Guid accountId) => api.Send(HttpMethod.Get, $"/api/accounts/{accountId}/balance");
}
