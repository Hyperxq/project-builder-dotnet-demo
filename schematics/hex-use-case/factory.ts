import * as aspnet from "@pbuilder/sdk/aspnet";
import * as csharp from "@pbuilder/sdk/csharp";
import { find } from "@pbuilder/sdk/commons";
import { type Field, assertPascal, camel, fields, names, pascal, paths, readModel, readRequired, row, write } from "../_hex/lib.ts";
import type { Input } from "./schema.generated.ts";

const record = (name: string, all: Field[]): string =>
  `public sealed record ${name}(${all.map((f) => `${f.type} ${pascal(f.name)}`).join(", ")});`;

export default async (input: Input) => {
  const context = assertPascal(input.context, "context");
  const name = assertPascal(input.name, "name");
  const p = paths(context);
  const model = await readModel(context);
  const [, command, result, portsCell] = row(model, "Use cases", name, "document the use case first");
  const ports = names(portsCell);

  await readRequired(p.registration, `create the context first: hex-context --context=${context}`);
  for (const port of ports) {
    await readRequired(`${p.application}/Ports/I${port}.cs`, `create the port first: hex-driven-port --context=${context} --port=${port}`);
  }

  const path = `${p.application}/${name}.cs`;
  const ns = `${context}.Application`;
  const existing = await find(path).read();
  if (existing !== undefined) {
    // The use case is written already: only the ports its row added since then reach it.
    const missing = ports.filter((port) => !existing.includes(`I${port} ${camel(port)}`));
    if (missing.length === 0) return;
    let handler = csharp.find(path);
    for (const port of missing) handler = handler.addConstructorParameter(name, camel(port), `I${port}`, { from: `${ns}.Ports` });
    await handler;
    return;
  }

  const parameters = ports.map((port) => `I${port} ${camel(port)}`).join(", ");
  write(
    path,
    `${ports.length > 0 ? `using ${ns}.Ports;\n\n` : ""}namespace ${ns};

${record(`${name}Command`, fields(command))}

${record(`${name}Result`, fields(result))}

public interface I${name}
{
    Task<${name}Result> Handle(${name}Command command);
}

public sealed class ${name}${parameters ? `(${parameters})` : ""} : I${name}
{
    public Task<${name}Result> Handle(${name}Command command) => throw new NotImplementedException();
}
`,
  );

  await aspnet.find(p.registration).addService("Scoped", `I${name}`, name, {
    method: `Add${context}`,
    serviceFrom: ns,
    implementationFrom: ns,
  });
};
