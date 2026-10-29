Feature: Ingestion accepts forwarded invites
  The Email Worker accepts mail only from the corporate address.
  The parser converts invite times to America/La_Paz.

  Scenario: Invite in another time zone
    Given an invite in Eastern time
    When it is parsed
    Then the event shows at the correct La Paz time

  Scenario: Unknown sender
    Given an email from an address not on the allow list
    When the Email Worker runs
    Then the email is rejected
    And an InviteRejected event is stored
