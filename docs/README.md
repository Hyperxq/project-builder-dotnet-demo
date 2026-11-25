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

## How a change flows

1. Write or change the rule in the context's `domain-model.md`.
2. Write the scenario in the use case's `.feature`. It fails (RED).
3. Generate the code the tables describe with the schematics, then write the domain rule by hand until the scenario passes (GREEN).

## What each schematic reads

| Schematic | Reads | Generates |
| --- | --- | --- |
| `hex-context` | the context name | the three projects, their references, the solution entries and the registration in `Bank.Api` |
| `hex-driven-port` | a row of **Driven ports** | the port interface, an in-memory adapter and its registration |
| `hex-use-case` | a row of **Use cases** | the command, the result and the handler with its driven ports injected, and its registration |
| `hex-endpoint` | a row of **Driving adapters** | the endpoint with its request validation and OpenAPI metadata, its mapping and an `.http` request |

The tables keep a fixed set of columns because the schematics parse them. Add rows freely, but do not rename a column.

## Conventions

- Money is NZD only, a decimal with at most two decimal places.
- Errors answer [problem details](https://www.rfc-editor.org/rfc/rfc9457) with a `code` such as `accounts.account_not_found`.
- A feature tagged `@draft` is documented but not implemented yet.
