using Bank.Acceptance.Support;
using Reqnroll;

namespace Bank.Acceptance.Steps;

[Binding]
public sealed class HttpSteps(ApiDriver api)
{
    [When("a client asks for the API health")]
    public Task WhenAClientAsksForTheApiHealth() => api.Send(HttpMethod.Get, "/api/health");

    [Then("the response status is {int}")]
    public void ThenTheResponseStatusIs(int status) => Assert.That(api.Last.Status, Is.EqualTo(status));

    [Then("the request is refused as invalid")]
    public void ThenTheRequestIsRefusedAsInvalid() => ThenTheRequestIsRefusedWith("validation.failed");

    [Then("the request is refused with {string}")]
    public void ThenTheRequestIsRefusedWith(string code) =>
        Assert.That((api.Last.Status, api.Last.Code), Is.EqualTo((StatusOf(code), code)));

    // The HTTP status each code answers, as the domain models' Errors tables give it.
    private static int StatusOf(string code) => code switch
    {
        "validation.failed" => 400,
        _ when code.EndsWith("_not_found") => 404,
        _ => 422,
    };
}
