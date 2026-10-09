import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { APP_CONFIG, type AppConfig } from "./common/config/app-config";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get<AppConfig>(APP_CONFIG);
  const logger = new Logger("bootstrap");

  // Moi route nam duoi /v1. Swagger duoc mount rieng o /docs.
  app.setGlobalPrefix("v1");

  // Whitelist + forbidNonWhitelisted: truong la trong body bi tu choi thay vi bi bo qua.
  // Day la tang validation runtime duy nhat cho DTO backend (xem tech.md).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS allowlist lay tu env, khong dung wildcard vi API nhan Authorization header.
  app.enableCors({
    origin: config.corsOrigins,
    credentials: false,
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    maxAge: 600,
  });

  const swagger = new DocumentBuilder()
    .setTitle("Coffee Order API")
    .setDescription(
      "REST API cho web dat ca phe. Tien la integer VND, thoi gian ISO 8601. " +
        "Du lieu demo la du lieu gia.",
    )
    .setVersion(config.serviceVersion)
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "supabase-access-token",
    )
    // Khong goi .addServer("/v1"): setGlobalPrefix da dua /v1 vao tung path,
    // them server /v1 nua se lam "Try it out" goi /v1/v1/...
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port, "0.0.0.0");

  // Chi log ten bien va trang thai cau hinh, khong log gia tri secret.
  logger.log(`env=${config.nodeEnv} port=${config.port}`);
  logger.log(`cors allowlist: ${config.corsOrigins.join(", ")}`);
  logger.log(
    `DATABASE_URL: ${config.databaseConfigured ? "da dat" : "chua dat - /v1/ready se tra NOT_READY"}`,
  );
  logger.log(`health=/v1/health ready=/v1/ready docs=/docs`);
}

void bootstrap();
