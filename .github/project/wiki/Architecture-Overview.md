# Architecture Overview

Sydeso is workflow-first and artifact-driven.

Core invariant:

```txt
Feature Request -> Artifact -> Workflow Run -> Transition -> Job -> Runner -> Output Artifact -> Next Transition
```

Canonical docs:

- `docs/architecture/system-overview.md`
- `docs/architecture/domain-model.md`
- `docs/architecture/event-model.md`
- `docs/architecture/agent-protocol.md`
- `docs/prds/core-workflow-engine.md`
