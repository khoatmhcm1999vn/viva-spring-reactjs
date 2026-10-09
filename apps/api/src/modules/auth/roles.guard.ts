import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiErrorCode, type UserRole } from "@coffee-order/contracts";
import { AUTH_USER_KEY, ROLES_KEY, type RequestWithUser } from "./auth.decorators";

/**
 * Kiem role toi thieu khai bang @Roles(). Chay sau AuthGuard.
 *
 * Day la lop UX/route-level. Quyen nghiep vu theo tai nguyen (chu don, staff
 * dung store) van phai kiem o SERVICE de khong bi bypass qua internal call
 * (xem StoreAccessService + kiem o tung service tu buoc 06+).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req[AUTH_USER_KEY];
    // AuthGuard chay truoc nen user phai co; neu khong, coi nhu chua xac thuc.
    if (!user) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: "Khong du quyen truy cap.",
      });
    }

    if (!required.includes(user.role)) {
      // 403 khong tiet lo PII; chi noi khong du quyen.
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: "Khong du quyen truy cap.",
      });
    }
    return true;
  }
}
