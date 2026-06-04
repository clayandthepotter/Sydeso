# OPEN_CORE

This document defines the source-available open-core boundary for Sydeso.

## Model

Sydeso uses a source-available open-core model.

- Public core repository: this repository (`sydeso`)
- Private commercial/internal repositories: `sydeso-cloud` and `sydeso-internal` (future/organizational)

## Public Core (This Repository)

The public core includes self-hostable platform capabilities and contributor-facing docs.

Included:

- `apps/web`
- `apps/api`
- `apps/runner`
- `packages/domain`
- `packages/api-contracts`
- `packages/db`
- `infra/docker`
- `docs`
- `.github`
- Root build/config files

## Private / Commercial Scope

Private/commercial scope includes hosted platform and non-public strategy.

Examples:

- Managed runner provisioning internals
- Billing and entitlements
- Hosted cloud operations
- Enterprise-only modules
- Private strategy and pricing docs
- Private design research/source files

## Dependency Rule

Public core must not depend on private repositories.

Private/commercial repositories may depend on public core.

## Documentation Boundary

- Public docs: `docs/` + root governance files
- Private docs: `private_docs/`

Public contribution must never require access to `private_docs/`.
