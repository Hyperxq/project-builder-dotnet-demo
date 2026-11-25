import { find, replaceContent } from "@pbuilder/sdk/commons";
import { type Field, assertPascal, dashed, fields, pascal, paths, readModel, readRequired, row, sentence, table, write } from "../_hex/lib.ts";
import type { Input } from "./schema.generated.ts";

const PROBLEMS: Record<string, string> = {
  "400": ".ProducesValidationProblem()",
  "404": ".ProducesProblem(StatusCodes.Status404NotFound)",
  "422": ".ProducesProblem(StatusCodes.Status422UnprocessableEntity)",
};

const SAMPLES: Record<string, string> = { Guid: '"00000000-0000-0000-0000-000000000000"', decimal: "10.00", string: '"text"' };

const verbOf = (method: string): string => `Map${method[0]}${method.slice(1).toLowerCase()}`;

export default async (input: Input) => {
  const context = assertPascal(input.context, "context");
  const useCase = assertPascal(input.use_case, "use_case");
  const p = paths(context);
  const model = await readModel(context);

  const adapter = table(model, "Driving adapters").find((cells) => cells[1].replace(/`/g, "") === useCase);
  if (!adapter) throw new Error(`Driving adapters has no route for ${useCase} in domain-model.md — document the route first`);
  const [route, , answers] = adapter;
  const [, command, , , featureCell] = row(model, "Use cases", useCase, "document the use case first");
  // The OpenAPI summary is the feature's title, so the API reads like the documentation.
  const featureFile = /\]\(([^)]+\.feature)\)/.exec(featureCell)?.[1];
  const feature = featureFile ? await find(`docs/${dashed(context)}/${featureFile}`).read() : undefined;
  const summary = (feature === undefined ? undefined : /^Feature: (.+)$/m.exec(feature)?.[1]?.trim()) ?? sentence(useCase);

  const match = /^`?(GET|POST|PUT|PATCH|DELETE) (\S+?)`?$/.exec(route);
  if (!match) throw new Error(`cannot read the route ${route} in domain-model.md`);
  const [, method, fullPath] = match;
  const prefix = `/api/${dashed(context)}`;
  if (fullPath !== prefix && !fullPath.startsWith(`${prefix}/`)) throw new Error(`${fullPath} is not under the ${context} group ${prefix}`);
  const path = fullPath.slice(prefix.length) || "/";

  const statuses = [...answers.matchAll(/\b([1-5]\d\d)\b/g)].map((m) => m[1]);
  const success = statuses.find((s) => s.startsWith("2"));
  if (!success) throw new Error(`the route for ${useCase} documents no success status in its Answers`);

  const endpointPath = `${p.api}/${useCase}Endpoint.cs`;
  if ((await find(endpointPath).read()) !== undefined) return;
  await readRequired(`${p.application}/${useCase}.cs`, `create the use case first: hex-use-case --context=${context} --name=${useCase}`);
  const group = await readRequired(p.endpoints, `create the context first: hex-context --context=${context}`);
  const http = await readRequired(p.http, `create the context first: hex-context --context=${context}`);

  const commandFields = fields(command);
  const routeNames = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const routeFields: Field[] = routeNames.map((name) => {
    const field = commandFields.find((f) => f.name === name);
    if (!field) throw new Error(`the route parameter {${name}} is not a field of ${useCase}'s command`);
    return field;
  });
  const bodyFields = commandFields.filter((f) => !routeNames.includes(f.name));
  if (bodyFields.length > 0 && (method === "GET" || method === "DELETE")) {
    throw new Error(`${method} ${fullPath} cannot carry ${bodyFields.map((f) => f.name).join(", ")}: put them in the route`);
  }

  const lambdaParameters = [
    ...routeFields.map((f) => `${f.type} ${f.name}`),
    ...(bodyFields.length > 0 ? ["Request request"] : []),
    `I${useCase} useCase`,
  ].join(", ");
  const commandArguments = commandFields.map((f) => (routeNames.includes(f.name) ? f.name : `request.${pascal(f.name)}`)).join(", ");
  const handled = `await useCase.Handle(new ${useCase}Command(${commandArguments}))`;
  const answer = success === "201" ? `TypedResults.Created((string?)null, ${handled})` : `TypedResults.Ok(${handled})`;
  const problems = [...new Set(statuses.filter((s) => PROBLEMS[s]))].map((s) => `\n            ${PROBLEMS[s]}`).join("");
  const request = bodyFields.length > 0 ? `    public sealed record Request(${bodyFields.map((f) => `${f.type} ${pascal(f.name)}`).join(", ")});\n\n` : "";

  write(
    endpointPath,
    `using ${context}.Application;

namespace Bank.Api.${context};

public static class ${useCase}Endpoint
{
${request}    public static RouteGroupBuilder Map${useCase}(this RouteGroupBuilder group)
    {
        group.${verbOf(method)}("${path}", async (${lambdaParameters}) =>
                ${answer})
            .WithName(nameof(${useCase}))
            .WithSummary("${summary}")${problems};
        return group;
    }
}
`,
  );

  const chainStart = group.indexOf("api.MapGroup(");
  const chainEnd = group.indexOf(";", chainStart);
  if (chainStart === -1 || chainEnd === -1) throw new Error(`${p.endpoints} has no api.MapGroup(...) chain to map ${useCase} on`);
  replaceContent(p.endpoints, `${group.slice(0, chainEnd)}\n            .Map${useCase}()${group.slice(chainEnd)}`);

  const variables = routeNames.filter((name) => !http.includes(`@${name} =`)).map((name) => `@${name} = 00000000-0000-0000-0000-000000000000\n`);
  const body =
    bodyFields.length > 0
      ? `Content-Type: application/json\n\n{\n${bodyFields.map((f) => `  "${f.name}": ${SAMPLES[f.type] ?? "null"}`).join(",\n")}\n}\n`
      : "";
  const url = `{{baseUrl}}${fullPath.replace(/\{(\w+)\}/g, "{{$1}}")}`;
  const [header, ...requests] = http.split("\n###");
  replaceContent(
    p.http,
    [`${header.trimEnd()}\n${variables.join("")}`, ...requests.map((r) => `###${r.trimEnd()}\n`), `### ${summary}\n${method} ${url}\n${body}`].join("\n"),
  );
};
