Feature: Corporate invites are mirrored to Google Calendar
  Forwarded invites become Busy events on the Corporate Mirror calendar.
  The iCalUID is the dedupe key.

  Scenario: Invite update replaces the mirror event
    Given a mirrored invite
    When the organizer moves it by 1 hour (higher SEQUENCE)
    Then the mirror event moves
    And no duplicate exists

  Scenario: Invite cancellation
    Given a mirrored invite
    When a METHOD CANCEL invite arrives
    Then the mirror event is removed
