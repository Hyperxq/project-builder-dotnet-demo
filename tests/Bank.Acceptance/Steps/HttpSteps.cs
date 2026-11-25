using System.Net;
using Bank.Acceptance.Support;
using Reqnroll;

namespace Bank.Acceptance.Steps;

[Binding]
public sealed class HttpSteps(ApiDriver api)
{
    [When("a client asks for the API health")]
    public async Task WhenAClientAsksForTheApiHealth() =>
        api.LastResponse = await api.Client.GetAsync("/api/health");

    [Then("the response status is {int}")]
    public void ThenTheResponseStatusIs(int status) =>
        Assert.That(api.LastResponse!.StatusCode, Is.EqualTo((HttpStatusCode)status));
}
