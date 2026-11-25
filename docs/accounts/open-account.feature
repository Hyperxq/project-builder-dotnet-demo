@draft
Feature: Open an account
  A person opens a bank account in their name. It starts empty, and the bank gives it an id the
  person uses for every later operation.

  @rule-1 @rule-2
  Rule: an account opens in the holder's name with a balance of zero

    Scenario: a person opens an account
      When "Ana Smith" opens an account
      Then the account is opened in the name of "Ana Smith"
      And its balance is 0.00

    Scenario: the holder name is trimmed
      When "  Ana Smith  " opens an account
      Then the account is opened in the name of "Ana Smith"

  @rule-1
  Rule: the holder name has 1 to 100 characters

    Scenario: the longest holder name is accepted
      When an account is opened with a holder name of 100 characters
      Then the account is opened

    Scenario Outline: an invalid holder name is refused
      When an account is opened with <name>
      Then the request is refused as invalid

      Examples:
        | name                             |
        | an empty holder name             |
        | a holder name of only spaces     |
        | a holder name of 101 characters  |
