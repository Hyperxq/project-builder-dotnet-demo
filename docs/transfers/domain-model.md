# transfers — domain model

Bounded context of the [Bank](../README.md). A holder moves money from one account to another. Transfers keeps a record of every transfer it made. It never touches balances itself: it asks the [Accounts](../accounts/domain-model.md) context, through its own `AccountsGateway` port, to withdraw and deposit.

Out of scope: scheduled transfers, transfers to other banks, reversing a transfer and fees.

## Glossary

| Term | Meaning |
| --- | --- |
| Transfer | money moved from a source account to a destination account, once |
| Source account | the account the money leaves |
| Destination account | the account the money arrives in |

## Aggregates

| Aggregate | Root entity | Invariants it protects | Changed by |
| --- | --- | --- | --- |
| `Transfer` | `Transfer` | source and destination differ (rule 2) · it is recorded only once the money moved (rule 5) | `TransferMoney` creates it |

## Value objects

| Value object | Attributes | Validation | Used by |
| --- | --- | --- | --- |
| `TransferId` | a uuid minted when the transfer is made | type-level only | `TransferMoney` |
| `Money` | an NZD amount | more than zero, at most two decimal places (rule 1) | `TransferMoney` |

## Business rules

| # | Rule | Source |
| --- | --- | --- |
| 1 | A transfer amount is more than zero and has at most two decimal places | decided |
| 2 | The source and destination accounts are different | decided |
| 3 | Both accounts exist; if either does not, nothing moves | decided |
| 4 | The source account holds at least the amount; if it does not, nothing moves | decided — Accounts rule 5, no overdrafts |
| 5 | A transfer is recorded with its source, destination, amount and time only after the money moved | decided |

## Errors

| Key | Code | HTTP | Raised by |
| --- | --- | --- | --- |
| `SameAccount` | `transfers.same_account` | 422 | `TransferMoney` (rule 2) |
| `AccountNotFound` | `transfers.account_not_found` | 404 | `TransferMoney` (rule 3) |
| `InsufficientFunds` | `transfers.insufficient_funds` | 422 | `TransferMoney` (rule 4) |

Rule 1 is checked at the edge: the request is refused with 400 `validation.failed` before the use case runs.

Consistency stance: the gateway checks that both accounts exist, then withdraws from the source, then deposits into the destination. With both accounts known and the withdrawal done, the deposit can only fail on the deposit limit, which the gateway does not apply to transfers. Accepted risk: in memory there is no transaction, so a crash between the two steps loses the money. A database adapter must do both in one transaction.

## Use cases

| Use case | Command | Result | Driven ports | Feature |
| --- | --- | --- | --- | --- |
| `TransferMoney` | `{ fromAccountId: AccountId, toAccountId: AccountId, amount: Money }` | `{ transferId: TransferId, fromBalance: Money }` | `AccountsGateway`, `TransferLog` | [transfer-money.feature](transfer-money.feature) |

## Driven ports

| Port | Answers | Adapter today | Contract |
| --- | --- | --- | --- |
| `AccountsGateway` | `Exists(id) → bool` · `Move(fromId, toId, amount) → Money` (the source's new balance) | `AccountsContextGateway` | calls the Accounts use cases; `Move` raises `InsufficientFunds` when the source holds less than the amount |
| `TransferLog` | `Record(transfer) → void` | `InMemoryTransferLog` | keeps every transfer made, in order |

## Driving adapters

| Route | Use case | Answers | Caller |
| --- | --- | --- | --- |
| `POST /api/transfers` | `TransferMoney` | 201 the transfer · 400 `validation.failed` · 404 `transfers.account_not_found` · 422 `transfers.same_account` · 422 `transfers.insufficient_funds` | the banking app |

## Persistence

In memory, lost when the API stops.
