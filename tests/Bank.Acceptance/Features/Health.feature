Feature: API health
  The walking skeleton: the acceptance suite reaches the real HTTP pipeline.

  Scenario: The API reports it is up
    When a client asks for the API health
    Then the response status is 200
