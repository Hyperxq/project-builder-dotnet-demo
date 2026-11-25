# accounts — domain model

Bounded context of the [Bank](../README.md). A person opens an account in their name, puts money into it, takes money out of it and reads its balance. The Transfers context moves money between accounts through this context's use cases, never through its data.

Out of scope: overdrafts, interest, fees, closing an account, several currencies and authentication. Every caller is trusted in this demo.

## Glossary

| Term | Meaning |
| --- | --- |
| Account | a place that holds one holder's money, identified by its account id |
| Holder | the person whose name the account is opened in |
| Balance | the money an account holds now |
| Deposit | money put into an account |
| Withdrawal | money taken out of an account |

## Aggregates

| Aggregate | Root entity | Invariants it protects | Changed by |
| --- | --- | --- | --- |
| `Account` | `Account` | the balance is never negative (rule 5) · a deposit is never more than 10,000.00 (rule 4) | `OpenAccount` creates it; `DepositMoney` and `WithdrawMoney` change its balance; `GetBalance` reads it |

## Value objects

| Value object | Attributes | Validation | Used by |
| --- | --- | --- | --- |
| `AccountId` | a uuid minted when the account opens | a uuid, else 400 `validation.failed` | every use case |
| `HolderName` | the holder's name, trimmed | 1 to 100 characters after trimming (rule 1) | `OpenAccount` |
| `Money` | an NZD amount | at most two decimal places; an amount moved is more than zero (rule 3) | `DepositMoney`, `WithdrawMoney`, `GetBalance` |

## Business rules

| # | Rule | Source |
| --- | --- | --- |
| 1 | An account opens only with a holder name of 1 to 100 characters after trimming | decided |
| 2 | A new account starts with a balance of 0.00 | decided |
| 3 | An amount deposited or withdrawn is more than zero and has at most two decimal places | decided |
| 4 | A single deposit is at most 10,000.00 | decided — larger deposits need checks the demo does not model |
| 5 | A withdrawal never leaves the balance below zero; if it would, nothing is withdrawn | decided — no overdrafts |
| 6 | Any operation on an account id that does not exist answers that the account was not found | decided |

## Errors

| Key | Code | HTTP | Raised by |
| --- | --- | --- | --- |
| `AccountNotFound` | `accounts.account_not_found` | 404 | `DepositMoney`, `WithdrawMoney`, `GetBalance` (rule 6) |
| `DepositLimitExceeded` | `accounts.deposit_limit_exceeded` | 422 | `DepositMoney` (rule 4) |
| `InsufficientFunds` | `accounts.insufficient_funds` | 422 | `WithdrawMoney` (rule 5) |

Rules 1 and 3 are checked at the edge: the request is refused with 400 `validation.failed` before any use case runs.

## Use cases

| Use case | Command | Result | Driven ports | Feature |
| --- | --- | --- | --- | --- |
| `OpenAccount` | `{ holderName: HolderName }` | `{ accountId: AccountId, holderName: HolderName, balance: Money }` | `Accounts` | [open-account.feature](open-account.feature) |
| `DepositMoney` | `{ accountId: AccountId, amount: Money }` | `{ accountId: AccountId, balance: Money }` | `Accounts` | [deposit-money.feature](deposit-money.feature) |
| `WithdrawMoney` | `{ accountId: AccountId, amount: Money }` | `{ accountId: AccountId, balance: Money }` | `Accounts` | [withdraw-money.feature](withdraw-money.feature) |
| `GetBalance` | `{ accountId: AccountId }` | `{ accountId: AccountId, holderName: HolderName, balance: Money }` | `Accounts` | [get-balance.feature](get-balance.feature) |

## Driven ports

| Port | Answers | Adapter today | Contract |
| --- | --- | --- | --- |
| `Accounts` | `ById(id) → Account?` · `Save(account) → void` | `InMemoryAccounts` | stores each account by its id; `Save` adds or replaces it |

## Driving adapters

| Route | Use case | Answers | Caller |
| --- | --- | --- | --- |
| `POST /api/accounts` | `OpenAccount` | 201 the account · 400 `validation.failed` | the banking app |
| `POST /api/accounts/{accountId}/deposits` | `DepositMoney` | 200 the new balance · 400 `validation.failed` · 404 `accounts.account_not_found` · 422 `accounts.deposit_limit_exceeded` | the banking app |
| `POST /api/accounts/{accountId}/withdrawals` | `WithdrawMoney` | 200 the new balance · 400 `validation.failed` · 404 `accounts.account_not_found` · 422 `accounts.insufficient_funds` | the banking app |
| `GET /api/accounts/{accountId}/balance` | `GetBalance` | 200 the balance · 404 `accounts.account_not_found` | the banking app |

## Persistence

In memory, lost when the API stops. A database adapter replaces `InMemoryAccounts` behind the same port without touching the use cases.
