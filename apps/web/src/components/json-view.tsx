export function JsonView({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="muted">No inline content.</p>;
  }
  return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
}
