import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiErrorCode } from "@coffee-order/contracts";
import { AuthService } from "./auth.service";
import { AUTH_USER_KEY, IS_PUBLIC_KEY, type RequestWithUser } from "./auth.decorators";
import { TokenVerifierService } from "./token-verifier.service";

/**
 * Guard xac thuc global.
 *
 * - Route gan @Public() -> cho qua, khong doc token.
 * - Route con lai -> bat buoc Authorization: Bearer <token>. Xac minh chu ky/
 *   issuer/audience/expiry (TokenVerifierService), map sub -> profile
 *   (AuthService) roi gan vao req[AUTH_USER_KEY].
 *
 * Khong log token. Loi -> 401 UNAUTHENTICATED qua AllExceptionsFilter.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenVerifier: TokenVerifierService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearer(req.header("authorization"));
    if (!token) {
      throw new UnauthorizedException({
        code: ApiErrorCode.UNAUTHENTICATED,
        message: "Thieu token xac thuc.",
      });
    }

    const verified = await this.tokenVerifier.verify(token);
    req[AUTH_USER_KEY] = await this.authService.resolveUser(verified);
    return true;
  }

  private extractBearer(header: string | undefined): string | null {
    if (!header) return null;
    const [scheme, value] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
    return value.trim() || null;
  }
}
