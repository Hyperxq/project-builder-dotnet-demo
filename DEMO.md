# Demo script — docs-first hexagonal .NET with Project Builder schematics

About 15 minutes. The story: in a hexagonal backend, one endpoint means touching six or seven files across four projects, in the right order, without breaking the dependency rule. The docs say what the business wants, the schematics generate the plumbing from the docs, and the developer writes only the business rules.

Rehearsed on 2026-11-25 from a clean checkout of `demo-start`: the generated code was byte-identical to commit `dfa8401`, and the suite went from 10 failing to 42 passing.

## Before the audience arrives

```sh
git switch -c live-demo demo-start   # Transfers does not exist yet
dotnet test                          # 32 passed: health + the accounts context
```

Prerequisites and one-time setup are in [AGENTS.md](AGENTS.md). Open in the editor: `docs/README.md`, `docs/transfers/domain-model.md`, `docs/transfers/transfer-money.feature`.

## 1. The docs come first (3 min)

- `docs/README.md`: the layers, the context map, and the table of what each schematic reads.
- `docs/transfers/domain-model.md`: the rules, the errors, and the three tables the schematics parse (Use cases, Driven ports, Driving adapters).
- `docs/transfers/transfer-money.feature`: the behaviour in business language, tagged `@draft`.
- The features are the acceptance suite; nothing is copied:

```sh
dotnet test --filter Category=draft --list-tests   # the 10 transfer scenarios, still pending
```

Say: the accounts context was written by hand once, and the templates were extracted from it. The `hex-endpoint` tests prove the generator reproduces those hand-written endpoints byte for byte.

## 2. Generate the context (4 min)

One command per shell call, never chained. `BUILDER_MANIFEST=$PWD` makes `builder` read this repo's manifest.

```sh
BUILDER_MANIFEST=$PWD builder execute default:hex-context --context=Transfers
```

Show the diff: three new projects, `Bank.slnx`, the references in `Bank.Api.csproj` (MSBuild dialect), and `Program.cs` (C# dialect `addUsing`).

```sh
BUILDER_MANIFEST=$PWD builder execute default:hex-driven-port --context=Transfers --port=AccountsGateway
BUILDER_MANIFEST=$PWD builder execute default:hex-driven-port --context=Transfers --port=TransferLog
```

Show `ITransferLog.cs`: its methods and summary come from the Driven ports row. Show the registration: `aspnet.addService` with `method: "AddTransfers"`.

```sh
BUILDER_MANIFEST=$PWD builder execute default:hex-use-case --context=Transfers --name=TransferMoney
BUILDER_MANIFEST=$PWD builder execute default:hex-use-case --context=Transfers --name=GetTransfer
```

Show `TransferMoney.cs`: command, result and driving port from the Use cases row; the driven ports arrive through the primary constructor; `Handle` is left to the developer.

```sh
BUILDER_MANIFEST=$PWD builder execute default:hex-endpoint --context=Transfers --use_case=TransferMoney
BUILDER_MANIFEST=$PWD builder execute default:hex-endpoint --context=Transfers --use_case=GetTransfer
```

Show `TransferMoneyEndpoint.cs`: route, 201, problem responses and the OpenAPI summary (the feature's title) all come from the docs. Show `Transfers.http`.

Optional, to show the guard rails: `BUILDER_MANIFEST=$PWD builder execute default:hex-endpoint --context=Transfers --use_case=ReverseTransfer` refuses, because the docs have no such route; the reason is in the error's `runner_note`: `Driving adapters has no route for ReverseTransfer in domain-model.md — document the route first`.

## 3. RED (3 min)

Remove `@draft` from both transfer features, add the steps and write the domain. Live typing is optional; the fallback takes the final versions:

```sh
git checkout 45e6122 -- tests/Bank.Acceptance/Steps/TransfersSteps.cs docs/transfers src/Transfers.Domain
dotnet test   # 10 failed, 32 passed: the generated Handle bodies throw NotImplementedException
```

## 4. GREEN: only the rules are written by hand (4 min)

Write the two `Handle` bodies, `InMemoryTransferLog` and `AccountsContextGateway`, the anti-corruption layer that calls Accounts' `MoveMoney` and translates its error codes. Fallback:

```sh
git checkout 45e6122 -- src/Transfers.Application src/Transfers.Infrastructure
dotnet test   # 42 passed
```

The numbers: 201 lines in 16 files were generated (`dfa8401`); 113 lines in 8 files were written by hand (`45e6122`).

## 5. It runs (1 min)

```sh
dotnet run --project src/Bank.Api
```

Send the requests in `src/Bank.Api/Accounts/Accounts.http` and `src/Bank.Api/Transfers/Transfers.http` (replace the zero ids with the ones the responses return), and open `http://localhost:5069/openapi/v1.json`.

## If something goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| `execute` reads another manifest | a global `BUILDER_MANIFEST` | prefix the command with `BUILDER_MANIFEST=$PWD` |
| the engine dies with a system fault | commands chained with `&&` or a loop | run each `execute` alone |
| `warn_sdk_root_ambient` | the SDK comes from `BUILDER_SDK_ROOT` | expected, not an error |
| anything else | — | `git switch -C live-demo dfa8401`, or `45e6122` for the finished context |

## Reset

```sh
git switch feat/bank-hex-demo && git branch -D live-demo
```
