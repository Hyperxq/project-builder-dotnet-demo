@draft
Feature: Transfer money
  A holder moves money from one of their accounts to another account. Either the money leaves the
  source and arrives in the destination, or nothing changes.

  Background:
    Given "Ana Smith" has an account with a balance of 100.00
    And "Ben Jones" has an account with a balance of 20.00

  @rule-1 @rule-5
  Rule: a transfer moves the amount from the source to the destination

    Scenario: Ana transfers money to Ben
      When Ana transfers 30.00 to Ben
      Then the transfer is made
      And Ana's balance is 70.00
      And Ben's balance is 50.00

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
  Rule: the source and destination accounts are different

    Scenario: Ana transfers money to herself
      When Ana transfers 30.00 to her own account
      Then the request is refused with "transfers.same_account"
      And Ana's balance is 100.00

  @rule-3
  Rule: both accounts exist

    Scenario: a transfer to an account that does not exist
      When Ana transfers 30.00 to an account that does not exist
      Then the request is refused with "transfers.account_not_found"
      And Ana's balance is 100.00

  @rule-4
  Rule: the source holds at least the amount

    Scenario: Ana transfers more than she has
      When Ana transfers 100.01 to Ben
      Then the request is refused with "transfers.insufficient_funds"
      And Ana's balance is 100.00
      And Ben's balance is 20.00
