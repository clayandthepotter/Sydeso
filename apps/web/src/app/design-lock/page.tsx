import type { Metadata } from "next";

import { DesignLockGenerator } from "../../components/design-lock-generator";

export const metadata: Metadata = {
  title: "Sydeso | Design Lock Generator",
  description:
    "Generate a Sydeso design lock artifact that defines tone, tokens, components, and QA rules for a project UI system.",
};

export default function DesignLockPage() {
  return (
    <div className="marketing-page">
      <header className="site-header" aria-label="Sydeso design lock navigation">
        <a className="wordmark" href="/" aria-label="Sydeso home">
          <span className="wordmark-mark" aria-hidden="true" />
          Sydeso
        </a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="/">Home</a>
          <a href="/#waitlist">Waitlist</a>
          <a href="/#design-lock">Brand guide</a>
        </nav>
      </header>

      <section className="hero-section generator-hero" id="top">
        <div className="hero-copy">
          <div className="launch-badge">
            <span aria-hidden="true" /> Design lock generator
          </div>
          <h1>Create the visual system before the project starts.</h1>
          <p>
            Sydeso can generate a project-specific design guide that sets tone, tokens, motion, and governance rules
            before the team builds a screen.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="/#waitlist">
              Join the waitlist
            </a>
            <a className="secondary-link" href="/">
              Back home
            </a>
          </div>
        </div>

        <article className="preview-card" aria-label="Design lock summary">
          <div className="preview-header">
            <span>Artifact source of truth</span>
            <strong>Versioned</strong>
          </div>
          <div className="preview-body">
            <span className="preview-label">What it controls</span>
            <h3>Tone, tokens, components, motion, and QA expectations.</h3>
            <p>One guide keeps the marketing site, product UI, and future project work aligned.</p>
          </div>
          <div className="preview-grid" aria-hidden="true">
            {[
              ["Brand", "Calm, editorial, precise"],
              ["Tokens", "Color, type, spacing"],
              ["Components", "Buttons, cards, inputs"],
              ["Governance", "Approval and QA"],
            ].map(([label, value]) => (
              <div className="preview-tile" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="platform-section" aria-labelledby="generator-title">
        <div className="section-heading">
          <span className="eyebrow">Generator</span>
          <h2 id="generator-title">Tune the project tone and export a design lock artifact.</h2>
        </div>
        <DesignLockGenerator />
      </section>
    </div>
  );
}
