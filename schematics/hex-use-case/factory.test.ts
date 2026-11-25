import { describe, expect, test } from "bun:test";
import { runFactoryForTest } from "@pbuilder/sdk/testing";
import { repoFiles } from "../_hex/seed.ts";
import contextFactory from "../hex-context/factory.ts";
import portFactory from "../hex-driven-port/factory.ts";
import factory from "./factory.ts";

const repo = repoFiles("docs/transfers/domain-model.md", "src/Bank.Api/Program.cs", "src/Bank.Api/Bank.Api.csproj", "Bank.slnx");

/** The workspace after hex-context and hex-driven-port for the given ports. */
const prepared = async (...ports: string[]): Promise<Record<string, string>> => {
  let seed = { ...repo, ...Object.fromEntries((await runFactoryForTest(contextFactory, { context: "Transfers" }, { seed: repo })).tree) };
  for (const port of ports) {
    seed = { ...seed, ...Object.fromEntries((await runFactoryForTest(portFactory, { context: "Transfers", port }, { seed })).tree) };
  }
  return seed;
};
const run = (name: string, seed: Record<string, string>) =>
  runFactoryForTest(factory, { context: "Transfers", name }, { packageDir: import.meta.dir, seed });

describe("hex-use-case", () => {
  test("writes the command, result, driving port and handler with its driven ports", async () => {
    const { error, tree } = await run("TransferMoney", await prepared("AccountsGateway", "TransferLog"));
    expect(error).toBeUndefined();
    expect(tree.get("src/Transfers.Application/TransferMoney.cs")).toBe(`using Transfers.Application.Ports;

namespace Transfers.Application;

public sealed record TransferMoneyCommand(Guid FromAccountId, Guid ToAccountId, decimal Amount);

public sealed record TransferMoneyResult(Guid TransferId);

public interface ITransferMoney
{
    Task<TransferMoneyResult> Handle(TransferMoneyCommand command);
}

public sealed class TransferMoney(IAccountsGateway accountsGateway, ITransferLog transferLog) : ITransferMoney
{
    public Task<TransferMoneyResult> Handle(TransferMoneyCommand command) => throw new NotImplementedException();
}
`);
  });

  test("registers the use case behind its driving port", async () => {
    const { tree } = await run("TransferMoney", await prepared("AccountsGateway", "TransferLog"));
    const registration = tree.get("src/Transfers.Infrastructure/TransfersServiceCollectionExtensions.cs")!;
    expect(registration).toContain("using Transfers.Application;");
    expect(registration).toContain("services.AddScoped<ITransferMoney, TransferMoney>();\n        return services;");
  });

  test("refuses a use case whose driven port does not exist yet", async () => {
    const { error } = await run("TransferMoney", await prepared("TransferLog"));
    expect(String(error)).toContain("create the port first: hex-driven-port --context=Transfers --port=AccountsGateway");
  });

  test("adds only the constructor parameters of ports added to the row since", async () => {
    const seed = await prepared("AccountsGateway", "TransferLog");
    const first = await run("TransferMoney", seed);
    const written = { ...seed, ...Object.fromEntries(first.tree) };
    written["src/Transfers.Application/TransferMoney.cs"] = written["src/Transfers.Application/TransferMoney.cs"].replace(
      "(IAccountsGateway accountsGateway, ITransferLog transferLog)",
      "(IAccountsGateway accountsGateway)",
    );
    const second = await run("TransferMoney", written);
    expect(second.error).toBeUndefined();
    expect([...second.tree.keys()]).toEqual(["src/Transfers.Application/TransferMoney.cs"]);
    expect(second.tree.get("src/Transfers.Application/TransferMoney.cs")).toContain(
      "public sealed class TransferMoney(IAccountsGateway accountsGateway, ITransferLog transferLog) : ITransferMoney",
    );
  });

  test("changes nothing for a use case that already has every port", async () => {
    const seed = await prepared("AccountsGateway", "TransferLog");
    const first = await run("TransferMoney", seed);
    const second = await run("TransferMoney", { ...seed, ...Object.fromEntries(first.tree) });
    expect(second.error).toBeUndefined();
    expect(second.tree.size).toBe(0);
  });

  test("refuses a use case the domain model does not document", async () => {
    const { error } = await run("ReverseTransfer", await prepared());
    expect(String(error)).toContain("Use cases has no row for ReverseTransfer in domain-model.md — document the use case first");
  });
});
