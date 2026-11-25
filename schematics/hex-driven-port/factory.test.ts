import { describe, expect, test } from "bun:test";
import { runFactoryForTest } from "@pbuilder/sdk/testing";
import { repoFiles } from "../_hex/seed.ts";
import contextFactory from "../hex-context/factory.ts";
import factory from "./factory.ts";

const repo = repoFiles("docs/transfers/domain-model.md", "src/Bank.Api/Program.cs", "src/Bank.Api/Bank.Api.csproj", "Bank.slnx");
const withContext = async (): Promise<Record<string, string>> => {
  const { tree } = await runFactoryForTest(contextFactory, { context: "Transfers" }, { seed: repo });
  return { ...repo, ...Object.fromEntries(tree) };
};
const run = async (port: string, seed?: Record<string, string>) =>
  runFactoryForTest(factory, { context: "Transfers", port }, { packageDir: import.meta.dir, seed: seed ?? (await withContext()) });

describe("hex-driven-port", () => {
  test("writes the port interface from its Answers and Contract", async () => {
    const { error, tree } = await run("TransferLog");
    expect(error).toBeUndefined();
    expect(tree.get("src/Transfers.Application/Ports/ITransferLog.cs")).toBe(`using Transfers.Domain;

namespace Transfers.Application.Ports;

/// <summary>Record adds the transfer and never replaces one · ById answers null for an id never recorded</summary>
public interface ITransferLog
{
    Task Record(Transfer transfer);

    Task<Transfer?> ById(Guid id);
}
`);
  });

  test("writes the adapter named in Adapter today as a stub", async () => {
    const adapter = (await run("TransferLog")).tree.get("src/Transfers.Infrastructure/InMemoryTransferLog.cs")!;
    expect(adapter).toContain("public sealed class InMemoryTransferLog : ITransferLog");
    expect(adapter).toContain("public Task Record(Transfer transfer) => throw new NotImplementedException();");
    expect(adapter).toContain("public Task<Transfer?> ById(Guid id) => throw new NotImplementedException();");
  });

  test("registers an in-memory adapter as a singleton", async () => {
    const registration = (await run("TransferLog")).tree.get("src/Transfers.Infrastructure/TransfersServiceCollectionExtensions.cs")!;
    expect(registration).toContain("using Transfers.Application.Ports;");
    expect(registration).toContain("using Transfers.Infrastructure;");
    expect(registration).toContain("services.AddSingleton<ITransferLog, InMemoryTransferLog>();\n        return services;");
  });

  test("a port with only primitive types needs no domain using, and any other adapter is scoped", async () => {
    const { tree } = await run("AccountsGateway");
    const port = tree.get("src/Transfers.Application/Ports/IAccountsGateway.cs")!;
    expect(port.startsWith("namespace Transfers.Application.Ports;")).toBe(true);
    expect(port).toContain("Task Move(Guid fromAccountId, Guid toAccountId, decimal amount);");
    expect(tree.get("src/Transfers.Infrastructure/TransfersServiceCollectionExtensions.cs")).toContain(
      "services.AddScoped<IAccountsGateway, AccountsContextGateway>();",
    );
  });

  test("changes nothing for a port that already exists", async () => {
    const first = await run("TransferLog");
    const second = await run("TransferLog", { ...(await withContext()), ...Object.fromEntries(first.tree) });
    expect(second.error).toBeUndefined();
    expect(second.tree.size).toBe(0);
  });

  test("refuses a port the domain model does not document", async () => {
    const { error } = await run("Ledger");
    expect(String(error)).toContain("Driven ports has no row for Ledger in domain-model.md — document the port first");
  });

  test("refuses a context hex-context has not created", async () => {
    const { error } = await run("TransferLog", repo);
    expect(String(error)).toContain("create the context first: hex-context --context=Transfers");
  });
});
