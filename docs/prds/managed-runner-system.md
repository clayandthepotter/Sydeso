# PRDs - PRD: Managed Runner System

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-01

---

# Executive Summary

The Managed Runner System provides secure, isolated execution environments for Sydeso workflows and agents.

A runner is a machine that performs work on behalf of the platform.

Examples:

- Cloning repositories
- Running agents
- Generating code
- Executing tests
- Building applications
- Running containers
- Producing artifacts

The Runner System is the execution layer of Sydeso.

The Workflow Engine decides what should happen.

The Agent Orchestrator decides who should do the work.

The Runner System provides where the work executes.

---

# Problem Statement

Most AI development platforms stop at generation.

They generate:

- Code
- Documentation
- Designs

But cannot safely execute:

- Builds
- Tests
- Validation
- Repository operations

Without execution infrastructure:

- Outputs remain theoretical
- Validation is limited
- Automation is constrained

Sydeso solves this through dedicated execution environments called runners.

---

# Goals

## Primary Goals

- Execute agent workloads
- Provide repository access
- Execute tests
- Isolate execution environments
- Support managed infrastructure
- Support self-hosted infrastructure

---

## Secondary Goals

- Enable future deployments
- Enable autonomous validation
- Support scalable execution
- Support enterprise infrastructure

---

# Non-Goals

The MVP will not support:

- Kubernetes clusters
- Distributed execution
- GPU scheduling
- Multi-region runners
- Auto-scaling fleets
- Deployment orchestration

These capabilities are future enhancements.

---

# Core Concept

Workflow
↓
Agent
↓
Runner
↓
Execution
↓
Artifact

The runner is the environment where work actually happens.

---

# Runner Types

The MVP supports two runner models.

---

# Type 1

Managed Runner

Provisioned and operated by Sydeso.

Included in:

- Professional Plan
- Team Plan

---

# Type 2

Self Hosted Runner

Provisioned and operated by customers.

Examples:

- VPS
- Dedicated Server
- Cloud VM
- Home Lab

---

# Managed Runner Architecture

User
↓
Workflow
↓
Agent
↓
Managed Runner
↓
Execution

Sydeso owns:

- Infrastructure
- Provisioning
- Monitoring
- Updates

---

# Self Hosted Runner Architecture

User
↓
Workflow
↓
Agent
↓
Customer Runner
↓
Execution

Customer owns:

- Infrastructure
- Operating System
- Maintenance

Sydeso provides:

- Runner Software
- Connectivity
- Management Interface

---

# Functional Requirements

---

## MR-001

Runner Registration

Description:

System shall register runners.

Priority:

Critical

---

## MR-002

Runner Health Monitoring

Description:

System shall monitor runner status.

Priority:

Critical

---

## MR-003

Runner Assignment

Description:

System shall assign workloads to runners.

Priority:

Critical

---

## MR-004

Runner Authentication

Description:

Runners shall authenticate securely.

Priority:

Critical

---

## MR-005

Execution Isolation

Description:

Runner workloads shall execute independently.

Priority:

Critical

---

## MR-006

Repository Operations

Description:

Runners shall interact with source repositories.

Priority:

Critical

---

## MR-007

Test Execution

Description:

Runners shall execute automated testing.

Priority:

Critical

---

## MR-008

Log Collection

Description:

System shall collect execution logs.

Priority:

Critical

---

## MR-009

Runner Recovery

Description:

System shall recover from runner failures.

Priority:

High

---

## MR-010

Runner Auditing

Description:

All runner operations shall be auditable.

Priority:

Critical

---

# Runner Lifecycle

Provisioned
↓
Registered
↓
Healthy
↓
Assigned
↓
Busy
↓
Available

or

Offline

or

Failed

---

# Runner States

| State | Description |
|----------|----------|
| Provisioning | Being created |
| Online | Ready |
| Busy | Executing work |
| Offline | Unavailable |
| Failed | Unhealthy |
| Destroyed | Removed |

---

# Runner Assignment Flow

Agent Run Created
↓
Eligible Runner Search
↓
Runner Selected
↓
Runner Assigned
↓
Execution Begins

---

# Assignment Rules

Priority Order:

1. Dedicated Project Runner
2. Dedicated Workspace Runner
3. Organization Runner
4. Managed Runner Pool

---

# Execution Model

Each workload executes as a Job.

---

## Job Lifecycle

Created
↓
Queued
↓
Assigned
↓
Running
↓
Completed

or

Failed

---

# Job Schema

```json
{
  "id": "job_xxx",
  "runnerId": "runner_xxx",
  "agentRunId": "run_xxx",
  "status": "running"
}
```

---

# Repository Operations

The MVP must support repository interaction.

---

## Supported Operations

- Clone Repository
- Pull Changes
- Create Branch
- Commit Changes
- Push Changes
- Create Pull Request

---

## Initial Integration

GitHub

MVP only.

---

# Execution Capabilities

Runners must support:

---

## File Operations

- Create files
- Read files
- Modify files
- Delete files

---

## Git Operations

- Clone
- Commit
- Push
- Branch Management

---

## Process Execution

- Run commands
- Execute scripts
- Launch tooling

---

## Container Execution

Docker support required.

---

# Test Execution

The MVP must support automated validation.

---

## Supported Test Types

- Unit Tests
- Integration Tests
- Linting
- Type Checking

---

## Examples

Angular:

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

---

React:

```bash
npm test
```

```bash
npm run build
```

---

