import { describe, expect, test } from "bun:test";
import { runFactoryForTest } from "@pbuilder/sdk/testing";
import { repoFiles } from "../_hex/seed.ts";
import contextFactory from "../hex-context/factory.ts";
import portFactory from "../hex-driven-port/factory.ts";
import useCaseFactory from "../hex-use-case/factory.ts";
import factory from "./factory.ts";

const repo = repoFiles("docs/transfers/domain-model.md", "docs/transfers/transfer-money.feature", "docs/transfers/get-transfer.feature", "src/Bank.Api/Program.cs", "src/Bank.Api/Bank.Api.csproj", "Bank.slnx");

/** The Transfers workspace after hex-context, both ports and both use cases. */
const transfers = async (): Promise<Record<string, string>> => {
  const steps: [unknown, Record<string, string>][] = [
    [contextFactory, { context: "Transfers" }],
    [portFactory, { context: "Transfers", port: "AccountsGateway" }],
    [portFactory, { context: "Transfers", port: "TransferLog" }],
    [useCaseFactory, { context: "Transfers", name: "TransferMoney" }],
    [useCaseFactory, { context: "Transfers", name: "GetTransfer" }],
  ];
  let seed = repo;
  for (const [step, input] of steps) {
    const { error, tree } = await runFactoryForTest(step as never, input as never, { seed });
    if (error) throw error;
    seed = { ...seed, ...Object.fromEntries(tree) };
  }
  return seed;
};
const run = (context: string, use_case: string, seed: Record<string, string>) =>
  runFactoryForTest(factory, { context, use_case }, { packageDir: import.meta.dir, seed });

describe("hex-endpoint", () => {
  test("a POST answering 201 takes the whole command as its request body", async () => {
    const { error, tree } = await run("Transfers", "TransferMoney", await transfers());
    expect(error).toBeUndefined();
    expect(tree.get("src/Bank.Api/Transfers/TransferMoneyEndpoint.cs")).toBe(`using Transfers.Application;

namespace Bank.Api.Transfers;

public static class TransferMoneyEndpoint
{
    public sealed record Request(Guid FromAccountId, Guid ToAccountId, decimal Amount);

    public static RouteGroupBuilder MapTransferMoney(this RouteGroupBuilder group)
    {
        group.MapPost("/", async (Request request, ITransferMoney useCase) =>
                TypedResults.Created((string?)null, await useCase.Handle(new TransferMoneyCommand(request.FromAccountId, request.ToAccountId, request.Amount))))
            .WithName(nameof(TransferMoney))
            .WithSummary("Transfer money")
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity);
        return group;
    }
}
`);
  });

  test("a GET takes its command from the route and has no request body", async () => {
    const endpoint = (await run("Transfers", "GetTransfer", await transfers())).tree.get("src/Bank.Api/Transfers/GetTransferEndpoint.cs")!;
    expect(endpoint).not.toContain("record Request");
    expect(endpoint).toContain(`group.MapGet("/{transferId}", async (Guid transferId, IGetTransfer useCase) =>
                TypedResults.Ok(await useCase.Handle(new GetTransferCommand(transferId))))`);
  });

  test("maps the endpoint on the context's group and adds its .http request", async () => {
    const seed = await transfers();
    const first = await run("Transfers", "TransferMoney", seed);
    const second = await run("Transfers", "GetTransfer", { ...seed, ...Object.fromEntries(first.tree) });
    expect(second.tree.get("src/Bank.Api/Transfers/TransfersEndpoints.cs")).toContain(`api.MapGroup("/transfers")
            .WithTags("Transfers")
            .MapTransferMoney()
            .MapGetTransfer();`);
    expect(second.tree.get("src/Bank.Api/Transfers/Transfers.http")).toBe(`@baseUrl = http://localhost:5069
@transferId = 00000000-0000-0000-0000-000000000000

### Transfer money
POST {{baseUrl}}/api/transfers
Content-Type: application/json

{
  "fromAccountId": "00000000-0000-0000-0000-000000000000",
  "toAccountId": "00000000-0000-0000-0000-000000000000",
  "amount": 10.00
}

### Get a transfer
GET {{baseUrl}}/api/transfers/{{transferId}}
`);
  });

  // The accounts endpoints were written by hand first; the generator must reproduce them byte for byte.
  for (const useCase of ["DepositMoney", "WithdrawMoney", "GetBalance"]) {
    test(`reproduces the hand-written ${useCase} endpoint of the accounts canon`, async () => {
      const canon = repoFiles(
        "docs/accounts/domain-model.md",
        `src/Accounts.Application/${useCase}.cs`,
        `docs/accounts/${useCase.replace(/(?<!^)([A-Z])/g, "-$1").toLowerCase()}.feature`,
        "src/Bank.Api/Accounts/AccountsEndpoints.cs",
        "src/Bank.Api/Accounts/Accounts.http",
        `src/Bank.Api/Accounts/${useCase}Endpoint.cs`,
      );
      const handWritten = canon[`src/Bank.Api/Accounts/${useCase}Endpoint.cs`];
      delete canon[`src/Bank.Api/Accounts/${useCase}Endpoint.cs`];
      const { error, tree } = await run("Accounts", useCase, canon);
      expect(error).toBeUndefined();
      expect(tree.get(`src/Bank.Api/Accounts/${useCase}Endpoint.cs`)).toBe(handWritten);
    });
  }

  test("changes nothing for an endpoint that already exists", async () => {
    const seed = await transfers();
    const first = await run("Transfers", "TransferMoney", seed);
    const second = await run("Transfers", "TransferMoney", { ...seed, ...Object.fromEntries(first.tree) });
    expect(second.error).toBeUndefined();
    expect(second.tree.size).toBe(0);
  });

  test("refuses a use case hex-use-case has not generated", async () => {
    const seed = await transfers();
    delete seed["src/Transfers.Application/GetTransfer.cs"];
    const { error } = await run("Transfers", "GetTransfer", seed);
    expect(String(error)).toContain("create the use case first: hex-use-case --context=Transfers --name=GetTransfer");
  });

  test("refuses a use case with no documented route", async () => {
    const { error } = await run("Accounts", "MoveMoney", repoFiles("docs/accounts/domain-model.md"));
    expect(String(error)).toContain("Driving adapters has no route for MoveMoney in domain-model.md — document the route first");
  });
});
