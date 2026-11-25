import * as aspnet from "@pbuilder/sdk/aspnet";
import { find } from "@pbuilder/sdk/commons";
import { type Method, assertPascal, methods, paths, readModel, readRequired, row, write } from "../_hex/lib.ts";
import type { Input } from "./schema.generated.ts";

const PRIMITIVES = /^(Task|Guid|decimal|string|bool|int|void)$/;

const signature = (method: Method): string =>
  `${method.returns} ${method.name}(${method.parameters.map((p) => `${p.type} ${p.name}`).join(", ")})`;

/** True when a signature names a type of the context's own domain, which then needs its using. */
const namesDomainType = (all: Method[]): boolean =>
  all.some((m) =>
    [...m.parameters.map((p) => p.type), m.returns.replace(/^Task<|>$|\?/g, "")].some((type) => !PRIMITIVES.test(type)),
  );

const xml = (text: string): string => text.replace(/`/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async (input: Input) => {
  const context = assertPascal(input.context, "context");
  const port = assertPascal(input.port, "port");
  const p = paths(context);
  const model = await readModel(context);
  const [, answers, adapterCell, contract] = row(model, "Driven ports", port, "document the port first");
  const adapter = assertPascal(adapterCell.replace(/`/g, ""), "Adapter today");
  const portMethods = methods(answers);

  const interfacePath = `${p.application}/Ports/I${port}.cs`;
  if ((await find(interfacePath).read()) !== undefined) return;
  await readRequired(p.registration, `create the context first: hex-context --context=${context}`);

  const domainUsing = namesDomainType(portMethods) ? `using ${context}.Domain;\n\n` : "";
  write(
    interfacePath,
    `${domainUsing}namespace ${context}.Application.Ports;

/// <summary>${xml(contract)}</summary>
public interface I${port}
{
${portMethods.map((m) => `    ${signature(m)};`).join("\n\n")}
}
`,
  );

  write(
    `${p.infrastructure}/${adapter}.cs`,
    `using ${context}.Application.Ports;
${domainUsing ? `using ${context}.Domain;\n` : ""}
namespace ${context}.Infrastructure;

public sealed class ${adapter} : I${port}
{
${portMethods.map((m) => `    public ${signature(m)} => throw new NotImplementedException();`).join("\n\n")}
}
`,
  );

  // An in-memory adapter holds the state itself, so the whole app must share one instance.
  const lifetime = adapter.startsWith("InMemory") ? "Singleton" : "Scoped";
  await aspnet.find(p.registration).addService(lifetime, `I${port}`, adapter, {
    method: `Add${context}`,
    serviceFrom: `${context}.Application.Ports`,
    implementationFrom: `${context}.Infrastructure`,
  });
};
