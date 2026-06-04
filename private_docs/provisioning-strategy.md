# Provisioning Strategy (Internal)

Status: Internal
Owner: Platform
Last Updated: 2026-06-04

---

## Purpose

Capture internal provisioning direction for managed and self-hosted deployment paths.

## Self-Hosted Core

Public core should remain runnable with:

- Postgres
- Redis
- S3-compatible storage (MinIO locally)
- API + Web + Runner

## Hosted/Managed Direction

Private/commercial provisioning tracks:

- Managed runner provisioning strategy
- Cloud environment topology
- Secret management and rotation policy
- Backup/restore operational workflows
- Observability and incident response controls

## Documentation Boundary

Public self-hosting docs go in `docs/`.

Internal hosted provisioning details remain private.
