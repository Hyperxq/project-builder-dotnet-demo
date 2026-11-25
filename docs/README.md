# Bank — documentation

The documentation is written before the code, and it is the source the code is built from. Each bounded context has a folder with its domain model and one Gherkin feature per use case. The features are the acceptance tests, and the schematics read the domain model's tables to generate the code.

| Context | What it owns | Domain model |
| --- | --- | --- |
| Accounts | bank accounts, their holder and their balance | [accounts/domain-model.md](accounts/domain-model.md) |
| Transfers | moving money from one account to another | [transfers/domain-model.md](transfers/domain-model.md) |

## Architecture

Hexagonal (ports and adapters), one .NET project per layer per context, so the compiler enforces the dependency rule:

```text
src/Bank.Api                      driving adapters: HTTP endpoints, composition root
src/<Context>.Application         use cases, driving ports, driven ports
src/<Context>.Domain              aggregates, value objects, business rules, errors
src/<Context>.Infrastructure      driven adapters, AddInfrastructure() registration
```

Dependencies point inwards: `Api → Application → Domain`, and `Infrastructure → Application`. The domain references nothing. A context reaches another context only through a driven port of its own, whose adapter calls the other context's use cases. It never reads the other context's domain.

Use case commands and results carry only primitives (`Guid`, `decimal`, `string`). They are the published language a context offers; value objects are built inside the use case, so another context never needs them.

## Context map

| Relation | Pattern | What crosses |
| --- | --- | --- |
| Transfers → Accounts | customer–supplier: Accounts publishes `MoveMoney` (open host service); Transfers keeps an anti-corruption layer, its `AccountsContextGateway`, which translates Accounts' errors into its own | `MoveMoney`'s command and result, and three error codes |

## How a change flows

1. Write or change the rule in the context's `domain-model.md`.
2. Write the scenario in the use case's `.feature`. It fails (RED).
3. Generate the code the tables describe with the schematics, then write the domain rule by hand until the scenario passes (GREEN).

## Running the features

The features in this folder are the acceptance suite: `tests/Bank.Acceptance` links every `docs/**/*.feature` into Reqnroll, so there is no copy to keep in step.

| Command | Runs |
| --- | --- |
| `dotnet test` | every scenario except those tagged `@draft` |
| `dotnet test --filter Category=draft` | only the `@draft` scenarios, to see what is still pending |
| `dotnet test --filter Category=rule-6` | the scenarios of one rule; tags on a `Rule:` reach its scenarios |

## What each schematic reads

| Schematic | Reads | Generates |
| --- | --- | --- |
| `hex-context` | the context name | the three projects, their references, the solution entries and the registration in `Bank.Api` |
| `hex-driven-port` | a row of **Driven ports** | the port interface, the adapter named in *Adapter today* and its registration; an `InMemory…` adapter is generated working, any other adapter is generated as a stub to write by hand |
| `hex-use-case` | a row of **Use cases** | the command, the result and the handler with its driven ports injected, and its registration |
| `hex-endpoint` | a row of **Driving adapters** | the endpoint with its request validation and OpenAPI metadata, its mapping and an `.http` request |

The tables keep a fixed set of columns because the schematics parse them. Add rows freely, but do not rename a column.

## Conventions

- Money is NZD only, a decimal with at most two decimal places.
- Errors answer [problem details](https://www.rfc-editor.org/rfc/rfc9457) with a `code` such as `accounts.account_not_found`.
- A request the HTTP edge refuses before any use case runs answers 400 with the code `validation.failed`, in every context. It is the only code no context owns.
- Each `Rule:` of a feature is tagged `@rule-N` with the numbers of the domain model's rules it covers.
- A feature tagged `@draft` is documented but not implemented yet.
