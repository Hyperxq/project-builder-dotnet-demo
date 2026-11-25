import { describe, expect, test } from "bun:test";
import { runFactoryForTest } from "@pbuilder/sdk/testing";
import { repoFiles } from "../_hex/seed.ts";
import factory from "./factory.ts";

// Payments is not a context of the repo, so the real Program.cs and solution stay valid seeds whatever contexts exist.
const seed = {
  ...repoFiles("src/Bank.Api/Program.cs", "src/Bank.Api/Bank.Api.csproj", "Bank.slnx"),
  "docs/payments/domain-model.md": "# payments — domain model\n",
};
const run = (context = "Payments", withSeed = seed) =>
  runFactoryForTest(factory, { context }, { packageDir: import.meta.dir, seed: withSeed });

describe("hex-context", () => {
  test("creates the three projects with their references", async () => {
    const { error, tree } = await run();
    expect(error).toBeUndefined();
    expect(tree.get("src/Payments.Domain/Payments.Domain.csproj")).toContain('<ProjectReference Include="../Bank.Kernel/Bank.Kernel.csproj" />');
    expect(tree.get("src/Payments.Application/Payments.Application.csproj")).toContain(
      '<ProjectReference Include="../Payments.Domain/Payments.Domain.csproj" />',
    );
    const infrastructure = tree.get("src/Payments.Infrastructure/Payments.Infrastructure.csproj");
    expect(infrastructure).toContain('<ProjectReference Include="../Payments.Application/Payments.Application.csproj" />');
    expect(infrastructure).toContain("Microsoft.Extensions.DependencyInjection.Abstractions");
  });

  test("creates the registration, the endpoint group and the .http file", async () => {
    const { tree } = await run();
    expect(tree.get("src/Payments.Infrastructure/PaymentsServiceCollectionExtensions.cs")).toContain(
      "public static IServiceCollection AddPayments(this IServiceCollection services)",
    );
    const endpoints = tree.get("src/Bank.Api/Payments/PaymentsEndpoints.cs");
    expect(endpoints).toContain('api.MapGroup("/payments")\n            .WithTags("Payments");');
    expect(tree.get("src/Bank.Api/Payments/Payments.http")).toBe("@baseUrl = http://localhost:5069\n");
  });

  test("adds the projects to the solution's src folder", async () => {
    const solution = (await run()).tree.get("Bank.slnx")!;
    for (const layer of ["Application", "Domain", "Infrastructure"]) {
      expect(solution).toContain(`<Project Path="src/Payments.${layer}/Payments.${layer}.csproj" />`);
    }
    expect(solution.indexOf("Payments.Domain")).toBeLessThan(solution.indexOf('<Folder Name="/tests/">'));
  });

  test("references the new projects from Bank.Api and wires them into Program.cs", async () => {
    const { tree } = await run();
    const api = tree.get("src/Bank.Api/Bank.Api.csproj")!;
    expect(api).toContain('<ProjectReference Include="..\\Payments.Application\\Payments.Application.csproj" />');
    expect(api).toContain('<ProjectReference Include="..\\Payments.Infrastructure\\Payments.Infrastructure.csproj" />');
    const program = tree.get("src/Bank.Api/Program.cs")!;
    expect(program).toContain("using Bank.Api.Payments;");
    // After the last context registration and mapping, whichever context that is.
    expect(program).toMatch(/^builder\.Services\.Add\w+\(\);\nbuilder\.Services\.AddPayments\(\);\n\nvar app/m);
    expect(program).toMatch(/^api\.Map\w+Endpoints\(\);\napi\.MapPaymentsEndpoints\(\);\n\napp\.Run/m);
  });

  test("changes nothing for a context that already has its projects", async () => {
    const first = await run();
    const second = await run("Payments", { ...seed, ...Object.fromEntries(first.tree) });
    expect(second.error).toBeUndefined();
    expect(second.tree.size).toBe(0);
  });

  test("refuses a context with no domain model", async () => {
    const { error } = await run("Loans");
    expect(String(error)).toContain("document the context first: docs/loans/domain-model.md does not exist");
  });

  test("refuses a context name that is not PascalCase", async () => {
    const { error } = await run("payments");
    expect(String(error)).toContain("--context must be PascalCase");
  });
});
