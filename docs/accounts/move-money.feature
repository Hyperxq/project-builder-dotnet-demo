Feature: Move money between accounts
  The bank moves money from one account to another. Both balances change together, or neither
  does, so money is never lost or created inside the bank. A move is not a deposit, so the
  deposit limit does not apply to it.

  Background:
    Given "Ana Smith" has an account with a balance of 20000.00
    And "Ben Jones" has an account with a balance of 20.00

  @rule-4 @rule-5 @rule-7
  Rule: a move lowers the source and raises the destination by its amount, together

    Scenario: money moves from Ana to Ben
      When 30.00 is moved from Ana's account to Ben's
      Then Ana's balance is 19970.00
      And Ben's balance is 50.00

    Scenario: a move larger than the deposit limit
      When 15000.00 is moved from Ana's account to Ben's
      Then Ana's balance is 5000.00
      And Ben's balance is 15020.00

  @rule-3
  Rule: the amount is more than zero with at most two decimal places

    Scenario Outline: an invalid amount is refused
      When <amount> is moved from Ana's account to Ben's
      Then the request is refused as invalid
      And Ana's balance is 20000.00
      And Ben's balance is 20.00

      Examples:
        | amount |
        | 0      |
        | -5.00  |
        | 1.005  |

  @rule-6 @rule-8 @rule-9
  Rule: a move is refused when the accounts are the same, either does not exist, or the source holds too little
    The checks run in that order, and nothing changes when one refuses.

    Scenario: the source holds less than the amount
      When 20000.01 is moved from Ana's account to Ben's
      Then the request is refused with "accounts.insufficient_funds"
      And Ana's balance is 20000.00
      And Ben's balance is 20.00

    Scenario: the source and destination are the same account
      When 30.00 is moved from Ana's account to Ana's
      Then the request is refused with "accounts.same_account"
      And Ana's balance is 20000.00

    Scenario: the destination does not exist
      When 30.00 is moved from Ana's account to an account that does not exist
      Then the request is refused with "accounts.account_not_found"
      And Ana's balance is 20000.00

    Scenario: the source does not exist
      When 30.00 is moved from an account that does not exist to Ben's
      Then the request is refused with "accounts.account_not_found"
      And Ben's balance is 20.00
