Feature: Triage turns notes into work items
  Triage extracts items from a note and routes each item to a Linear project.
  It never guesses silently.

  Scenario: Note with a deadline becomes a work item
    Given a note "send Dana the SOW by Friday"
    When triage runs
    Then one item is extracted with a Friday due date
    And a 30 minute duration
    And one Linear issue is created

  Scenario: Low confidence goes to review
    Given a note with an ambiguous action
    When triage runs
    Then an ItemNeedsReview event is stored
    And no Linear issue is created

  Scenario: Duplicate note delivery
    Given a NoteCaptured event was delivered twice
    When triage runs
    Then only one ItemsExtracted event exists
