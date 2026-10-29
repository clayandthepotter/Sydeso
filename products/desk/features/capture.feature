Feature: Capture works offline
  Notes are often captured in meetings with a poor connection.

  Scenario: Offline capture
    Given the device has no connection
    When the user saves a note
    Then the note appears in the list
    And it syncs once the connection returns
