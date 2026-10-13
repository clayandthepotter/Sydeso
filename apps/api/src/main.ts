import { NestFactory } from "@nestjs/core";

import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");

  // Browsers only reach the API through the web app's origin; everything else uses bearer tokens.
  const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map(origin => origin.trim());
  app.enableCors({ origin: origins, credentials: true });

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
