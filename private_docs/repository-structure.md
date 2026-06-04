# Repository Structure Strategy (Internal)

Status: Internal
Owner: Architecture
Last Updated: 2026-06-04

---

## Recommended Structure

Initial recommendation:

1. `sydeso` (public/source-available core)
2. `sydeso-cloud` (private/commercial hosted platform)
3. `sydeso-internal` (private strategy/docs/research)

Future expansion if needed:

- `sydeso-enterprise`
- `sydeso-infra`

## Dependency Direction

`private/commercial` repositories may depend on `sydeso`.

`public core` must not depend on private repositories.

## Boundary Notes

Public core includes self-hostable runtime, docs, and contributor tooling.

Private repos include hosted/commercial operations and internal strategy.
