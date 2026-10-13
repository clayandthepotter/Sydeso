// Local development seed: one owner account, one organization, workspace, project and feature.
// Run with `pnpm db:seed`. Safe to re-run; every record is upserted by its natural key.
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

const SEED_EMAIL = process.env.SEED_EMAIL ?? "dev@sydeso.local";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "sydeso-dev-password";
const SEED_NAME = process.env.SEED_NAME ?? "Dev Owner";

async function main() {
  const passwordHash = await hash(SEED_PASSWORD, { memoryCost: 19_456, timeCost: 2, parallelism: 1 });

  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { name: SEED_NAME, passwordHash },
    create: { email: SEED_EMAIL, name: SEED_NAME, passwordHash },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "sydeso-dev" },
    update: {},
    create: { name: "Sydeso Dev", slug: "sydeso-dev" },
  });

  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { role: "owner" },
    create: { organizationId: organization.id, userId: user.id, role: "owner" },
  });

  const workspace = await prisma.workspace.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: "platform" } },
    update: {},
    create: { organizationId: organization.id, name: "Platform", slug: "platform" },
  });

  let project = await prisma.project.findFirst({ where: { workspaceId: workspace.id, name: "Sydeso" } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        organizationId: organization.id,
        workspaceId: workspace.id,
        name: "Sydeso",
        repositoryUrl: "https://github.com/clayandthepotter/Sydeso",
        defaultBranch: "main",
      },
    });
  }

  const title = "Seeded feature request";
  let feature = await prisma.feature.findFirst({ where: { projectId: project.id, title } });
  if (!feature) {
    const description = "A feature request created by the development seed so the board is not empty.";
    const content = { title, description };
    feature = await prisma.$transaction(async tx => {
      const created = await tx.feature.create({
        data: { organizationId: organization.id, projectId: project.id, title, description, status: "backlog" },
      });
      const run = await tx.workflowRun.create({
        data: { organizationId: organization.id, featureId: created.id, currentState: "backlog" },
      });
      await tx.artifact.create({
        data: {
          organizationId: organization.id,
          projectId: project.id,
          featureId: created.id,
          workflowRunId: run.id,
          type: "feature_request",
          version: 1,
          title,
          content,
          checksum: createHash("sha256").update(JSON.stringify(content)).digest("hex"),
          createdByType: "user",
          createdById: user.id,
        },
      });
      await tx.workflowTransition.create({
        data: {
          organizationId: organization.id,
          workflowRunId: run.id,
          toState: "backlog",
          triggeredByType: "user",
          triggeredById: user.id,
          reason: "Seeded",
        },
      });
      return created;
    });
  }

  console.log(`Seeded. Sign in as ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  console.log(`Organization ${organization.id}, project ${project.id}, feature ${feature.id}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
