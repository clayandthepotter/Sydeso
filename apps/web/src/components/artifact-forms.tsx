"use client";

import type { ArtifactType } from "@sydeso/domain";
import { useActionState, useState } from "react";

import { createArtifactAction, type ActionState } from "../app/app/actions";

const artifactTypes: ArtifactType[] = [
  "prd",
  "research_report",
  "design_package",
  "implementation_package",
  "qa_report",
  "review_report",
  "release_candidate",
  "skill_file",
  "workflow_template",
  "policy_definition",
];

/** Add a document to a run by hand: inline JSON, or a file that goes to object storage. */
export function ArtifactForm({ workflowRunId, projectId, requestId }: { workflowRunId: string; projectId: string; requestId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createArtifactAction, {});
  const [mode, setMode] = useState<"json" | "file">("json");

  return (
    <form className="form" action={action}>
      <input type="hidden" name="workflowRunId" value={workflowRunId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="mode" value={mode} />
      <div className="form__row">
        <div className="field">
          <label htmlFor="artifact-type">Type</label>
          <select id="artifact-type" className="input" name="type" defaultValue="design_package">
            {artifactTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: "1 1 200px" }}>
          <label htmlFor="artifact-title">Title</label>
          <input id="artifact-title" className="input" name="title" required maxLength={200} />
        </div>
      </div>
      <div className="form__row" role="radiogroup" aria-label="Content">
        <label className="hint" style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
          <input type="radio" name="content-mode" checked={mode === "json"} onChange={() => setMode("json")} /> JSON
        </label>
        <label className="hint" style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
          <input type="radio" name="content-mode" checked={mode === "file"} onChange={() => setMode("file")} /> File
        </label>
      </div>
      {mode === "json" ? (
        <div className="field">
          <label htmlFor="artifact-content">Content, JSON</label>
          <textarea id="artifact-content" className="input" name="content" rows={8} placeholder='{"summary": "…"}' />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="artifact-file">File</label>
          <input id="artifact-file" className="input" name="file" type="file" required />
        </div>
      )}
      {state.error && <p className="notice notice--error">{state.error}</p>}
      <div className="form__row">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add document"}
        </button>
        {state.ok && <span className="hint">Added as a new version</span>}
      </div>
    </form>
  );
}
