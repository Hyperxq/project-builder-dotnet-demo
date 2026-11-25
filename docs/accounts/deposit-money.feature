@draft
Feature: Deposit money
  A holder puts money into their account and sees the new balance.

  Background:
    Given "Ana Smith" has an account with a balance of 100.00

  @rule-3
  Rule: a deposit adds its amount to the balance

    Scenario: a deposit raises the balance
      When 50.25 is deposited into Ana's account
      Then Ana's balance is 150.25

    Scenario Outline: an invalid amount is refused
      When <amount> is deposited into Ana's account
      Then the request is refused as invalid
      And Ana's balance is 100.00

      Examples:
        | amount |
        | 0      |
        | -10.00 |
        | 10.001 |

  @rule-4
  Rule: a single deposit is at most 10,000.00

    Scenario: the largest deposit is accepted
      When 10000.00 is deposited into Ana's account
      Then Ana's balance is 10100.00

    Scenario: a larger deposit is refused
      When 10000.01 is deposited into Ana's account
      Then the request is refused with "accounts.deposit_limit_exceeded"
      And Ana's balance is 100.00

  @rule-6
  Rule: the account must exist

    Scenario: a deposit into an unknown account
      When 50.00 is deposited into an account that does not exist
      Then the request is refused with "accounts.account_not_found"
