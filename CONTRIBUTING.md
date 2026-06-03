# Contributing

Thank you for your interest in contributing to Sydeso.

## Development Workflow

1. Read `docs/RULES.md` and `TODO.md` before starting work.
2. Work on one feature/domain at a time.
3. Keep changes small, typed, and modular.
4. Run validation before opening a pull request.

```bash
pnpm install
pnpm typecheck
pnpm build
```

## Pull Requests

Pull requests should include:

- A clear summary of the change.
- The issue, TODO item, or feature area being addressed.
- Validation performed.
- Screenshots for UI changes when applicable.
- Migration notes for database changes.

## Database Changes

- Use Prisma migrations for schema changes.
- Do not edit applied migrations after they have been pushed.
- Avoid destructive migrations unless explicitly discussed.
- Document rollout risks in the pull request.

## Security

- Do not commit secrets.
- Do not expose server credentials to the web app.
- Report vulnerabilities using `SECURITY.md`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
