import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodIssue, ZodSchema, ZodTypeDef } from "zod";

/**
 * Validates a request body against a zod schema from @sydeso/api-contracts and returns
 * the parsed value. Failures become a 400 whose `details` lists each field problem,
 * in the shape HttpExceptionFilter passes through.
 */
export class ZodValidationPipe<Output, Input = Output> implements PipeTransform<unknown, Output> {
  constructor(private readonly schema: ZodSchema<Output, ZodTypeDef, Input>) {}

  transform(value: unknown): Output {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      message: "Validation failed",
      details: result.error.issues.map((issue: ZodIssue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
}
