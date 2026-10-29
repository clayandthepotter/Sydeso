# CLAUDE.md for Desk

Read `HANDOFF.md` first. It has the goal, the locked decisions, and the rules.

## Rules for agents

- Desk is a separate pnpm workspace. Run every command in `products/desk`.
- Do not touch other Sydeso resources. Prefix every Cloudflare resource with `desk-`.
- Never deploy. Never change DNS, Email Routing, or Access policies. Ask the user first.
- Tests first. Write or change a scenario or unit test, see it fail, then write the code.
- Domain logic in `packages/domain` is pure. No I/O. No `Date.now()`. Use the `Clock` and `IdGenerator` ports.
- Contexts share events only. A context never reads another context's tables.
- Every consumer is idempotent on the event ID. Derive the IDs of caused events with `causedEventId`.
- Do not change a published migration. Add a new migration.
- When you build a service, remove its `NotBuiltError` throw only when its scenario passes.
- Use American English. Short, simple sentences (ASD-STE100). No em dashes or en dashes.
- One behavior per commit.

## Commands

```bash
pnpm install
pnpm test           # all projects
pnpm test:domain    # domain and testing packages
pnpm test:db        # D1 migrations in the Workers runtime
pnpm test:features  # Gherkin scenarios
pnpm typecheck
```
