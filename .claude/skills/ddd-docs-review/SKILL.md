---
name: ddd-docs-review
description: Review a bounded context's docs (docs/<context>/domain-model.md and its .feature files, plus docs/README.md) before or alongside code — strategic boundaries and context map first, then the product-owner and peer passes. Load when asked to review, audit or check docs under docs/. Not for reviewing C# code.
---
# ddd-docs-review — do the docs say what the business wants, and may the code do what they say

The docs are the source the code and the schematics are built from (`docs/README.md`). This review decides their substance. You find; you do not fix.

## Mechanical first

Report as facts:
- `dotnet test`: the acceptance suite runs the features that are wired into `tests/Bank.Acceptance`. A feature that does not parse fails the build.
- The tables the schematics read (**Use cases**, **Driven ports**, **Driving adapters**) keep exactly the columns `docs/README.md` and the existing domain models use. A renamed, added or missing column is **blocking**: the generators parse them.

A command that cannot run → say "not run" and why; never install silently.

## What to read

1. The `.feature` files: behaviour in business language.
2. The Business rules table of each `domain-model.md`, through its `Source` column.
3. The Errors, Use cases, Driven ports and Driving adapters tables, against the rules and the features.

Needing more than this means the docs have a hole: request changes.

## Strategic pass — first

A wrong boundary invalidates everything after it.

1. **Boundary earned.** The context has its own model, language and invariants. A context that only forwards to another is not a context.
2. **Context map.** One named pattern per relation: open host service + published language, conformist, anti-corruption layer, customer–supplier, shared kernel, shared database, none. The pattern matches what the docs describe: translating another context's errors is an ACL; re-implementing its rule or reading its data is a duplicated rule or a shared database. A context reaches another only through a driven port of its own whose adapter calls the other's use cases (`docs/README.md`).
3. **Ownership.** A rule another context owns (a balance limit, an overdraft policy) is consumed through its use cases, not re-derived. When both contexts state the rule, one says it is the other's.
4. **No speculative structure.** No vocabulary, value objects or tables for flows that do not exist yet.
5. **Language across contexts.** One term, one meaning in every context. A domain term does not collide with a transport term (a domain "status" vs the HTTP status).
6. **Conventions.** `docs/README.md` conventions (money, error codes, `@draft`) are followed, or changed there in the same change.

Fill the context-map table of the report.

## Pass 1 — is this what we want? (product owner)

Read every feature as prose; one that names a repository, a port, an adapter, an endpoint or a log fails. Check each rule's `Source`:
- `decided`: confirm it is the business's decision, and that a reason is given when it is not obvious.
- `assumed`: ask whether anybody decided it; until then its feature stays `@draft`.

A rule of more than one sentence is a **should fix**: the detail moves to the description of its `Rule:` in the feature.

Every rule has at least one scenario, tagged `@rule-N`, that exercises its boundary (exactly the limit, just over it, zero, unknown id). Scenario Outline examples are distinct cases after Gherkin trims the cells.

## Pass 2 — may the code do this? (peer)

1. **Model.** Each aggregate protects the invariant the doc names, by a named factory or method, not by the endpoint or a use case. References to other contexts are ids, not embedded entities. A repository contract states its add/replace and not-found behaviour.
2. **Consistency.** Every error of the Errors table is raised by a use case that lists it, answered by a route in Driving adapters with the same HTTP status, and reached by a scenario. Every use case has a feature, its driven ports exist in Driven ports, and its route exists in Driving adapters.
3. **Exposure.**
   - `Caller`: who calls the route and what identity it proves. No body field carries an identity the caller could forge.
   - `Contract`: an invariant a test can run against a fake and the real adapter, not a description.
   - The consistency stance says what happens when each step after the first fails.
   - Step sentences: each `Then` asserts what it says; a `Then` that only checks "no error" is a scenario that does not exist.
4. **Debt honesty.** Accepted risks and shortcuts are written down, with what would remove them.

One person may hold both roles; keep the passes separate.

Padded or AI-sounding prose in the README or a `domain-model.md` is a **should fix** (`humanizer` skill).

## Red flags — end the review early

A feature sentence that names infrastructure · a rule with no `Source` · a `Contract` written as a description · a schematic-read table with a changed column · an error code with no route answering it · `Then` sentences that assert nothing.

## Report

Group by Mechanical / Strategic / Pass 1 / Pass 2. Severity: **blocking**, **should fix**, **note**, each with file:line evidence. Include the context-map table `Relation | Pattern the docs claim | Pattern expected | OK?`. End with the one-line verdict: ready / not ready, and why.
