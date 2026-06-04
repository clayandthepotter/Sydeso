# Contributing

Thank you for contributing to Sydeso.

## Read First

Before starting work, read:

- `README.md`
- `docs/RULES.md`
- `docs/product/roadmap.md`
- `SECURITY.md`

## Definitive Collaboration Workflow

GitHub Issues and GitHub Projects are the definitive source of collaboration and execution tracking.

Use this flow:

Issue -> Project item -> Branch/PR -> Checks/review -> Merge -> Project status update

`TODO.md` is a local mirror/index and should reference tracked GitHub work.

## Development Workflow

1. Pick or create a GitHub issue.
2. Ensure the issue is in the roadmap project with phase/area/priority.
3. Create a branch scoped to that issue.
4. Keep changes typed, small, and modular.
5. Run validation before opening a pull request.
6. Use conventional commit style for PR titles/merge commits so semantic-release can update changelog and releases.

```bash
pnpm install
pnpm typecheck
pnpm build
```

For database work:

```bash
pnpm db:generate
pnpm db:migrate
```

## Pull Requests

Pull requests should include:

- Linked GitHub issue
- Clear summary and scope
- Validation performed
- Screenshots for UI changes
- Migration notes for database changes
- Risk notes (tenant/workflow/data impact)

Normal work should merge through PRs to `main`.

Direct pushes to `main` are reserved for emergency repository-health, data-integrity, or security fixes.

## Conventional Commits

Use conventional commit-style titles for PRs and merge commits.

Examples:

- `feat: add artifact browser shell`
- `fix: preserve tenant scoping in project queries`
- `docs: clarify source-available licensing`
- `chore: sync project automation config`

## Design and UI Changes

For UI/UX work:

- Follow `docs/brand/visual-branding-guide.md`
- Follow `docs/prds/design-system-governance.md`
- Keep radius within approved small range unless explicitly approved
- Include before/after screenshots in the PR

## Security

- Do not commit secrets.
- Do not expose server credentials to web clients.
- Report vulnerabilities using `SECURITY.md`.

## Public vs Internal Docs

- Public contributor docs are in `docs/` and root governance files.
- Internal/private strategy docs are in `private_docs/`.
- Public contributions must not require private docs.

## License

By contributing, you agree your contributions are licensed under this repository's license (`BUSL-1.1`), as described in `LICENSE`.
