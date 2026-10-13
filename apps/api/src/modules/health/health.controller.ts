import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/decorators";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return { status: "ok", service: "sydeso-api" };
  }
}
