@draft
Feature: Withdraw money
  A holder takes money out of their account. The bank has no overdrafts, so a withdrawal never
  leaves the balance below zero.

  Background:
    Given "Ana Smith" has an account with a balance of 100.00

  @rule-3 @rule-5
  Rule: a withdrawal takes its amount from the balance, never below zero

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

  @rule-6
  Rule: the account must exist

    Scenario: a withdrawal from an unknown account
      When 10.00 is withdrawn from an account that does not exist
      Then the request is refused with "accounts.account_not_found"
