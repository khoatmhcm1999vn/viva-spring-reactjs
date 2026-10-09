import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Cau hinh Prisma 7.
 *
 * Prisma 7 bo `url` khoi datasource trong schema; connection URL cho Migrate/CLI
 * khai o day qua env(). Client runtime dung driver adapter rieng (xem
 * src/prisma/prisma.service.ts), nen URL khong bi hardcode vao schema.
 *
 * `dotenv/config` nap apps/api/.env khi chay CLI o local. Tren server, bien
 * DATABASE_URL do moi truong chay cap, khong doc tu file.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
