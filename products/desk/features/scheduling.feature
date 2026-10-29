Feature: Time blocks are proposals
  The scheduler proposes time blocks. A block becomes a calendar event only after the user confirms it.

  Scenario: Time blocks need confirmation
    Given a P1 item with a 60 minute duration
    When the scheduler runs
    Then a TimeBlockProposed event is stored
    And no calendar event exists until TimeBlockConfirmed
