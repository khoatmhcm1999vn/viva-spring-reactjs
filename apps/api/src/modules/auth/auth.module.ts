import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./roles.guard";
import { StoreAccessService } from "./store-access.service";
import { TokenVerifierService } from "./token-verifier.service";

/**
 * Module xac thuc + phan quyen.
 *
 * AuthGuard roi RolesGuard duoc dang ky GLOBAL qua APP_GUARD: moi route mac dinh
 * yeu cau xac thuc, tru route gan @Public(). Thu tu khai bao = thu tu chay, nen
 * AuthGuard (gan req.user) chay truoc RolesGuard (doc req.user).
 *
 * @Global de StoreAccessService dung duoc o moi module nghiep vu tu buoc 06.
 */
@Global()
@Module({
  providers: [
    TokenVerifierService,
    AuthService,
    StoreAccessService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [TokenVerifierService, AuthService, StoreAccessService],
})
export class AuthModule {}
