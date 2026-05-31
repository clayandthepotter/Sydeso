import { RunnerClient } from "./protocol/runner-client";

const controlPlaneUrl = process.env.SYDESO_CONTROL_PLANE_URL ?? "http://localhost:4000";
const runnerToken = process.env.SYDESO_RUNNER_TOKEN ?? "dev-runner-token";

const client = new RunnerClient(controlPlaneUrl, runnerToken);

void client.runForever();
