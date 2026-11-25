# transfers — domain model

Bounded context of the [Bank](../README.md). A holder sends money from one account to another, and the bank keeps a record of every transfer made, which can be read back by its id. Transfers never changes a balance itself and never decides whether money may move: it asks the [Accounts](../accounts/domain-model.md) context's `MoveMoney` use case through its own `AccountsGateway` port, and answers Accounts' refusals in its own words.

Out of scope: scheduled transfers, transfers to other banks, reversing a transfer, fees, and retrying a transfer safely (there is no idempotency key, so a repeated request makes a second transfer).

## Glossary

| Term | Meaning |
| --- | --- |
| Transfer | one sending of money from a source account to a destination account, as the bank records it |
| Source account | the account the money leaves |
| Destination account | the account the money arrives in |

## Aggregates

| Aggregate | Root entity | Invariants it protects | Changed by |
| --- | --- | --- | --- |
| `Transfer` | `Transfer` | it exists only for money that moved (rule 3), by `Transfer.Made` | `TransferMoney` creates it; `GetTransfer` reads it |

## Value objects

| Value object | Attributes | Validation | Used by |
| --- | --- | --- | --- |
| `TransferId` | a uuid minted when the transfer is made | type-level only | `TransferMoney`, `GetTransfer` |
| `Amount` | the NZD amount sent | more than zero, at most two decimal places (rule 1) | `TransferMoney`, `GetTransfer` |

Account ids are Accounts' identities, held as plain uuids: Transfers never builds an Accounts value object.

## Business rules

| # | Rule | Source |
| --- | --- | --- |
| 1 | A transfer amount is more than zero and has at most two decimal places | decided |
| 2 | Whether the money may move is Accounts' decision, and Transfers answers each refusal with its own error | decided — Accounts rules 6, 8 and 9 own it |
| 3 | A transfer is recorded with its source, destination and amount only after the money moved | decided |
| 4 | Reading a transfer id that was never recorded answers that the transfer was not found | decided |

## Errors

| Key | Code | HTTP | Raised by |
| --- | --- | --- | --- |
| `SameAccount` | `transfers.same_account` | 422 | `TransferMoney` (rule 2) |
| `AccountNotFound` | `transfers.account_not_found` | 404 | `TransferMoney` (rule 2) |
| `InsufficientFunds` | `transfers.insufficient_funds` | 422 | `TransferMoney` (rule 2) |
| `TransferNotFound` | `transfers.transfer_not_found` | 404 | `GetTransfer` (rule 4) |

Rule 1 is enforced by `Amount`; the HTTP edge also checks it, only to answer 400 early.

Consistency stance: Accounts moves the money in one step, both balances or neither (Accounts rule 7). Then Transfers records the transfer. Accepted risk: if the record fails after the money moved, the money stays moved with no record and the client gets an error. In memory the record cannot fail; a database adapter must alert on that failure.

## Use cases

| Use case | Command | Result | Driven ports | Feature |
| --- | --- | --- | --- | --- |
| `TransferMoney` | `{ fromAccountId: Guid, toAccountId: Guid, amount: decimal }` | `{ transferId: Guid }` | `AccountsGateway`, `TransferLog` | [transfer-money.feature](transfer-money.feature) |
| `GetTransfer` | `{ transferId: Guid }` | `{ transferId: Guid, fromAccountId: Guid, toAccountId: Guid, amount: decimal }` | `TransferLog` | [get-transfer.feature](get-transfer.feature) |

## Driven ports

| Port | Answers | Adapter today | Contract |
| --- | --- | --- | --- |
| `AccountsGateway` | `Move(fromAccountId, toAccountId, amount) → void` | `AccountsContextGateway` | calls Accounts' `MoveMoney`; answers `accounts.same_account` as `SameAccount`, `accounts.account_not_found` as `AccountNotFound` and `accounts.insufficient_funds` as `InsufficientFunds`; any other Accounts failure is passed on unchanged and nothing is recorded |
| `TransferLog` | `Record(transfer) → void` · `ById(id) → Transfer?` | `InMemoryTransferLog` | `Record` adds the transfer and never replaces one · `ById` answers null for an id never recorded |

## Driving adapters

| Route | Use case | Answers | Caller |
| --- | --- | --- | --- |
| `POST /api/transfers` | `TransferMoney` | 201 the transfer · 400 `validation.failed` · 404 `transfers.account_not_found` · 422 `transfers.same_account` · 422 `transfers.insufficient_funds` | the banking app |
| `GET /api/transfers/{transferId}` | `GetTransfer` | 200 the transfer · 400 `validation.failed` · 404 `transfers.transfer_not_found` | the banking app |

## Persistence

In memory, lost when the API stops.
