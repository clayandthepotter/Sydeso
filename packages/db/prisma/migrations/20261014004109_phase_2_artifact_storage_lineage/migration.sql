-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "producedByJobId" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "sourceArtifactIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Artifact_producedByJobId_idx" ON "Artifact"("producedByJobId");

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_producedByJobId_fkey" FOREIGN KEY ("producedByJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Artifacts are the system of record: a row is never changed after it is written.
-- A new version is a new row. Rows may still be removed with their project or organization.
CREATE OR REPLACE FUNCTION artifacts_are_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'artifacts are immutable: artifact % cannot be updated', OLD.id
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artifact_immutable
  BEFORE UPDATE ON "Artifact"
  FOR EACH ROW EXECUTE FUNCTION artifacts_are_immutable();
