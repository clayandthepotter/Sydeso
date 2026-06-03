"use client";

import { useMemo, useState } from "react";

const productOptions = [
  {
    value: "workflow-app",
    label: "Workflow app",
    description: "Dense product surfaces with strong hierarchy and high trust.",
  },
  {
    value: "marketing-site",
    label: "Marketing site",
    description: "Editorial storytelling with generous spacing and crisp calls to action.",
  },
  {
    value: "customer-portal",
    label: "Customer portal",
    description: "Structured account management with clear states and calm surfaces.",
  },
] as const;

const toneOptions = [
  {
    value: "calm",
    label: "Calm editorial",
    description: "Measured, readable, and high trust.",
  },
  {
    value: "precise",
    label: "Precise product",
    description: "Sharp hierarchy and practical clarity.",
  },
  {
    value: "minimal",
    label: "Minimal system",
    description: "Quiet surfaces with little visual noise.",
  },
] as const;

const densityOptions = [
  {
    value: "compact",
    label: "Compact",
    description: "Tight rhythm and efficient information density.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Comfortable spacing with strong structure.",
  },
  {
    value: "spacious",
    label: "Spacious",
    description: "More breathing room for premium storytelling.",
  },
] as const;

const accentOptions = [
  {
    value: "blue",
    label: "Blue",
    hex: "#4c67f0",
  },
  {
    value: "slate",
    label: "Slate",
    hex: "#42526e",
  },
  {
    value: "violet",
    label: "Violet",
    hex: "#7e6bff",
  },
  {
    value: "green",
    label: "Green",
    hex: "#0e7b57",
  },
] as const;

const motionOptions = [
  {
    value: "subtle",
    label: "Subtle",
    duration: "120-160ms",
  },
  {
    value: "standard",
    label: "Standard",
    duration: "160-200ms",
  },
  {
    value: "deliberate",
    label: "Deliberate",
    duration: "200-240ms",
  },
] as const;

type GeneratorState = {
  product: (typeof productOptions)[number]["value"];
  tone: (typeof toneOptions)[number]["value"];
  density: (typeof densityOptions)[number]["value"];
  accent: (typeof accentOptions)[number]["value"];
  motion: (typeof motionOptions)[number]["value"];
};

const defaultState: GeneratorState = {
  product: "workflow-app",
  tone: "calm",
  density: "balanced",
  accent: "blue",
  motion: "standard",
};

function getOption<T extends { value: string }>(collection: readonly T[], value: string) {
  return collection.find(option => option.value === value) ?? collection[0];
}

function SelectField<T extends { value: string; label: string }>({
  label,
  value,
  options,
  helper,
  onChange,
}: {
  label: string;
  value: T["value"];
  options: readonly T[];
  helper: string;
  onChange: (value: T["value"]) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={event => onChange(event.target.value as T["value"]) }>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="generator-help">{helper}</span>
    </label>
  );
}

function buildGuide(state: GeneratorState) {
  const product = getOption(productOptions, state.product);
  const tone = getOption(toneOptions, state.tone);
  const density = getOption(densityOptions, state.density);
  const accent = getOption(accentOptions, state.accent);
  const motion = getOption(motionOptions, state.motion);

  return `# ${product.label} Design Lock

## Visual intent

${product.description}

Tone: ${tone.label}
Density: ${density.label}
Accent: ${accent.label} (${accent.hex})
Motion: ${motion.duration}

## Foundation

- Use neutral surfaces with one accent color.
- Keep borders visible and shadows restrained.
- Preserve a calm editorial hierarchy.

## Layout

- Use a predictable grid and clear section rhythm.
- Prefer compact surfaces for dense product work.
- Leave enough whitespace for high-priority content.

## Components

- Buttons should be crisp and low-noise.
- Cards should feel like organized notes.
- Inputs should be legible, calm, and accessible.

## Motion

- Use ${motion.duration} transitions for hover and focus states.
- Keep movement subtle and functional.

## Governance

- Version the guide as an immutable artifact.
- Use it for design approval, implementation, and QA.
- Update the guide when the visual system changes.`;
}

export function DesignLockGenerator() {
  const [state, setState] = useState<GeneratorState>(defaultState);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const guide = useMemo(() => buildGuide(state), [state]);

  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(guide);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="generator-layout">
      <div className="waitlist-form generator-controls" aria-label="Design lock inputs">
        <div className="form-header">
          <span>Guide inputs</span>
          <strong>Shape the visual lock</strong>
        </div>

        <SelectField
          label="Product"
          value={state.product}
          options={productOptions}
          helper={getOption(productOptions, state.product).description}
          onChange={value => setState(previous => ({ ...previous, product: value }))}
        />
        <SelectField
          label="Tone"
          value={state.tone}
          options={toneOptions}
          helper={getOption(toneOptions, state.tone).description}
          onChange={value => setState(previous => ({ ...previous, tone: value }))}
        />
        <SelectField
          label="Density"
          value={state.density}
          options={densityOptions}
          helper={getOption(densityOptions, state.density).description}
          onChange={value => setState(previous => ({ ...previous, density: value }))}
        />
        <SelectField
          label="Accent"
          value={state.accent}
          options={accentOptions}
          helper={`${getOption(accentOptions, state.accent).label} accent token`}
          onChange={value => setState(previous => ({ ...previous, accent: value }))}
        />
        <SelectField
          label="Motion"
          value={state.motion}
          options={motionOptions}
          helper={`${getOption(motionOptions, state.motion).duration} interaction range`}
          onChange={value => setState(previous => ({ ...previous, motion: value }))}
        />
      </div>

      <article className="design-card generator-preview" aria-label="Generated design lock preview">
        <span>Generated artifact</span>
        <h3>{getOption(productOptions, state.product).label} design guide</h3>
        <p>{getOption(productOptions, state.product).description}</p>
        <textarea className="generated-guide" readOnly value={guide} aria-label="Generated design lock markdown" />
        <div className="generator-actions">
          <button className="secondary-link" type="button" onClick={copyGuide}>
            Copy guide
          </button>
          <p aria-live="polite">{copyState === "copied" ? "Copied to clipboard." : copyState === "error" ? "Copy failed." : "Ready to paste into a project artifact."}</p>
        </div>
      </article>
    </div>
  );
}
