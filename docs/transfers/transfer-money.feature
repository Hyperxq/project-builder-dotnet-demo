Feature: Transfer money
  A holder sends money from an account to another account, and the bank records the transfer.
  Either the money leaves the source and arrives in the destination, or nothing changes.

  Background:
    Given "Ana Smith" has an account with a balance of 100.00
    And "Ben Jones" has an account with a balance of 20.00

  @rule-3
  Rule: a transfer moves the amount and is recorded

    Scenario: Ana transfers money to Ben
      When Ana transfers 30.00 to Ben
      Then the transfer is recorded from Ana's account to Ben's for 30.00
      And Ana's balance is 70.00
      And Ben's balance is 50.00

  @rule-1
  Rule: the amount is more than zero with at most two decimal places

    Scenario Outline: an invalid amount is refused
      When Ana transfers <amount> to Ben
      Then the request is refused as invalid
      And Ana's balance is 100.00
      And Ben's balance is 20.00

      Examples:
        | amount |
        | 0      |
        | -5.00  |
        | 1.005  |

  @rule-2
  Rule: when the bank refuses to move the money, the transfer is refused in its own words
    A refused transfer is never recorded, so it gets no transfer id to read back.

    Scenario: the source and destination are the same account
      When Ana transfers 30.00 from her account to the same account
      Then the request is refused with "transfers.same_account"
      And Ana's balance is 100.00

    Scenario: the destination does not exist
      When Ana transfers 30.00 to an account that does not exist
      Then the request is refused with "transfers.account_not_found"
      And Ana's balance is 100.00

    Scenario: the source does not exist
      When 30.00 is transferred from an account that does not exist to Ben
      Then the request is refused with "transfers.account_not_found"
      And Ben's balance is 20.00

    Scenario: Ana transfers more than she has
      When Ana transfers 100.01 to Ben
      Then the request is refused with "transfers.insufficient_funds"
      And no transfer id is given
      And Ana's balance is 100.00
      And Ben's balance is 20.00
