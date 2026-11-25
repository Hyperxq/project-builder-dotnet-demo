# bank-hex-demo

Objective: hexagonal ASP.NET banking backend plus pbuilder schematics that automate endpoint creation, docs-first and driven by Gherkin, ready to demo on 2026-11-26.
Branch: main (fresh repo). Delivery: local only, ask-on-risk. Test runner: `dotnet test` (Reqnroll for Gherkin, xUnit), `bun test` for schematics.

## Specs

- S1 — Stack: C# / ASP.NET, `net10.0`, `.slnx` solution, one project per layer per bounded context (`<Ctx>.Domain`, `<Ctx>.Application`, `<Ctx>.Infrastructure`) plus `Bank.Api`.
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
| T1 | E0 | S1 | inline | pending | |
| T2 | E1 | S3, S4, S5 | inline | pending | |
| T3 | E2 | S1, S3 | inline | pending | |
| T4 | E3 | S2, S5 | inline | pending | |
| T5 | E4 | S2, S3 | inline | pending | |
| T6 | E5 | S3 | inline | pending | |

## Log

- L1 (2026-11-25): "Quiero crear un demo para mannana. Quiero que creemos un backend que implemente arquitectura hexagonal, y quiero crear schematics que puedan automatizar el proceso la creacion de los endpoints. Me gustaria hacer algo parecido a lo que tenemos en webapp con propylaea"
- L2: stack chosen: "C# / ASP.NET".
- L3: "me parece el 1. Ahora bien, me gustaria hacer un plan por etapas para hacer toda la idea junto con crear primero la documentacion y luego la implementacion usando gherkin"
- L4: "hagamolo para una app de bancos"
