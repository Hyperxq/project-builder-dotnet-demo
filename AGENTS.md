<!-- pbuilder:skill:begin -->
## Project Builder

This project generates code with [Project Builder](https://github.com/Project-Builder-Schematics/project-builder-cli):
`project-builder.json` registers collections, and each collection registers
schematics — repeatable code generators for this codebase's patterns.

Start at the router — `.claude/skills/pbuilder/SKILL.md` — before running or
writing anything: it routes to the three guides covering how to run a
schematic, how to choose one, and when to create one, and it carries hazards
(no dry-run; run `execute` standalone) that apply before any command below.

Once routed, prefer an existing schematic over hand-writing code
(`builder execute <collection>:<schematic> --<input>=<value>`); if none fits
and the code follows a repeatable pattern, create one
(`builder new schematic <name>`) instead of writing the pattern again.

These four files are written by `builder init` and refreshed by
`builder init --force`; they are not a place for hand edits.
<!-- pbuilder:skill:end -->

# Bank hex demo

A .NET hexagonal (ports and adapters) bank, documented first: each bounded context's `docs/<context>/domain-model.md` and its Gherkin features are the source, and Project Builder schematics generate the code those tables describe. Read [docs/README.md](docs/README.md) for the architecture, the context map and the change flow.

## Prerequisites

| Tool | Needed for | Install | Check |
| --- | --- | --- | --- |
| .NET 11 SDK | build, run, acceptance tests (`net11.0`) | https://dotnet.microsoft.com/download | `dotnet --list-sdks` lists `11.x` |
| `builder` CLI v0.13.8 | running schematics | `brew install project-builder-schematics/tap/pbuilder` (macOS/Linux) | `builder --version` |
| Bun | installing the SDK, schematic tests | https://bun.sh | `bun --version` |
| `@pbuilder/sdk` 0.17.0, global | the engine every schematic imports | `bun add -g @pbuilder/sdk@0.17.0` | see below |
| Node.js >= 25.9 | type codegen (`schema.generated.ts`), `builder new schematic` | https://nodejs.org | `node --version` |

Windows: the CLI ships Windows builds since v0.13.0, but `builder execute` is not verified there. Use WSL2.

The repo has no `package.json` and no `node_modules`: the SDK is never installed in the checkout. Do not run `npm install @pbuilder/sdk` here; a local copy that differs from the global one makes `execute` fail with `execute_sdk_link_path_conflict`.

## One-time setup after cloning

1. Point `builder` at the global SDK. With Bun's default install location:

   ```sh
   export BUILDER_SDK_ROOT="${BUN_INSTALL:-$HOME/.bun}/install/global/node_modules/@pbuilder/sdk"
   jq -r .version "$BUILDER_SDK_ROOT/package.json"   # 0.17.0
   ```

   Put the export in your shell profile. If `jq` prints nothing, the SDK lives elsewhere: find the directory `bun add -g` used and substitute it.

2. Create `tsconfig.json` at the repo root, needed only by `bun test`. It is gitignored because it holds absolute paths. Replace `<SDK>` with the absolute value of `$BUILDER_SDK_ROOT`:

   ```json
   {
     "compilerOptions": {
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "noEmit": true,
       "paths": {
         "@pbuilder/sdk/csharp": ["<SDK>/dist/dialects/csharp/index.js"],
         "@pbuilder/sdk/aspnet": ["<SDK>/dist/dialects/aspnet/index.js"],
         "@pbuilder/sdk/msbuild": ["<SDK>/dist/dialects/msbuild/index.js"],
         "@pbuilder/sdk/*": ["<SDK>/dist/*/index.js"]
       }
     }
   }
   ```

   `builder execute` does not read it.

3. Do not run `builder init`: the manifest (`project-builder.json`) and the skill files under `.claude/skills/pbuilder/` are already committed.

## Build, run, test the backend

| Command | Does |
| --- | --- |
| `dotnet build Bank.slnx` | builds every project |
| `dotnet run --project src/Bank.Api` | starts the API on `http://localhost:5069` (see `src/Bank.Api/Properties/launchSettings.json`); each context has a `.http` file of requests under `src/Bank.Api/<Context>/` |
| `dotnet test` | the acceptance suite (`tests/Bank.Acceptance`, Reqnroll on NUnit, running `docs/**/*.feature`), except `@draft` scenarios |
| `dotnet test --filter Category=draft` | only the pending `@draft` scenarios |

## Schematics

All four live in this repo, in the `default` collection (`project-builder.json`), with shared helpers in `schematics/_hex/`. Each `schematics/<name>/schema.json` lists its inputs, all required:

| Schematic | Inputs | Generates from |
| --- | --- | --- |
| `default:hex-context` | `--context` | the context name |
| `default:hex-driven-port` | `--context --port` | a row of **Driven ports** |
| `default:hex-use-case` | `--context --name` | a row of **Use cases** |
| `default:hex-endpoint` | `--context --use_case` | a row of **Driving adapters** |

They parse the tables in `docs/<context>/domain-model.md`, so write the docs first and never rename a table column.

### Running one

From the repo root, one `builder execute` per shell call: never chain it with `&&`, `;` or a loop (the engine can die and the exit code gets lost).

```sh
BUILDER_MANIFEST=$PWD builder execute default:hex-use-case --context=Transfers --name=TransferMoney
```

- `BUILDER_MANIFEST=$PWD` matters only if you have a global `BUILDER_MANIFEST` pointing at another manifest; `execute` would read that one instead. `--manifest .` works too, placed before `default:<schematic>`.
- Add `--dry-run` (also before the positional) to print the plan and write nothing.
- The first real run creates the symlink `node_modules/@pbuilder/sdk` (gitignored) and prints `warn_sdk_root_ambient`. Both are expected.

Order for a new context `X` documented in `docs/x/domain-model.md`:

1. `hex-context --context=X`
2. `hex-driven-port --context=X --port=<Port>` for each Driven ports row
3. `hex-use-case --context=X --name=<UseCase>` for each Use cases row
4. `hex-endpoint --context=X --use_case=<UseCase>` for each Driving adapters row

Generated handlers and adapters throw `NotImplementedException`: write the domain rules and the adapter bodies by hand, until the feature's scenarios pass.

### Changing or adding schematics

| Task | Command (repo root) |
| --- | --- |
| Run the schematic tests | `bun test schematics` (needs the `tsconfig.json` above) |
| Regenerate types after editing a `schema.json` | `node "$BUILDER_SDK_ROOT/dist/bin/pbuilder-codegen.js" --project .` |
| Scaffold a new schematic in `default` | `BUILDER_MANIFEST=$PWD builder new schematic <name>` |

Known SDK 0.17.0 gaps, already worked around: the `msbuild` dialect's `addProjectReference` rejects `.slnx`, so `hex-context` edits `Bank.slnx` with `.modify()`; the `aspnet` dialect's `addService` only writes `Add<Lifetime><Service, Impl>()`, which is why every use case has a driving-port interface `I<UseCase>`.
