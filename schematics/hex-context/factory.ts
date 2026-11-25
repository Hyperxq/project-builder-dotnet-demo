import * as csharp from "@pbuilder/sdk/csharp";
import * as msbuild from "@pbuilder/sdk/msbuild";
import { find } from "@pbuilder/sdk/commons";
import { assertPascal, dashed, paths, readModel, readRequired, write } from "../_hex/lib.ts";
import type { Input } from "./schema.generated.ts";

const SOLUTION = "Bank.slnx";
const API_PROJECT = "src/Bank.Api/Bank.Api.csproj";
const PROGRAM = "src/Bank.Api/Program.cs";

const PROPERTIES = `  <PropertyGroup>
    <TargetFramework>net11.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>`;

const project = (items: string): string => `<Project Sdk="Microsoft.NET.Sdk">

${items}

${PROPERTIES}

</Project>
`;

const reference = (path: string): string => `  <ItemGroup>
    <ProjectReference Include="${path}" />
  </ItemGroup>`;

/** Inserts `line` after the last line matching `after`, keeping its indentation. */
const insertAfterLast = (text: string, after: RegExp, line: string, file: string): string => {
  const lines = text.split("\n");
  const last = lines.findLastIndex((l) => after.test(l));
  if (last === -1) throw new Error(`${file} has no line matching ${after} to add "${line}" after`);
  lines.splice(last + 1, 0, line);
  return lines.join("\n");
};

export default async (input: Input) => {
  const context = assertPascal(input.context, "context");
  const p = paths(context);
  await readModel(context);

  const existing = await find(`${p.application}/${context}.Application.csproj`).read();
  if (existing !== undefined) return;
  const program = await readRequired(PROGRAM, "the context is wired into Bank.Api's Program.cs");
  const solution = await readRequired(SOLUTION, "the projects are added to the solution");
  if (!/^builder\.Services\.Add\w+\(\);$/m.test(program)) throw new Error(`${PROGRAM} has no builder.Services.Add<Context>(); line`);
  if (!/^api\.Map\w+Endpoints\(\);$/m.test(program)) throw new Error(`${PROGRAM} has no api.Map<Context>Endpoints(); line`);
  if (!solution.includes('<Folder Name="/src/">')) throw new Error(`${SOLUTION} has no /src/ folder`);

  write(`${p.domain}/${context}.Domain.csproj`, project(reference("../Bank.Kernel/Bank.Kernel.csproj")));
  write(`${p.application}/${context}.Application.csproj`, project(reference(`../${context}.Domain/${context}.Domain.csproj`)));
  write(
    `${p.infrastructure}/${context}.Infrastructure.csproj`,
    project(`${reference(`../${context}.Application/${context}.Application.csproj`)}

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="11.0.0" />
  </ItemGroup>`),
  );
  write(
    p.registration,
    `namespace Microsoft.Extensions.DependencyInjection;

public static class ${context}ServiceCollectionExtensions
{
    public static IServiceCollection Add${context}(this IServiceCollection services)
    {
        return services;
    }
}
`,
  );
  write(
    p.endpoints,
    `namespace Bank.Api.${context};

public static class ${context}Endpoints
{
    public static IEndpointRouteBuilder Map${context}Endpoints(this IEndpointRouteBuilder api)
    {
        api.MapGroup("/${dashed(context)}")
            .WithTags("${context}");
        return api;
    }
}
`,
  );
  write(p.http, `@baseUrl = http://localhost:5069\n`);

  // The solution has no project-reference op (it is a <Solution>, not a <Project>), so its entries are text edits.
  await msbuild.find(SOLUTION).modify((doc) => {
    const entries = ["Application", "Domain", "Infrastructure"]
      .map((layer) => `    <Project Path="src/${context}.${layer}/${context}.${layer}.csproj" />`)
      .join("\n");
    doc.text = doc.text.replace('<Folder Name="/src/">\n', `<Folder Name="/src/">\n${entries}\n`);
  });

  await msbuild
    .find(API_PROJECT)
    .addProjectReference(`..\\${context}.Application\\${context}.Application.csproj`)
    .addProjectReference(`..\\${context}.Infrastructure\\${context}.Infrastructure.csproj`);

  await csharp
    .find(PROGRAM)
    .addUsing(`Bank.Api.${context}`)
    .modify((doc) => {
      const registered = insertAfterLast(doc.text, /^builder\.Services\.Add\w+\(\);$/, `builder.Services.Add${context}();`, PROGRAM);
      doc.text = insertAfterLast(registered, /^api\.Map\w+Endpoints\(\);$/, `api.Map${context}Endpoints();`, PROGRAM);
    });
};
