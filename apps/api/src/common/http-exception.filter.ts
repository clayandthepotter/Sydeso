import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Every error leaves the API in one shape: { statusCode, error, message, details? }.
 * Known Prisma failures map to the matching HTTP status; anything else is a 500 with
 * the detail kept in the server log rather than the response.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    }

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const payload = typeof raw === "string" ? { message: raw } : (raw as Record<string, unknown>);
      const message = payload.message;

      return {
        statusCode: status,
        error: HttpStatus[status] ?? "Error",
        message: Array.isArray(message) ? message.join(", ") : String(message ?? exception.message),
        ...(payload.details !== undefined ? { details: payload.details } : {}),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        const target = (exception.meta?.target as string[] | undefined)?.join(", ");
        return {
          statusCode: HttpStatus.CONFLICT,
          error: "Conflict",
          message: target ? `A record with the same ${target} already exists` : "A matching record already exists",
        };
      }

      if (exception.code === "P2025") {
        return { statusCode: HttpStatus.NOT_FOUND, error: "Not Found", message: "Record not found" };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: "Something went wrong",
    };
  }
}
