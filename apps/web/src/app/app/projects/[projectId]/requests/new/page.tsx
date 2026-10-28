import { RequestForm } from "../../../../../../components/forms";
import { api } from "../../../../../../lib/api";

export const metadata = { title: "New request" };

export default async function NewRequestPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await api.getProject(projectId);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">New request</h1>
        </div>
      </div>
      <section className="panel panel--form">
        <div className="panel__body">
          <RequestForm projectId={projectId} repositoryMissing={!project.repositoryUrl} />
        </div>
      </section>
    </>
  );
}
