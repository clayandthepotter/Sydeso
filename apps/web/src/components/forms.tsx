"use client";

import { useActionState } from "react";

import {
  createFeatureAction,
  createOrganizationAction,
  createProjectAction,
  createWorkspaceAction,
  registerRunnerAction,
  type ActionState,
  type RunnerActionState,
} from "../app/app/actions";

function ErrorNotice({ error }: { error?: string }) {
  return error ? <p className="notice notice--error mono-text">{error}</p> : null;
}

export function OrganizationForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createOrganizationAction, {});
  return (
    <form className="form" action={action}>
      <div className="field">
        <label className="mono" htmlFor="org-name">
          Organization name
        </label>
        <input id="org-name" className="input" name="name" required autoComplete="organization" />
      </div>
      <div className="field">
        <label className="mono" htmlFor="org-slug">
          Slug (optional)
        </label>
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
        <label className="mono" htmlFor="ws-name">
          Workspace name
        </label>
        <input id="ws-name" className="input" name="name" required />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--ghost" type="submit" disabled={pending}>
          Add workspace
        </button>
        {state.ok && <span className="mono muted">Added</span>}
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
        <label className="mono" htmlFor={`project-name-${workspaceId}`}>
          Project name
        </label>
        <input id={`project-name-${workspaceId}`} className="input" name="name" required />
      </div>
      <div className="field">
        <label className="mono" htmlFor={`project-repo-${workspaceId}`}>
          Repository URL (optional)
        </label>
        <input id={`project-repo-${workspaceId}`} className="input" name="repositoryUrl" type="url" placeholder="https://github.com/…" />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--ghost" type="submit" disabled={pending}>
          Add project
        </button>
      </div>
    </form>
  );
}

export function FeatureForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createFeatureAction, {});
  return (
    <form className="form" action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <label className="mono" htmlFor="feature-title">
          Title
        </label>
        <input id="feature-title" className="input" name="title" required maxLength={160} />
      </div>
      <div className="field">
        <label className="mono" htmlFor="feature-description">
          Feature request
        </label>
        <textarea
          id="feature-description"
          className="input"
          name="description"
          required
          rows={8}
          placeholder="What should exist when this run reaches Released, and for whom."
        />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--accent" type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create feature request"}
        </button>
        <span className="mono muted">Stored as the feature_request artifact and starts a run in Backlog.</span>
      </div>
    </form>
  );
}

export function RunnerForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState<RunnerActionState, FormData>(registerRunnerAction, {});
  return (
    <div className="panel__body">
      {state.runnerToken ? (
        <div className="token">
          <span className="mono">Runner token for {state.runnerName}. Shown once.</span>
          <code>{state.runnerToken}</code>
          <span className="mono-text">
            Start the runner with <code>SYDESO_RUNNER_TOKEN</code> set to this value. It is stored hashed and cannot be
            recovered.
          </span>
        </div>
      ) : null}
      <form className="form" action={action}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="field">
          <label className="mono" htmlFor="runner-name">
            Name
          </label>
          <input id="runner-name" className="input" name="name" required placeholder="build-01" />
        </div>
        <div className="form__row">
          <div className="field">
            <label className="mono" htmlFor="runner-type">
              Type
            </label>
            <select id="runner-type" className="input" name="type" defaultValue="self_hosted">
              <option value="self_hosted">self_hosted</option>
              <option value="managed">managed</option>
            </select>
          </div>
          <div className="field">
            <label className="mono" htmlFor="runner-version">
              Version
            </label>
            <input id="runner-version" className="input" name="version" required placeholder="0.1.0" />
          </div>
        </div>
        <div className="field">
          <label className="mono" htmlFor="runner-capabilities">
            Capabilities, comma separated
          </label>
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
            Register runner
          </button>
        </div>
      </form>
    </div>
  );
}
