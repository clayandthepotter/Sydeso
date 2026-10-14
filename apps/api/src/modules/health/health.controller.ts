import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/decorators";
import { PrismaService } from "../database/prisma.service";

interface DatabaseHealth {
  ok: boolean;
  /** Prisma error code (P1001 unreachable, P1000 bad credentials, ...) or the error name. */
  code?: string;
  migrationsPending: boolean;
}

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Always answers 200 once the process is up; the body says whether the database is reachable. */
  @Public()
  @Get()
  async getHealth() {
    const database = await this.probeDatabase();
    return { status: database.ok ? "ok" : "degraded", service: "sydeso-api", database };
  }

  private async probeDatabase(): Promise<DatabaseHealth> {
    const migrationsPending = process.env.SYDESO_MIGRATIONS_PENDING === "1";
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
      return { ok: true, migrationsPending };
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "errorCode" in error && typeof error.errorCode === "string"
          ? error.errorCode
          : typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
            ? error.code
            : error instanceof Error
              ? error.name === "Error"
                ? error.message
                : error.name
              : "unknown";
      return { ok: false, code, migrationsPending };
    }
  }
}
