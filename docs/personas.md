# Sydeso Personas

Version: 0.1.0

Status: Draft

Owner: Product

Last Updated: 2026-06-02

---

# Overview

This document defines the primary user personas for Sydeso.

Personas represent the users, stakeholders, and operators who interact with the platform.

These personas are used to guide:

- Product decisions
- Workflow design
- Permission models
- Agent interactions
- User experience design
- Feature prioritization

---

# Persona Hierarchy

## Primary Personas

- Founder
- Product Manager
- Software Engineer

## Secondary Personas

- Designer
- QA Engineer
- Engineering Manager
- Product End User

## Administrative Personas

- Organization Owner
- Workspace Administrator

## Future Personas

- Enterprise Administrator
- Compliance Officer
- Security Reviewer

---

# Founder

## Description

A founder building products with a small team and significant AI assistance.

May be technical or non-technical.

Typically responsible for:

- Product direction
- Prioritization
- Budget decisions
- Approvals
- Delivery outcomes

---

## Goals

- Ship products faster
- Reduce engineering costs
- Increase execution velocity
- Maintain quality
- Minimize operational overhead

---

## Pain Points

- Limited engineering resources
- Slow delivery cycles
- Context switching
- Documentation debt
- Lack of visibility

---

## Primary Activities

- Create projects
- Define goals
- Create initiatives
- Prioritize work
- Review artifacts
- Approve releases

---

## Success Criteria

- Faster feature delivery
- Predictable execution
- High quality outcomes
- Reduced management overhead

---

# Product Manager

## Description

Responsible for defining requirements and prioritizing work.

Acts as the bridge between business goals and implementation.

---

## Goals

- Maintain roadmap alignment
- Produce clear requirements
- Reduce ambiguity
- Track delivery progress

---

## Pain Points

- Poor requirement quality
- Communication gaps
- Documentation drift
- Lack of traceability

---

## Primary Activities

- Create epics
- Create stories
- Review PRDs
- Approve requirements
- Track progress

---

## Success Criteria

- Clear requirements
- Predictable delivery
- High team alignment

---

# Software Engineer

## Description

Responsible for implementation, review, debugging, and delivery.

Often collaborates with AI agents.

---

## Goals

- Build features quickly
- Maintain code quality
- Reduce repetitive work
- Improve delivery velocity

---

## Pain Points

- Ambiguous requirements
- Excessive meetings
- Context switching
- Manual testing

---

## Primary Activities

- Review technical designs
- Review generated code
- Execute implementations
- Resolve defects
- Approve changes

---

## Success Criteria

- High quality code
- Reduced manual effort
- Faster delivery cycles

---

# Designer

## Description

Responsible for user experience and interface design.

May collaborate with design agents.

---

## Goals

- Produce consistent UX
- Improve usability
- Maintain design systems

---

## Pain Points

- Requirement ambiguity
- Design drift
- Inconsistent implementation

---

## Primary Activities

- Review designs
- Create design systems
- Validate UX outcomes
- Edit UI/UX prototypes directly in design tools
- Submit prototype snapshots for approval
- Maintain design locks and visual standards

---

## Success Criteria

- Consistent user experience
- Reduced rework
- Higher usability
- Ability to apply design expertise directly without prompting an agent for every visual change

---

# QA Engineer

## Description

Responsible for validating quality and ensuring requirements are met.

May supervise automated QA agents.

---

## Goals

- Prevent defects
- Increase test coverage
- Reduce regressions

---

## Pain Points

- Manual testing effort
- Poor requirement traceability
- Inconsistent test coverage

---

## Primary Activities

- Review test plans
- Execute validation
- Review QA reports
- Validate implementation against governing documentation and design locks
- Approve quality gates

---

## Success Criteria

- High test coverage
- Low defect escape rate
- Reliable releases
- QA decisions reference the correct requirements, policies, and design locks

---

# Documentation Owner

## Description

Responsible for maintaining company and project knowledge that governs execution.

This role may be held by a Product Manager, Engineering Manager, Technical Lead, Designer, Security Reviewer, or Operations leader depending on the organization.

---

## Goals

- Keep project context accurate
- Maintain standards and policies
- Reduce repeated explanation
- Ensure agents and reviewers use approved guardrails

---

## Pain Points

- Documentation drift
- Unclear ownership
- Outdated standards
- Agents using stale context

---

## Primary Activities

- Create wiki pages
- Edit governing documentation drafts
- Approve policy and standard updates
- Link documentation to projects, workflows, and artifacts
- Review documentation changes before they become active guardrails

---

## Success Criteria

- Current project context
- Reduced ambiguity
- Traceable decisions
- Standards consistently applied during workflow execution

