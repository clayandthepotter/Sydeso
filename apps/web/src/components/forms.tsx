"use client";

import { useActionState } from "react";

import {
  createOrganizationAction,
  createProjectAction,
  createRequestAction,
  createWorkspaceAction,
  registerRunnerAction,
  type ActionState,
  type RunnerActionState,
} from "../app/app/actions";

function ErrorNotice({ error }: { error?: string }) {
  return error ? <p className="notice notice--error">{error}</p> : null;
}

export function OrganizationForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createOrganizationAction, {});
  return (
    <form className="form" action={action}>
      <div className="field">
        <label htmlFor="org-name">Organization name</label>
        <input id="org-name" className="input" name="name" required autoComplete="organization" />
      </div>
      <div className="field">
        <label htmlFor="org-slug">Slug (optional)</label>
        <input id="org-slug" className="input" name="slug" pattern="[a-z0-9-]+" />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--accent" type="submit" disabled={pending}>
          Create organization
        </button>
      </div>
    </form>
  );
}

export function WorkspaceForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createWorkspaceAction, {});
  return (
    <form className="form" action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="field">
        <label htmlFor="ws-name">Workspace name</label>
        <input id="ws-name" className="input" name="name" required />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn" type="submit" disabled={pending}>
          Add workspace
        </button>
        {state.ok && <span className="hint">Added</span>}
      </div>
    </form>
  );
}

export function ProjectForm({ organizationId, workspaceId }: { organizationId: string; workspaceId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProjectAction, {});
  return (
    <form className="form" action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="field">
        <label htmlFor={`project-name-${workspaceId}`}>Project name</label>
        <input id={`project-name-${workspaceId}`} className="input" name="name" required />
      </div>
      <div className="field">
        <label htmlFor={`project-repo-${workspaceId}`}>Repository URL (optional)</label>
        <input id={`project-repo-${workspaceId}`} className="input" name="repositoryUrl" type="url" placeholder="https://github.com/…" />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn" type="submit" disabled={pending}>
          Add project
        </button>
      </div>
    </form>
  );
}

/** One text area. The title comes from the first line; the request starts when it is submitted. */
export function RequestForm({ projectId, repositoryMissing = false }: { projectId: string; repositoryMissing?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createRequestAction, {});
  return (
    <form className="form" action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <label htmlFor="request-description">Describe what you want built</label>
        <textarea
          id="request-description"
          className="input"
          name="description"
          required
          rows={8}
          autoFocus
          placeholder="Add a dark mode toggle to the settings page."
        />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--accent" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </button>
      </div>
      {repositoryMissing && <p className="hint">No repository connected. The build step needs one.</p>}
    </form>
  );
}

export function MachineForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState<RunnerActionState, FormData>(registerRunnerAction, {});
  return (
    <div className="panel__body">
      {state.runnerToken ? (
        <div className="token">
          <span className="mono">Token for {state.runnerName}. Shown once.</span>
          <code>{state.runnerToken}</code>
          <span className="hint">
            Start the machine with <code>SYDESO_RUNNER_TOKEN</code> set to this value. It is stored hashed and cannot be
            recovered.
          </span>
        </div>
      ) : null}
      <form className="form" action={action}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="field">
          <label htmlFor="runner-name">Name</label>
          <input id="runner-name" className="input" name="name" required placeholder="build-01" />
        </div>
        <div className="form__row">
          <div className="field">
            <label htmlFor="runner-type">Type</label>
            <select id="runner-type" className="input" name="type" defaultValue="self_hosted">
              <option value="self_hosted">Self-hosted</option>
              <option value="managed">Managed</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="runner-version">Version</label>
            <input id="runner-version" className="input" name="version" required placeholder="0.1.0" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="runner-capabilities">Capabilities, comma separated</label>
          <input
            id="runner-capabilities"
            className="input"
            name="capabilities"
            placeholder="git, filesystem, terminal, node, docker, playwright, browser_automation"
          />
        </div>
        <ErrorNotice error={state.error} />
        <div className="form__row">
          <button className="btn btn--accent" type="submit" disabled={pending}>
            Add machine
          </button>
        </div>
      </form>
    </div>
  );
}
