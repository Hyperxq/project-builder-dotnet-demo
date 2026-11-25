# bank-hex-demo

Objective: hexagonal ASP.NET banking backend plus pbuilder schematics that automate endpoint creation, docs-first and driven by Gherkin, ready to demo on 2026-11-26.
Branch: feat/bank-hex-demo (fresh repo). Delivery: local only, ask-on-risk. Test runner: `dotnet test` (Reqnroll on NUnit for Gherkin), `bun test` for schematics.

## Specs

- S1 — Stack: C# / ASP.NET, `net11.0` (only the .NET 11 runtime is installed), `.slnx` solution, one project per layer per bounded context (`<Ctx>.Domain`, `<Ctx>.Application`, `<Ctx>.Infrastructure`) plus `Bank.Api`.
- S2 — Schematics (inside this repo): `hex-context`, `hex-driven-port`, `hex-use-case`, `hex-endpoint`, using the `csharp`, `aspnet` and `msbuild` dialects. User: "me parece el 1".
- S3 — Staged plan: "me gustaria hacer un plan por etapas para hacer toda la idea junto con crear primero la documentacion y luego la implementacion usando gherkin".
- S4 — Domain: "hagamolo para una app de bancos".
- S5 — Reference: "algo parecido a lo que tenemos en webapp con propylaea" — docs (`domain-model.md` + `.feature`) are the source the schematics read, like the `hex-*` schematics in lcwebapp-schematics.

## Stages

- E0 Foundations: repo, solution skeleton, `Bank.Api`, Reqnroll acceptance test project, `project-builder.json`.
- E1 Documentation: per-context `docs/<context>/domain-model.md` (glossary, aggregate invariants, use cases, driven ports, driving adapters tables) and one `.feature` per use case.
- E2 Canon by hand: `accounts` context (OpenAccount, DepositMoney, GetBalance) implemented test-first from its features. It is the shape the templates are extracted from.
- E3 Schematics: the four schematics, each with `bun test`, reading the E1 doc tables.
- E4 Demo run: `transfers` context (TransferMoney) generated with the schematics; feature RED, domain logic by hand, GREEN.
- E5 Rehearsal: demo script and a clean-checkout dry run.

## Tasks

| ID | Stage | Specs | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | E0 | S1 | inline | done — health scenario GREEN | ec7066a, b890ad5 |
| T2 | E1 | S3, S4, S5 | inline | done — docs only, features tagged `@draft` | b0ed309 |
| T3 | E2 | S1, S3 | inline | done — 32/32 GREEN, accounts features no longer @draft | (this commit) |
| T4 | E3 | S2, S5 | inline | done — 29/29 bun tests, real engine end to end in a throwaway worktree | 439d654, 572f506 |
| T5 | E4 | S2, S3 | inline | done — 42/42 GREEN, transfers features no longer @draft | dfa8401 (generated), 45e6122 (by hand) |
| T6 | E5 | S3 | inline | pending | |

## Log

