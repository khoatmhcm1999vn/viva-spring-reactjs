import { Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ApiErrorCode } from "@coffee-order/contracts";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import { APP_CONFIG, type AppConfig } from "../../common/config/app-config";

/** Claim rut gon lay tu Supabase access token sau khi xac minh. */
export interface VerifiedToken {
  /** sub = Supabase user id = profiles.id */
  sub: string;
  email: string | null;
}

function unauthorized(message: string): UnauthorizedException {
  // Code UNAUTHENTICATED de AllExceptionsFilter tra 401 dung envelope.
  return new UnauthorizedException({ code: ApiErrorCode.UNAUTHENTICATED, message });
}

/**
 * Xac minh Supabase access token server-side: KHONG chi decode.
 *
 * Kiem day du: chu ky (signature), issuer, audience, expiry.
 * - Token ES256/RS256 (signing keys moi): xac minh bang public key lay tu JWKS
 *   endpoint cua Supabase (`/auth/v1/.well-known/jwks.json`), cache theo jose.
 * - Token HS256 (legacy JWT secret): xac minh bang secret doc tu
 *   process.env.SUPABASE_JWT_SECRET (chi doc tai cho, khong luu vao config).
 *
 * Khong tu viet crypto; dua vao thu vien `jose`.
 */
@Injectable()
export class TokenVerifierService {
  private readonly logger = new Logger(TokenVerifierService.name);
  private jwks: JWTVerifyGetKey | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get configured(): boolean {
    return this.config.auth.configured;
  }

  private getJwks(): JWTVerifyGetKey {
    if (this.jwks) return this.jwks;
    const url = this.config.auth.supabaseUrl;
    if (!url) {
      throw unauthorized("Xac thuc chua duoc cau hinh.");
    }
    // createRemoteJWKSet tu cache va xoay key; moi lan goi deu dung lai instance.
    this.jwks = createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`));
    return this.jwks;
  }

  async verify(token: string): Promise<VerifiedToken> {
    if (!this.config.auth.configured) {
      throw unauthorized("Xac thuc chua duoc cau hinh.");
    }

    const options = {
      // issuer co the null khi chi cau hinh secret ma khong co URL; khi do bo qua
      // kiem issuer nhung van kiem chu ky + audience + expiry.
      ...(this.config.auth.jwtIssuer ? { issuer: this.config.auth.jwtIssuer } : {}),
      audience: this.config.auth.jwtAudience,
    };

    let payload: JWTPayload;
    try {
      if (this.config.auth.supabaseUrl) {
        // Uu tien asymmetric (ES256/RS256) qua JWKS.
        ({ payload } = await jwtVerify(token, this.getJwks(), options));
      } else {
        // Chi co secret HS256 legacy.
        const secret = process.env.SUPABASE_JWT_SECRET;
        if (!secret) throw unauthorized("Xac thuc chua duoc cau hinh.");
        const key = new TextEncoder().encode(secret);
        ({ payload } = await jwtVerify(token, key, options));
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      // Khong lot noi dung loi crypto ra ngoai; chi log muc debug.
      this.logger.debug(`Token khong hop le: ${err instanceof Error ? err.name : "unknown"}`);
      throw unauthorized("Token khong hop le hoac da het han.");
    }

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) {
      throw unauthorized("Token thieu sub.");
    }

    const email =
      typeof payload.email === "string" ? payload.email : null;

    return { sub, email };
  }
}
