export interface RunnerJobPayload {
  jobId: string;
  workflowRunId: string;
  state: string;
  agentType: string;
  repository?: {
    url?: string | null;
    branch: string;
  };
  inputArtifacts: unknown[];
  execution?: {
    timeoutSeconds?: number;
    maxLogBytes?: number;
  };
}

export interface RunnerJobResult {
  status: "succeeded" | "failed";
  outputArtifacts: Array<{
    type: string;
    title: string;
    content: unknown;
    storageKey?: string;
  }>;
  logsStorageKey?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