- L1 (2026-11-25): "Quiero crear un demo para mannana. Quiero que creemos un backend que implemente arquitectura hexagonal, y quiero crear schematics que puedan automatizar el proceso la creacion de los endpoints. Me gustaria hacer algo parecido a lo que tenemos en webapp con propylaea"
- L2: stack chosen: "C# / ASP.NET".
- L3: "me parece el 1. Ahora bien, me gustaria hacer un plan por etapas para hacer toda la idea junto con crear primero la documentacion y luego la implementacion usando gherkin"
- L4: "hagamolo para una app de bancos"
- L5: "Si me parece hacer E0 y E1 hoy". E0 + E1 done. Target moved to net11.0 (only runtime installed). Reqnroll.NUnit 3.3.4 chosen (Reqnroll docs: xUnit is less practical for integration tests).
- L6 next: E2 must wire docs/**/*.feature into Bank.Acceptance (one source of truth) — verify Reqnroll supports feature files outside the project dir. Global fish vars BUILDER_MANIFEST/BUILDER_SDK_ROOT point at lcwebapp-schematics: every `builder execute` here needs `--manifest .` (or the env overridden). Engram mirror pending: the repo is not a known engram project.
- L7 (2026-11-25): "adapta la skills en este proyecto" → .claude/skills/ddd-docs-review adapted (8369261). Independent ddd-docs-review: not ready (S1 deposit limit vs transfers). Daniel chose "Accounts mueve la plata": MoveMoney atomic in Accounts, no deposit limit on a move; Transfers = ACL translating errors + GetTransfer. Fixes cf006dc; recheck 16/17 resolved, last gaps (rule 3 refusal record, validation.failed for value objects) closed next commit. E2 note: verify Reqnroll honours tags on `Rule:`.
- L8 (2026-11-25): "Genial entonces vamos a conectar los features de los docs a Reqnroll". Done: `ReqnrollFeatureFile` (singular item; the plural is a legacy alias) links ../../docs/**/*.feature, code-behind in obj/ (`ReqnrollUseIntermediateOutputPathForCodeBehind`, required for linked files since 3.3), `VSTestTestCaseFilter` default `Category!=draft`. Verified: default run 1/1 green, 41 draft scenarios listed, Rule-level tags inherited (`Category=rule-8` → 4 move-money scenarios). Gotcha: fd hides obj/ (gitignore) — use `fd -I`.
- L9 (2026-11-25): "vamos" → E2. RED observed twice (22 HTTP scenarios 404; 9 move-money NotImplementedException), GREEN 32/32. Smoke on `dotnet run`: open 201 balance 0.00, non-uuid id → 400 `validation.failed`, OpenAPI lists the 4 routes. Canon shape for E3 templates: immutable `Account`; one file per use case (command + result + handler, ports by primary constructor); `I<Port>` in Application/Ports; `AddAccounts()` in Infrastructure (namespace Microsoft.Extensions.DependencyInjection) registers ports + use cases; one `<UseCase>Endpoint.cs` per route with `Map<UseCase>(RouteGroupBuilder)`, chained in `<Context>Endpoints.Map<Context>Endpoints()`; `<Context>.http`. Shared kernel `Bank.Kernel` = DomainError(Code, Kind) only — README context map must name it. Gotcha: `sd` 1.0 does not match across a newline — use Edit.
- L10 (2026-11-25): "vamos con E3". Four schematics, 29/29 `bun test`; hex-endpoint reproduces the hand-written DepositMoney/WithdrawMoney/GetBalance endpoints byte for byte (OpenAPI summary = the feature's `Feature:` title). Real engine verified in a throwaway worktree: hex-context → 2× hex-driven-port → 2× hex-use-case → 2× hex-endpoint all succeed; only compile errors are the hand-written domain (`Transfers.Domain` namespace, `Transfer`); with a stub `Transfer` the suite stays 32/32, OpenAPI lists both transfer routes, POST answers 500 from the NotImplemented Handle (the E4 RED).
- SDK 0.17.0 findings: (1) `msbuild.addProjectReference` rejects `.slnx` ("the root element is `Solution`; it needs `Project`") although rule A-117/118 (project-builder-architecture obs #8374) says `.slnx` is accepted → hex-context edits the .slnx with `.modify()`. (2) `aspnet.addService` only writes `Add<L><S, I>()` and does not recognise `AddScoped<T>()` as the same registration → canon moved to driving-port interfaces `I<UseCase>` (439d654). Not filed upstream yet: Daniel owns the SDK, asked him.
- `tsconfig.json` is only for `bun test` (maps @pbuilder/sdk/* to the global SDK; no node_modules here); `builder execute` does not read it. Gitignored (machine-specific path). Run executes with `BUILDER_MANIFEST=$PWD`, one per shell call.
- L11 (2026-11-25): "vamos con E4". Tag `demo-start` = ba8e20c (before Transfers exists). Seven real executes (hex-context, 2× hex-driven-port, 2× hex-use-case, 2× hex-endpoint) → dfa8401: 16 files, 201 lines generated. RED 10 transfer scenarios (500 from NotImplemented), GREEN 42/42 after 45e6122: 8 src files, 113 lines by hand (Transfer, Amount, Errors, two Handle bodies, InMemoryTransferLog, AccountsContextGateway ACL translating by published codes, Transfers.Infrastructure → Accounts.Application reference). Smoke on dotnet run: transfer recorded and readable, balances 70/30, overdraw → 422 transfers.insufficient_funds. hex-context tests decoupled from repo contexts (75e3299). AGENTS.md first-time setup written by a subagent (52be086); spot-checked SDK path and bun test; the builder-init marker block still says "no dry-run" (stale, refreshed by `builder init --force`). Remote origin = https://github.com/Hyperxq/project-builder-dotnet-demo.git (added, not pushed).