# Runner Agent Interaction

Agents never execute directly.

Agents submit work.

Runners execute work.

---

## Flow

Agent
↓
Job
↓
Runner
↓
Results

---

# Managed Runner Provisioning

Provisioning must be fully automated.

---

# MVP Infrastructure Provider

Recommended:

Hetzner

Reason:

- Low cost
- Simple API
- Reliable
- Fast provisioning

---

# Provisioning Flow

Create Runner Request
↓
Provision VM
↓
Install Runner Software
↓
Register Runner
↓
Health Check
↓
Ready

---

# Managed Runner Specifications

MVP Default:

| Resource | Value |
|-----------|----------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Storage | 40 GB SSD |
| OS | Ubuntu LTS |

---

# Runner Software

The Sydeso Runner is a lightweight agent.

Responsibilities:

- Poll for work
- Execute jobs
- Stream logs
- Report health

---

# Runner Registration

---

## Registration Payload

```json
{
  "runnerId": "runner_xxx",
  "organizationId": "org_xxx",
  "token": "secret"
}
```

---

# Authentication

All runners authenticate using signed registration tokens.

---

## Requirements

- Short-lived tokens
- TLS encryption
- Organization isolation

---

# Health Monitoring

Runners must report health periodically.

---

## Heartbeat Interval

30 Seconds

---

## Health Signals

- CPU
- Memory
- Disk
- Network
- Last Activity

---

# Failure Detection

Runner considered unhealthy after:

3 missed heartbeats

---

# Recovery Flow

Runner Offline
↓
Alert
↓
Reassignment
↓
Recovery Attempt

---

# Log Collection

The system must capture:

- Build Logs
- Test Logs
- Agent Logs
- System Logs

---

# Log Retention

MVP:

30 Days

---

# Runner Dashboard

Displays:

- Status
- Health
- Capacity
- Active Jobs

---

# Runner Detail Page

Displays:

- Metrics
- Job History
- Logs
- Configuration

---

# Runner Filters

Filter by:

- Status
- Organization
- Project
- Type

---

# User Configurable Settings

---

## Project Settings

Max Concurrent Jobs

Default:

2

---

## Retry Limit

Default:

3

---

## Runner Preference

Options:

- Managed
- Self Hosted
- Auto

---

## Timeout

Default:

30 Minutes

---

# Pricing Integration

---

## Starter Plan

$19/month

Includes:

- BYO API Keys
- No managed runner

Optional Add-On:

Managed Runner

---

## Professional Plan

$59/month

Includes:

- BYO API Keys
- 1 Managed Runner

---

## Team Plan

$299/month

Includes:

- BYO API Keys
- 1 Managed Runner
- Advanced Runner Configuration

---

# Permissions

---

## Runner Read

Roles:

- Product Manager
- Engineer
- Admin

---

## Runner Manage

Roles:

- Organization Owner
- Organization Admin

---

## Runner Register

Roles:

- Organization Owner
- Organization Admin

---

# Events

Runner actions generate events.

---

## Events

- RunnerRegistered
- RunnerOnline
- RunnerOffline
- RunnerUnhealthy
- RunnerRecovered
- RunnerAssigned
- RunnerReleased
- ManagedRunnerProvisionRequested
- ManagedRunnerProvisioned
- ManagedRunnerDestroyed

---

# API Requirements

---

## List Runners

GET

/runners

---

## Get Runner

GET

/runners/:id

---

## Register Runner

POST

/runners/register

---

## Delete Runner

DELETE

/runners/:id

---

## Runner Jobs

GET

/runners/:id/jobs

---

## Runner Logs

GET

/runners/:id/logs

---

# Dependencies

Required:

- Agent Orchestrator
- Workflow Engine
- GitHub Integration
- Event Bus
- Authentication System

---

# Risks

## Risk

Managed runner costs exceed expectations.

Mitigation:

Runner quotas and usage controls.

---

## Risk

Customer infrastructure varies significantly.

Mitigation:

Standardized runner software.

---

## Risk

Runner compromise affects workloads.

Mitigation:

Isolation and authentication controls.

---

# Acceptance Criteria

## AC-001

Managed runners can be provisioned automatically.

---

## AC-002

Self-hosted runners can register successfully.

---

## AC-003

Runners can execute jobs.

---

## AC-004

Repositories can be cloned.

---

## AC-005

Tests can execute.

---

## AC-006

Logs are collected.

---

## AC-007

Health monitoring functions correctly.

---

## AC-008

Runner failures trigger alerts.

---

## AC-009

Users can monitor runner status.

---

## AC-010

Runner operations are auditable.

---

# Future Enhancements

Planned capabilities:

- Auto Scaling
- Kubernetes Support
- GPU Runners
- Ephemeral Runners
- Deployment Runners
- Multi-Region Runners
- Runner Pools
- Cost Optimization
- Spot Instances
- Infrastructure Templates

---

# Success Metrics

- Runner uptime
- Job completion rate
- Average execution time
- Provisioning time
- Failure rate
- Cost per execution
- User adoption

---

# Definition of Done

The Managed Runner System is complete when:

- Managed runners can be provisioned automatically
- Self-hosted runners can register securely
- Agents can execute workloads
- Repositories can be cloned and modified
- Tests can be executed
- Logs can be collected
- Health monitoring works
- Failures are detectable
- Users can manage runners from the platform

The Managed Runner System provides the execution infrastructure that transforms Sydeso from an AI planning tool into a complete AI-native software delivery platform.