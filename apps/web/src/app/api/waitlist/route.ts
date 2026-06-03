import { PrismaClient } from "@prisma/client";
import { waitlistSignupSchema } from "@sydeso/api-contracts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const globalForPrisma = globalThis as typeof globalThis & {
  sydesoPrisma?: PrismaClient;
};

const prisma = globalForPrisma.sydesoPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.sydesoPrisma = prisma;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = waitlistSignupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Valid waitlist signup details are required" }, { status: 400 });
  }

  const lead = await prisma.waitlistLead.upsert({
    where: { email: result.data.email.toLowerCase() },
    create: {
      email: result.data.email.toLowerCase(),
      name: normalizeOptional(result.data.name),
      role: normalizeOptional(result.data.role),
      useCase: normalizeOptional(result.data.useCase),
    },
    update: {
      name: normalizeOptional(result.data.name),
      role: normalizeOptional(result.data.role),
      useCase: normalizeOptional(result.data.useCase),
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ status: "joined", lead });
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
