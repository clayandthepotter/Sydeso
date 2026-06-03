import { WaitlistForm } from "../components/waitlist-form";

const workflowSteps = [
  {
    step: "01",
    title: "Idea",
    description: "Capture the software goal, constraints, and desired outcome.",
  },
  {
    step: "02",
    title: "Requirements",
    description: "Turn the idea into explicit goals, scope, and acceptance criteria.",
  },
  {
    step: "03",
    title: "Design",
    description: "Produce the visual and technical guide that directs the build.",
  },
  {
    step: "04",
    title: "Implementation",
    description: "Specialized agents generate code, artifacts, and workflows.",
  },
  {
    step: "05",
    title: "Verification",
    description: "QA, accessibility, and delivery checks validate the output.",
  },
  {
    step: "06",
    title: "Verified software",
    description: "The workflow produces a release-ready result, not just tracked tasks.",
  },
];

const designLockCards = [
  {
    eyebrow: "Feature",
    title: "Design lock is a Sydeso capability.",
    description:
      "Users can generate a comprehensive visual guide that keeps project UI and UX aligned across the delivery workflow.",
    points: ["Visual guide", "Token rules", "Governance"],
  },
  {
    eyebrow: "Output",
    title: "The guide becomes project context.",
    description:
      "It informs implementation, helps teams stay consistent, and creates a durable artifact for future UI work.",
    points: ["Artifact", "Page patterns", "Component rules"],
  },
  {
    eyebrow: "Governance",
    title: "QA and approval use the same source of truth.",
    description:
      "Design compliance is checked against the guide so the product stays aligned from start to finish.",
    points: ["Approval gate", "Developer context", "QA checks"],
  },
];

const guideMetrics = [
  {
    value: "Ideas",
    label: "turned into structured outcomes",
  },
  {
    value: "Agents",
    label: "research, plan, design, and build",
  },
  {
    value: "Verified",
    label: "delivery through QA and approvals",
  },
];

const previewTiles = [
  {
    label: "Project memory",
    value: "Context that persists across work",
  },
  {
    label: "Workflow engine",
    value: "Governed states and transitions",
  },
  {
    label: "Quality",
    value: "Testing, verification, and review",
  },
  {
    label: "Deployment",
    value: "Infrastructure to ship with confidence",
  },
];

export default function Home() {
  return (
    <div className="marketing-page">
      <header className="site-header" aria-label="Sydeso marketing navigation">
        <a className="wordmark" href="#top" aria-label="Sydeso home">
          <span className="wordmark-mark" aria-hidden="true" />
          Sydeso
        </a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="#workflow">Workflow</a>
          <a href="#platform">Platform</a>
          <a href="#design-lock">Design guide</a>
          <a href="#waitlist">Waitlist</a>
        </nav>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <div className="launch-badge">
            <span aria-hidden="true" /> AI-native software delivery platform
          </div>
          <h1>Transform ideas into verified software.</h1>
          <p>
            Sydeso transforms ideas into verified software through structured, agent-driven workflows. Human users
            define goals, requirements, constraints, and approvals while specialized AI agents execute the work.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#waitlist">
              Join the waitlist
            </a>
            <a className="secondary-link" href="#workflow">
              See the workflow
            </a>
          </div>
          <div className="metric-strip" aria-label="Sydeso value proposition metrics">
            {guideMetrics.map(metric => (
              <div key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-card" aria-label="Sydeso design lock preview">
          <div className="preview-header">
            <span>Workflow OS</span>
            <strong>Idea to software</strong>
          </div>
          <div className="preview-body">
            <span className="preview-label">What Sydeso runs</span>
            <h3>Project management, agent orchestration, QA, memory, and deployment in one system.</h3>
            <p>
              Teams manage outcomes, not task lists, while Sydeso coordinates the underlying delivery work through a
              governed workflow.
            </p>
          </div>
          <div className="preview-grid" aria-hidden="true">
            {previewTiles.map(tile => (
              <div className="preview-tile" key={tile.label}>
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
              </div>
            ))}
          </div>
          <p className="preview-note">Design lock is a feature inside the platform, not the platform's headline promise.</p>
        </div>
      </section>

      <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
        <div className="section-heading">
          <span className="eyebrow">Core loop</span>
          <h2 id="workflow-title">Traditional tools track work. Sydeso executes work.</h2>
        </div>
        <div className="workflow-grid" aria-label="Sydeso core workflow">
          {workflowSteps.map(item => (
            <article className="workflow-card" key={item.step}>
              <span>{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="platform-section" id="platform" aria-labelledby="platform-title">
        <div className="section-heading compact">
          <span className="eyebrow">Platform</span>
          <h2 id="platform-title">A unified system for project management, delivery, memory, and verification.</h2>
        </div>
        <div className="capability-grid">
          {[
            {
              title: "Project management",
              description: "Manage goals, requirements, constraints, and approvals in a structured workflow.",
            },
            {
              title: "Agent orchestration",
              description: "Specialized AI agents perform research, planning, design, implementation, and testing.",
            },
            {
              title: "Quality and deployment",
              description: "Verification, QA, and deployment infrastructure close the loop on delivery.",
            },
          ].map(card => (
            <article className="capability-card" key={card.title}>
              <span aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="platform-section" id="design-lock" aria-labelledby="design-lock-title">
        <div className="section-heading compact">
          <span className="eyebrow">Design guide feature</span>
          <h2 id="design-lock-title">Generate a comprehensive UI and visual branding guide for each project.</h2>
        </div>
        <div className="design-grid">
          {designLockCards.map(card => (
            <article className="design-card" key={card.title}>
              <span>{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <ul>
                {card.points.map(point => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="waitlist-section" id="waitlist" aria-labelledby="waitlist-title">
        <div className="waitlist-copy">
          <span className="eyebrow">Private beta</span>
          <h2 id="waitlist-title">Join the teams building the future of AI-native software delivery.</h2>
          <p>
            We are inviting solo founders, agencies, and AI-native engineering teams who want ideas turned into
            verified software through structured, agent-driven workflows.
          </p>
          <div className="metric-strip" aria-label="Sydeso product principles">
            {[
              ["Project", "Goals, requirements, and approvals"],
              ["Agents", "Research, design, implementation, QA"],
              ["Output", "Verified software, not loose tasks"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <WaitlistForm />
      </section>
    </div>
  );
}
