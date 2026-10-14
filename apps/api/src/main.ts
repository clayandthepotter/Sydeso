import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";

import { AppModule } from "./modules/app.module";

async function bootstrap() {
  // Body parsing is registered here so artifact uploads can receive raw bytes of any content type.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const maxUpload = Number(process.env.STORAGE_MAX_UPLOAD_BYTES ?? 50 * 1024 * 1024);

  // Express only honours a path-mounted middleware when the match is a URL prefix, so the
  // upload routes are picked out by suffix here and handed the raw body parser directly.
  const rawParser = express.raw({ type: () => true, limit: maxUpload });
  const isUpload = (path: string) => path.endsWith("/artifacts/upload");
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) =>
    isUpload(request.path) ? rawParser(request, response, next) : next(),
  );
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "5mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.setGlobalPrefix("api/v1");

  // Browsers only reach the API through the web app's origin; everything else uses bearer tokens.
  const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map(origin => origin.trim());
  app.enableCors({ origin: origins, credentials: true });

  // Bind every interface explicitly so container port checks reach the process over IPv4.
  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}

void bootstrap();
