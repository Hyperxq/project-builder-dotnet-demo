# accounts — domain model

Bounded context of the [Bank](../README.md). A person opens an account in their name, puts money into it, takes money out of it and reads its balance. Accounts also moves money from one account to another, for the [Transfers](../transfers/domain-model.md) context, which reaches it only through the `MoveMoney` use case.

Out of scope: overdrafts, interest, fees, closing an account, several currencies and authentication. Every caller is trusted in this demo.

## Glossary

| Term | Meaning |
| --- | --- |
| Account | a place that holds one holder's money, identified by its account id |
| Holder | the person whose name the account is opened in |
| Balance | the money an account holds now |
| Deposit | money put into an account from outside the bank |
| Withdrawal | money taken out of an account to outside the bank |
| Move | money taken from one account and put into another, inside the bank; a move is neither a deposit nor a withdrawal |

## Aggregates

| Aggregate | Root entity | Invariants it protects | Changed by |
| --- | --- | --- | --- |
| `Account` | `Account` | the holder name is valid (rule 1) · the balance changes only by the amount of a deposit, withdrawal or move (rule 4) · a deposit is at most 10,000.00 (rule 5) · the balance is never negative (rule 6), by `Account.Deposit`, `Account.Withdraw` and `Account.MoveTo` | `OpenAccount` creates it; `DepositMoney`, `WithdrawMoney` and `MoveMoney` change its balance; `GetBalance` reads it |

## Value objects

| Value object | Attributes | Validation | Used by |
| --- | --- | --- | --- |
| `AccountId` | a uuid minted when the account opens | type-level only | every use case |
| `HolderName` | the holder's name, trimmed | 1 to 100 characters after trimming (rule 1) | `OpenAccount`, `GetBalance` |
| `Amount` | an NZD amount being deposited, withdrawn or moved | more than zero, at most two decimal places (rule 3) | `DepositMoney`, `WithdrawMoney`, `MoveMoney` |
| `Balance` | the NZD amount an account holds | zero or more (rule 6) | every use case |

The value objects enforce rules 1, 3 and 6, whoever calls the use case. The HTTP edge also checks rules 1 and 3, only to answer 400 early.

## Business rules

| # | Rule | Source |
| --- | --- | --- |
| 1 | An account opens only with a holder name of 1 to 100 characters after trimming | decided |
| 2 | A new account starts with a balance of 0.00 | decided |
| 3 | An amount deposited, withdrawn or moved is more than zero and has at most two decimal places | decided |
| 4 | A deposit raises the balance by its amount, a withdrawal lowers it by its amount, and a move lowers the source and raises the destination by its amount | decided |
| 5 | A single deposit is at most 10,000.00; a move is not a deposit and has no such limit | decided — larger deposits from outside need checks the demo does not model |
| 6 | No operation leaves a balance below zero; if it would, nothing changes | decided — no overdrafts |
| 7 | A move changes both accounts together, or neither | decided — money is never lost or created inside the bank |
| 8 | A move needs two different accounts | decided |
| 9 | An operation on an account id that does not exist answers that the account was not found, and nothing changes | decided |

## Errors

| Key | Code | HTTP | Raised by |
| --- | --- | --- | --- |
| `AccountNotFound` | `accounts.account_not_found` | 404 | `DepositMoney`, `WithdrawMoney`, `MoveMoney`, `GetBalance` (rule 9) |
| `DepositLimitExceeded` | `accounts.deposit_limit_exceeded` | 422 | `DepositMoney` (rule 5) |
| `InsufficientFunds` | `accounts.insufficient_funds` | 422 | `WithdrawMoney`, `MoveMoney` (rule 6) |
| `SameAccount` | `accounts.same_account` | 422 | `MoveMoney` (rule 8) |

`MoveMoney` checks in this order and stops at the first refusal: different accounts (rule 8), both exist (rule 9), enough balance (rule 6).

## Use cases

| Use case | Command | Result | Driven ports | Feature |
| --- | --- | --- | --- | --- |
| `OpenAccount` | `{ holderName: string }` | `{ accountId: Guid, holderName: string, balance: decimal }` | `Accounts` | [open-account.feature](open-account.feature) |
| `DepositMoney` | `{ accountId: Guid, amount: decimal }` | `{ accountId: Guid, balance: decimal }` | `Accounts` | [deposit-money.feature](deposit-money.feature) |
| `WithdrawMoney` | `{ accountId: Guid, amount: decimal }` | `{ accountId: Guid, balance: decimal }` | `Accounts` | [withdraw-money.feature](withdraw-money.feature) |
| `MoveMoney` | `{ fromAccountId: Guid, toAccountId: Guid, amount: decimal }` | `{ fromBalance: decimal, toBalance: decimal }` | `Accounts` | [move-money.feature](move-money.feature) |
| `GetBalance` | `{ accountId: Guid }` | `{ accountId: Guid, holderName: string, balance: decimal }` | `Accounts` | [get-balance.feature](get-balance.feature) |

## Driven ports

| Port | Answers | Adapter today | Contract |
| --- | --- | --- | --- |
| `Accounts` | `ById(id) → Account?` · `Save(accounts) → void` | `InMemoryAccounts` | `ById` answers null for an unknown id · `Save` stores every account given, adding or replacing each by id, all of them or none |

## Driving adapters

| Route | Use case | Answers | Caller |
| --- | --- | --- | --- |
| `POST /api/accounts` | `OpenAccount` | 201 the account · 400 `validation.failed` | the banking app |
| `POST /api/accounts/{accountId}/deposits` | `DepositMoney` | 200 the new balance · 400 `validation.failed` · 404 `accounts.account_not_found` · 422 `accounts.deposit_limit_exceeded` | the banking app |
| `POST /api/accounts/{accountId}/withdrawals` | `WithdrawMoney` | 200 the new balance · 400 `validation.failed` · 404 `accounts.account_not_found` · 422 `accounts.insufficient_funds` | the banking app |
| `GET /api/accounts/{accountId}/balance` | `GetBalance` | 200 the balance · 400 `validation.failed` · 404 `accounts.account_not_found` | the banking app |

`MoveMoney` has no route: its only caller is the Transfers context, through its `AccountsGateway` adapter.

## Persistence

In memory, lost when the API stops. The holder name is personal data. A database adapter replaces `InMemoryAccounts` behind the same port without touching the use cases.

Accepted risks:

- Two operations on the same account at the same time can both read the same balance, so together they can break rule 6. A database adapter removes it with an optimistic version check on `Save`.
- Anyone who knows an account id can operate on it, since there is no authentication in this demo.