---

# Engineering Manager

## Description

Responsible for delivery outcomes and engineering operations.

Focuses on planning, coordination, and team performance.

---

## Goals

- Improve delivery predictability
- Remove blockers
- Optimize team throughput

---

## Pain Points

- Poor visibility
- Delivery uncertainty
- Process bottlenecks

---

## Primary Activities

- Review roadmaps
- Review metrics
- Allocate resources
- Approve initiatives

---

## Success Criteria

- Predictable delivery
- Healthy team velocity
- Reduced operational friction

---

# Product End User

## Description

A consumer of software produced by Sydeso teams.

Product End Users are not necessarily Sydeso workspace members, but they interact with delivered products and provide feedback that can influence future work.

---

## Goals

- Submit feedback
- Report issues
- Suggest improvements
- Track feedback status

---

## Pain Points

- Product issues are hard to report
- Feedback disappears into disconnected channels
- Status is unclear after submission

---

## Primary Activities

- Submit product feedback
- Attach screenshots or supporting details
- Track whether feedback is triaged, accepted, rejected, or converted

---

## Success Criteria

- Feedback reaches the product team
- Accepted feedback can become Stories
- Feedback status remains visible

---

# Organization Owner

## Description

Top-level workspace owner.

Responsible for organizational settings, billing, governance, and access.

---

## Goals

- Manage organizations
- Control spending
- Configure governance
- Manage permissions

---

## Primary Activities

- Manage billing
- Manage workspaces
- Configure integrations
- Manage runner allocations

---

## Success Criteria

- Secure environment
- Controlled costs
- Reliable operations

---

# Workspace Administrator

## Description

Responsible for workspace-level administration.

Manages users, permissions, workflows, and integrations.

---

## Goals

- Configure workspace
- Maintain user access
- Manage workflows

---

## Primary Activities

- Invite users
- Configure workflows
- Configure agents
- Configure integrations

---

## Success Criteria

- Healthy workspace operations
- Appropriate access controls

---

# Future Persona: Enterprise Administrator

## Description

Responsible for enterprise-wide governance.

---

## Goals

- Compliance
- Security
- Auditability

---

## Primary Activities

- Policy management
- Audit review
- Compliance reporting

---

# Future Persona: Compliance Officer

## Description

Responsible for regulatory and internal compliance.

---

## Goals

- Risk reduction
- Policy enforcement
- Audit readiness

---

# Future Persona: Security Reviewer

## Description

Responsible for security validation.

---

## Goals

- Prevent vulnerabilities
- Review security posture
- Validate security controls

---

# AI Personas

Sydeso treats AI agents as first-class actors.

Agents participate in workflows similarly to human users.

---

# Product Manager Agent

## Responsibilities

- Requirement generation
- Story creation
- PRD generation
- Backlog refinement

---

## Inputs

- User requests
- Research artifacts
- Project context

---

## Outputs

- PRDs
- Stories
- Acceptance criteria

---

# Research Agent

## Responsibilities

- Research
- Discovery
- Competitive analysis
- Technical investigation

---

## Outputs

- Research reports
- Recommendations

---

# Architect Agent

## Responsibilities

- System design
- Technical specifications
- Architecture recommendations

---

## Outputs

- Technical designs
- Architecture artifacts

---

# Developer Agent

## Responsibilities

- Code generation
- Refactoring
- Bug fixing

---

## Outputs

- Source code
- Pull requests
- Implementation artifacts

---

# QA Agent

## Responsibilities

- Test generation
- Validation
- Requirement verification

---

## Outputs

- Test plans
- Test reports
- Defect reports

---

# Release Agent

## Responsibilities

- Deployment preparation
- Release validation
- Deployment execution

---

## Outputs

- Release artifacts
- Deployment records

---

# Persona Priority Matrix

| Persona | Priority | MVP |
|----------|----------|----------|
| Founder | Critical | Yes |
| Product Manager | Critical | Yes |
| Software Engineer | Critical | Yes |
| Organization Owner | Critical | Yes |
| Workspace Administrator | High | Yes |
| QA Engineer | High | Yes |
| Designer | Medium | Later |
| Engineering Manager | Medium | Later |
| Product End User | Medium | Later |
| Enterprise Administrator | Future | No |
| Compliance Officer | Future | No |
| Security Reviewer | Future | No |

---

# Initial MVP Focus

The MVP should optimize for:

1. Founder
2. Product Manager
3. Software Engineer

These three personas represent the majority of early adopters and provide the strongest signal for product-market fit.

All MVP workflows should be evaluated against their ability to help these personas move software from idea to verified implementation faster and with higher confidence.
