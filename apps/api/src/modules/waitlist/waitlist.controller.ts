import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { waitlistSignupSchema } from "@sydeso/api-contracts";

import { Public } from "../auth/decorators";
import { WaitlistService } from "./waitlist.service";

@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Public()
  @Post()
  async join(@Body() body: unknown) {
    const result = waitlistSignupSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException("Valid waitlist signup details are required");
    }

    const lead = await this.waitlist.join(result.data);

    return {
      status: "joined",
      lead,
    };
  }
}
