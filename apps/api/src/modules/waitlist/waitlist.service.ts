import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async join(input: { email: string; name?: string; role?: string; useCase?: string }) {
    const email = input.email.toLowerCase();

    return this.prisma.waitlistLead.upsert({
      where: { email },
      create: {
        email,
        name: normalizeOptional(input.name),
        role: normalizeOptional(input.role),
        useCase: normalizeOptional(input.useCase),
      },
      update: {
        name: normalizeOptional(input.name),
        role: normalizeOptional(input.role),
        useCase: normalizeOptional(input.useCase),
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
