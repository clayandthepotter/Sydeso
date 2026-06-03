"use client";

import { useState, type FormEvent } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const waitlistUrl = configuredApiUrl ? `${configuredApiUrl}/waitlist` : "/api/waitlist";

export function WaitlistForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmissionState("submitting");
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      role: String(formData.get("role") ?? ""),
      useCase: String(formData.get("useCase") ?? ""),
    };

    try {
      const response = await fetch(waitlistUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Waitlist request failed");
      }

      setSubmissionState("success");
      setMessage("You are on the list. We will reach out as private beta slots open.");
      form.reset();
    } catch {
      setSubmissionState("error");
      setMessage("We could not save your request. Please try again in a moment.");
    }
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit} aria-label="Join the Sydeso waitlist">
      <div className="form-header">
        <span>Early access</span>
        <strong>Reserve your spot</strong>
      </div>

      <label>
        Work email
        <input name="email" type="email" placeholder="you@company.com" required autoComplete="email" />
      </label>

      <label>
        Name
        <input name="name" type="text" placeholder="Your name" autoComplete="name" />
      </label>

      <label>
        Role
        <select name="role" defaultValue="">
          <option value="" disabled>
            Select your role
          </option>
          <option value="founder">Founder</option>
          <option value="agency">Agency operator</option>
          <option value="product">Product lead</option>
          <option value="engineering">Engineering leader</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label>
        What would you automate first?
        <textarea
          name="useCase"
          rows={4}
          placeholder="Describe the software workflow you want Sydeso to run."
        />
      </label>

      <button type="submit" disabled={submissionState === "submitting"}>
        {submissionState === "submitting" ? "Joining..." : "Join waitlist"}
      </button>

      <p className={`form-message ${submissionState}`} aria-live="polite">
        {message || "No spam. Just product updates and beta invitations."}
      </p>
    </form>
  );
}
