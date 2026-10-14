import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /** Connect eagerly when possible; if the database is unreachable the process still comes up and Prisma connects lazily on first use. */
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(`Database not reachable at startup: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
