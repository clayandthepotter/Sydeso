"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page">
      <h1 className="display">The API did not answer.</h1>
      <p className="muted">{error.message}</p>
      <p className="mono-text muted">
        The web app reads from the Sydeso API at <code>SYDESO_API_URL</code>. Check that the API is running and reachable
        from this server.
      </p>
      <div className="form__row">
        <button className="btn" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
