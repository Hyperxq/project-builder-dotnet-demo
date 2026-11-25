@draft
Feature: Get the balance
  A holder reads how much money their account holds.

  @rule-6
  Rule: the balance is read from an existing account

    Scenario: a holder reads their balance
      Given "Ana Smith" has an account with a balance of 100.00
      When Ana reads her balance
      Then the balance shown is 100.00 in the name of "Ana Smith"

    Scenario: reading the balance of an unknown account
      When the balance of an account that does not exist is read
      Then the request is refused with "accounts.account_not_found"
