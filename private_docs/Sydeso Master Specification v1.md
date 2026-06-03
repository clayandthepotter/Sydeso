# Sydeso

Master Specification v1

# Executive Summary

Sydeso is a multi-tenant SaaS platform that transforms natural language software requests into verified implementation artifacts through a deterministic software development lifecycle.

Sydeso replaces traditional coordination between Product Managers, Architects, Developers, and QA engineers with a workflow-driven operating system powered by AI.

The workflow is the product.

Agents are implementation workers operating within workflow states.

The platform enables organizations to move software requests from backlog to verified implementation through a structured, auditable process.

# Vision

Create the operating system for AI-native software development teams.

Sydeso should become the canonical environment where software ideas are:

-   Captured
-   Refined
-   Designed
-   Implemented
-   Verified
-   Approved
-   Released

using a combination of AI agents, workflow automation, and human approvals.

# Core Product Promise

A user submits a feature request.

Sydeso automatically:

1.  Generates requirements
2.  Produces design artifacts
3.  Generates implementation plans
4.  Produces implementation artifacts
5.  Executes automated verification
6.  Iterates through remediation loops
7.  Produces a verified implementation package

without requiring manual implementation work.

# Product Philosophy

All work is represented as artifacts.

All work progresses through workflow states.

All state transitions are auditable.

All agent communication occurs through artifacts.

No workflow logic depends on conversational memory.

Workflow state is the source of truth.

Artifacts are the system of record.

# Target Customers

Tier 1

Solo founders

Freelancers

Indie hackers

Tier 2

Startups

Agencies

Product teams

Tier 3

AI-native engineering organizations

Consultancies

Internal platform teams

# Core Workflow

Backlog

↓

Design

↓

Design Approval

↓

Development

↓

Automated QA

↓

Manual Review

↓

Ready

↓

Released (Future)

# Workflow State Definitions

## Backlog

Purpose

Store incoming requests.

Inputs

Natural language feature requests.

Outputs

Feature artifacts.

Trigger

Move to Design.

## Design

Agent

Architect Agent

Outputs

Technical Design

Acceptance Criteria

UI Specification

Design System Guide

API Design

Risk Assessment

Database Changes

User Flows

Exit

Design generated.

## Design Approval

Human approval gate.

Actions

Approve

Reject

Regenerate

Exit

Move to Development.

## Development

Agent

Developer Agent

Outputs

Code

Tests

Documentation

Migrations

Implementation Artifacts

Exit

Implementation package complete.

## Automated QA

Agent

QA Agent

Verification Areas

Unit Testing

Integration Testing

E2E Testing

Accessibility

Performance

Visual Regression

Design Compliance

Acceptance Criteria Compliance

Exit

Pass

or

Fail

## Remediation Loop

Fail

↓

Developer Agent

↓

QA Agent

↓

Fail

↓

Developer Agent

↓

QA Agent

↓

Fail

↓

Escalated

Default Maximum Iterations

3

Configurable

Per Project

Per Workflow

## Manual Review

Human review stage.

Artifacts

QA Reports

Screenshots

Coverage Reports

Compliance Reports

Actions

Approve

Reject

Escalate

## Ready

Implementation verified.

Awaiting deployment.

## Escalated

Human intervention required.

# Agent Architecture

## PM Agent

Responsibilities

Requirement decomposition

Requirement clarification

Acceptance criteria generation

PRD generation

## Architect Agent

Responsibilities

System design

Database design

API design

UI specification

Risk analysis

## Developer Agent

Responsibilities

Implementation generation

Test generation

Documentation generation

Refactoring

Bug fixing

## QA Agent

Responsibilities

Verification

Compliance validation

Defect reporting

Design comparison

Acceptance criteria validation

# Artifact Model

Artifacts are first-class entities.

Artifact Types

Feature Request

PRD

Research Report

Design Package

Design System Guide

Implementation Package

QA Report

Review Report

Release Candidate

Skill File

Workflow Template

Policy Definition

