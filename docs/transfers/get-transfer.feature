@draft
Feature: Get a transfer
  A holder reads a transfer the bank made, by the id they got when they sent it.

  @rule-3 @rule-4
  Rule: a transfer is read back by its id

    Scenario: Ana reads the transfer she made
      Given "Ana Smith" has an account with a balance of 100.00
      And "Ben Jones" has an account with a balance of 20.00
      And Ana transferred 30.00 to Ben
      When Ana reads that transfer
      Then the transfer shown is from Ana's account to Ben's for 30.00

    Scenario: reading a transfer that was never made
      When a transfer that was never made is read
      Then the request is refused with "transfers.transfer_not_found"
