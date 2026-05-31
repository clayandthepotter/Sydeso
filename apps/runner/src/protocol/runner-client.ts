import { executeRunnerJob } from "../executors/execute-runner-job";
import type { RunnerJobPayload } from "./types";

const capabilities = [
  "git",
  "docker",
  "node",
  "playwright",
  "browser_automation",
  "filesystem",
  "terminal",
];

export class RunnerClient {
  constructor(
    private readonly controlPlaneUrl: string,
    private readonly runnerToken: string,
  ) {}

  async runForever() {
    while (true) {
      await this.heartbeat();
      const job = await this.claimJob();

      if (job) {
        await this.executeAndComplete(job);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async heartbeat() {
    await fetch(`${this.controlPlaneUrl}/api/v1/runners/me/heartbeat`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: "online", version: "0.1.0", capabilities }),
    }).catch(() => undefined);
  }

  private async claimJob(): Promise<RunnerJobPayload | null> {
    const response = await fetch(`${this.controlPlaneUrl}/api/v1/runners/me/jobs/claim`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ capabilities }),
    }).catch(() => null);

    if (!response || response.status === 204 || !response.ok) {
      return null;
    }

    return response.json() as Promise<RunnerJobPayload>;
  }

  private async executeAndComplete(job: RunnerJobPayload) {
    const result = await executeRunnerJob(job);

    await fetch(`${this.controlPlaneUrl}/api/v1/runners/me/jobs/${job.jobId}/complete`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(result),
    }).catch(() => undefined);
  }

  private headers() {
    return {
      "content-type": "application/json",
      authorization: `Bearer ${this.runnerToken}`,
    };
  }
}
