import { SetMetadata, createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser, UserRole } from "@coffee-order/contracts";
import type { RequestWithId } from "../../common/middleware/request-id.middleware";

/** Danh dau route cong khai: AuthGuard bo qua, khong can Bearer token. */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

/** Role toi thieu duoc phep. RolesGuard doc metadata nay. */
export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

/** Khoa gan AuthenticatedUser vao request sau khi AuthGuard xac minh. */
export const AUTH_USER_KEY = "authUser";

export interface RequestWithUser extends RequestWithId {
  [AUTH_USER_KEY]?: AuthenticatedUser;
}

/** Lay nguoi dung da xac thuc trong controller: @CurrentUser(). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = req[AUTH_USER_KEY];
    if (!user) {
      // Khong nen xay ra: AuthGuard chay truoc va luon gan user cho route bao ve.
      throw new Error("CurrentUser dung tren route chua qua AuthGuard.");
    }
    return user;
  },
);
