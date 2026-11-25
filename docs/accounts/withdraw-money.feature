Feature: Withdraw money
  A holder takes money out of their account. The bank has no overdrafts, so a withdrawal never
  leaves the balance below zero.

  Background:
    Given "Ana Smith" has an account with a balance of 100.00

  @rule-4 @rule-6
  Rule: a withdrawal lowers the balance by its amount, never below zero

    Scenario: a withdrawal lowers the balance
      When 40.00 is withdrawn from Ana's account
      Then Ana's balance is 60.00

    Scenario: the whole balance can be withdrawn
      When 100.00 is withdrawn from Ana's account
      Then Ana's balance is 0.00

    Scenario: a withdrawal larger than the balance is refused
      When 100.01 is withdrawn from Ana's account
      Then the request is refused with "accounts.insufficient_funds"
      And Ana's balance is 100.00

  @rule-3
  Rule: the amount is more than zero with at most two decimal places

    Scenario Outline: an invalid amount is refused
      When <amount> is withdrawn from Ana's account
      Then the request is refused as invalid
      And Ana's balance is 100.00

      Examples:
        | amount |
        | 0      |
        | -10.00 |
        | 10.001 |

  @rule-9
  Rule: the account must exist

    Scenario: a withdrawal from an unknown account
      When 10.00 is withdrawn from an account that does not exist
      Then the request is refused with "accounts.account_not_found"
