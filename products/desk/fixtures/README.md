# Fixtures

These are synthetic examples. The user will add real examples later.
Do not put confidential data in this folder.

## notes/

Each file is one note and the items that triage must extract.

| Field | Meaning |
|---|---|
| `text` | The note text as the user typed it. |
| `capturedAt` | The capture time with a La Paz offset. Relative dates resolve from it. |
| `expectedItems` | The items, without IDs. |
| `expectReview` | `true` if the note must go to the Review Queue. |

## invites/

Each invite is a pair of files:

- `name.ics`: the raw calendar file from the forwarded email.
- `name.expected.json`: the parse result. `outcome` is `parsed` or `rejected`.

Times in `expected` use the America/La_Paz offset (`-04:00`).
`title` is a short title only. The parser must never copy the description, location, or attendees.
