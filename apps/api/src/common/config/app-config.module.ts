import { Global, Module } from "@nestjs/common";
import { APP_CONFIG, loadAppConfig } from "./app-config";

/**
 * Cung cap AppConfig cho toan bo ung dung.
 *
 * Dat @Global de cac module nghiep vu khong phai import lai; config duoc doc
 * va kiem tra dung mot lan khi khoi dong (fail fast neu env sai dinh dang).
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => loadAppConfig(),
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
