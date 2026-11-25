import { describe, expect, test } from "bun:test";
import { runFactoryForTest } from "@pbuilder/sdk/testing";
import { repoFiles } from "../_hex/seed.ts";
import factory from "./factory.ts";

const seed = repoFiles("docs/transfers/domain-model.md", "src/Bank.Api/Program.cs", "src/Bank.Api/Bank.Api.csproj", "Bank.slnx");
const run = (context = "Transfers", withSeed = seed) =>
  runFactoryForTest(factory, { context }, { packageDir: import.meta.dir, seed: withSeed });

describe("hex-context", () => {
  test("creates the three projects with their references", async () => {
    const { error, tree } = await run();
    expect(error).toBeUndefined();
    expect(tree.get("src/Transfers.Domain/Transfers.Domain.csproj")).toContain('<ProjectReference Include="../Bank.Kernel/Bank.Kernel.csproj" />');
    expect(tree.get("src/Transfers.Application/Transfers.Application.csproj")).toContain(
      '<ProjectReference Include="../Transfers.Domain/Transfers.Domain.csproj" />',
    );
    const infrastructure = tree.get("src/Transfers.Infrastructure/Transfers.Infrastructure.csproj");
    expect(infrastructure).toContain('<ProjectReference Include="../Transfers.Application/Transfers.Application.csproj" />');
    expect(infrastructure).toContain("Microsoft.Extensions.DependencyInjection.Abstractions");
  });

  test("creates the registration, the endpoint group and the .http file", async () => {
    const { tree } = await run();
    expect(tree.get("src/Transfers.Infrastructure/TransfersServiceCollectionExtensions.cs")).toContain(
      "public static IServiceCollection AddTransfers(this IServiceCollection services)",
    );
    const endpoints = tree.get("src/Bank.Api/Transfers/TransfersEndpoints.cs");
    expect(endpoints).toContain('api.MapGroup("/transfers")\n            .WithTags("Transfers");');
    expect(tree.get("src/Bank.Api/Transfers/Transfers.http")).toBe("@baseUrl = http://localhost:5069\n");
  });

  test("adds the projects to the solution's src folder", async () => {
    const solution = (await run()).tree.get("Bank.slnx")!;
    for (const layer of ["Application", "Domain", "Infrastructure"]) {
      expect(solution).toContain(`<Project Path="src/Transfers.${layer}/Transfers.${layer}.csproj" />`);
    }
    expect(solution.indexOf("Transfers.Domain")).toBeLessThan(solution.indexOf('<Folder Name="/tests/">'));
  });

  test("references the new projects from Bank.Api and wires them into Program.cs", async () => {
    const { tree } = await run();
    const api = tree.get("src/Bank.Api/Bank.Api.csproj")!;
    expect(api).toContain('<ProjectReference Include="..\\Transfers.Application\\Transfers.Application.csproj" />');
    expect(api).toContain('<ProjectReference Include="..\\Transfers.Infrastructure\\Transfers.Infrastructure.csproj" />');
    const program = tree.get("src/Bank.Api/Program.cs")!;
    expect(program).toContain("using Bank.Api.Transfers;");
    expect(program).toContain("builder.Services.AddAccounts();\nbuilder.Services.AddTransfers();");
    expect(program).toContain("api.MapAccountsEndpoints();\napi.MapTransfersEndpoints();");
  });

  test("changes nothing for a context that already has its projects", async () => {
    const first = await run();
    const second = await run("Transfers", { ...seed, ...Object.fromEntries(first.tree) });
    expect(second.error).toBeUndefined();
    expect(second.tree.size).toBe(0);
  });

  test("refuses a context with no domain model", async () => {
    const { error } = await run("Loans");
    expect(String(error)).toContain("document the context first: docs/loans/domain-model.md does not exist");
  });

  test("refuses a context name that is not PascalCase", async () => {
    const { error } = await run("transfers");
    expect(String(error)).toContain("--context must be PascalCase");
  });
});
