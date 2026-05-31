import type { RunnerJobPayload, RunnerJobResult } from "../protocol/types";

export async function executeRunnerJob(job: RunnerJobPayload): Promise<RunnerJobResult> {
  const artifactType = artifactTypeForJobState(job.state);

  return {
    status: "succeeded",
    outputArtifacts: [
      {
        type: artifactType,
        title: `${job.agentType} ${artifactType.replaceAll("_", " ")}`,
        content: {
          jobId: job.jobId,
          workflowRunId: job.workflowRunId,
          state: job.state,
          repository: job.repository,
          message: "Runner execution placeholder completed.",
        },
      },
    ],
  };
}

function artifactTypeForJobState(state: string) {
  switch (state) {
    case "design":
      return "design_package";
    case "development":
      return "implementation_package";
    case "automated_qa":
      return "qa_report";
    default:
      return "review_report";
  }
}
