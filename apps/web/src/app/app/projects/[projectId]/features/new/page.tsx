import { FeatureForm } from "../../../../../../components/forms";

export const metadata = { title: "New feature request" };

export default async function NewFeaturePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">New feature request</h1>
          <p className="muted">
            The request is written down as the first artifact of a run. Nothing moves until it exists.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="panel__body">
          <FeatureForm projectId={projectId} />
        </div>
      </section>
    </>
  );
}