All artifacts are immutable and versioned.

# Skill File System

Purpose

Customize agent behavior without prompt engineering.

Skill Files provide organizational standards.

Examples

Frontend Standards

API Standards

Security Standards

Accessibility Standards

Design System Standards

Visual Branding Guide

Example Structure

Name

Description

Rules

Examples

References

Scope

Project

Organization

Global

Skill Files are automatically injected into agent context.

# Agent Customization

Tier 2

Project-level skill files.

Tier 3

Organization-level skill libraries.

Custom agent profiles.

Workflow templates.

Policy templates.

Organizational memory integration.

Raw prompt editing is not supported.

# Organizational Memory

Storage

Postgres

pgvector

Memory Categories

Architecture Decisions

Coding Standards

Design Systems

Prior Features

Prior Designs

Prior QA Reports

Prior Implementations

Organization Policies

Tier 3 includes cross-project memory.

# Runner Architecture

Sydeso consists of:

Control Plane

Execution Plane

## Control Plane

Responsibilities

Organizations

Projects

Workflows

Artifacts

Approvals

Memory

Agents

Audit Logs

Provisioning

Runner Registry

## Execution Plane

Responsibilities

Git Operations

File Operations

Docker

Playwright

Test Execution

Build Execution

Artifact Production

# Runner Types

## Self Hosted Runner

Customer infrastructure.

Examples

VPS

Dedicated Server

Home Lab

Kubernetes

Included in all plans.

## Managed Runner

Provisioned automatically.

Provider

DigitalOcean

MVP Scope

Included

Tier 2

1 Managed Runner

Tier 3

1 Managed Runner

Tier 1

Add-on

# Runner Principles

Workflow engine never knows runner location.

Workflow engine schedules by capabilities.

Managed and self-hosted runners share identical protocols.

# Runner Registry

Runner Properties

Name

Type

Status

Capabilities

Version

Projects

Last Seen

Health Metrics

# Runner Capabilities

Git

Docker

Playwright

Node

Python

Terminal

Filesystem

Browser Automation

# Multi-Tenant Model

Organization

↓

Workspace

↓

Project

↓

Workflow

↓

Feature

↓

Artifact

# User Roles

Organization Owner

Product Lead

Developer

QA Reviewer

Viewer

# Permissions

Role-based access control.

Workflow approvals respect permissions.

Artifact visibility respects permissions.

# Pricing Model

## Builder

$19/month

BYO API Keys

Unlimited Projects

Unlimited Repositories

Unlimited Self Hosted Runners

Default Agents

Default Workflow

Managed Runner Add-On

## Team

$59/month

BYO API Keys

1 Managed Runner Included

Multi-User Teams

Approval Workflows

Workflow Configuration

Project Skill Files

Runner Dashboard

Shared Artifacts

## Organization

$299/month

BYO API Keys

1 Managed Runner Included

Organization Skill Libraries

Cross Project Memory

Custom Agent Profiles

Workflow Templates

Organization Policies

Audit Logs

API Access

Runner Pools

# Primary Differentiators

Builder

Use the Sydeso workflow.

Team

Adapt the Sydeso workflow.

Organization

Embed your organization’s process into Sydeso.

# MVP Technology Stack

Frontend

Next.js

TypeScript

Tailwind

shadcn/ui

Backend

NestJS

Database

PostgreSQL

Memory

pgvector

Queue

Redis

Storage

S3 Compatible Storage

Managed Infrastructure

DigitalOcean

Execution Runtime

Docker

Testing

Playwright

axe-core

Lighthouse

AI

OpenAI (BYO API Keys)

# MVP Success Criteria

A feature request can move from:

Backlog

↓

Design

↓

Design Approval

↓

Development

↓

Automated QA

↓

Remediation Loop

↓

Manual Review

↓

Ready

without manual implementation work.

Every state transition is auditable.

Every generated output is stored as an artifact.

Every implementation can be validated against approved designs.

The workflow engine remains the primary source of truth.
