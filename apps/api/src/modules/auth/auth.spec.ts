import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { ApiErrorCode, type AuthenticatedUser } from "@coffee-order/contracts";
import { SignJWT } from "jose";
import { loadAppConfig } from "../../common/config/app-config";
import { RolesGuard } from "./roles.guard";
import { TokenVerifierService } from "./token-verifier.service";
import { AUTH_USER_KEY, ROLES_KEY } from "./auth.decorators";

const SECRET = "test-secret-chi-dung-trong-unit-test-khong-phai-production";
const ISSUER = "https://demo.supabase.co/auth/v1";

function hs256Config() {
  return loadAppConfig({
    SUPABASE_JWT_SECRET: SECRET,
    SUPABASE_JWT_ISSUER: ISSUER,
    SUPABASE_JWT_AUDIENCE: "authenticated",
  } as NodeJS.ProcessEnv);
}

async function makeToken(opts: {
  sub?: string;
  secret?: string;
  issuer?: string;
  audience?: string;
  expInPast?: boolean;
  email?: string;
}): Promise<string> {
  const key = new TextEncoder().encode(opts.secret ?? SECRET);
  const builder = new SignJWT({ email: opts.email ?? "u@demo.test" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(opts.sub ?? "11111111-1111-1111-1111-111111111111")
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? "authenticated")
    .setIssuedAt();
  builder.setExpirationTime(opts.expInPast ? Math.floor(Date.now() / 1000) - 60 : "1h");
  return builder.sign(key);
}

/* ------------------------------------------------------------------ */
/* Config Supabase                                                     */
/* ------------------------------------------------------------------ */
describe("auth config", () => {
  it("auth.configured=false khi khong co SUPABASE_URL va khong co secret", () => {
    const c = loadAppConfig({} as NodeJS.ProcessEnv);
    expect(c.auth.configured).toBe(false);
    expect(c.auth.jwtAudience).toBe("authenticated");
  });

  it("suy ra issuer tu SUPABASE_URL khi khong khai rieng", () => {
    const c = loadAppConfig({ SUPABASE_URL: "https://abc.supabase.co/" } as NodeJS.ProcessEnv);
    expect(c.auth.supabaseUrl).toBe("https://abc.supabase.co");
    expect(c.auth.jwtIssuer).toBe("https://abc.supabase.co/auth/v1");
    expect(c.auth.configured).toBe(true);
  });

  it("configured=true khi chi co secret HS256", () => {
    const c = loadAppConfig({ SUPABASE_JWT_SECRET: "x" } as NodeJS.ProcessEnv);
    expect(c.auth.configured).toBe(true);
    expect(c.auth.jwtSecretConfigured).toBe(true);
  });

  it("khong luu gia tri secret vao config", () => {
    const c = loadAppConfig({ SUPABASE_JWT_SECRET: SECRET } as NodeJS.ProcessEnv);
    expect(JSON.stringify(c)).not.toContain(SECRET);
  });
});

/* ------------------------------------------------------------------ */
/* Xac minh token (HS256)                                              */
/* ------------------------------------------------------------------ */
describe("TokenVerifierService (HS256)", () => {
  const prevSecret = process.env.SUPABASE_JWT_SECRET;
  let verifier: TokenVerifierService;

  beforeAll(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
    verifier = new TokenVerifierService(hs256Config());
  });
  afterAll(() => {
    if (prevSecret === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = prevSecret;
  });

  it("token hop le -> tra sub va email", async () => {
    const token = await makeToken({ sub: "22222222-2222-2222-2222-222222222222" });
    const res = await verifier.verify(token);
    expect(res.sub).toBe("22222222-2222-2222-2222-222222222222");
    expect(res.email).toBe("u@demo.test");
  });

  it("token het han -> UnauthorizedException", async () => {
    const token = await makeToken({ expInPast: true });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("token ky bang secret khac -> tu choi (sai chu ky)", async () => {
    const token = await makeToken({ secret: "secret-gia-mao" });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("token sai audience -> tu choi", async () => {
    const token = await makeToken({ audience: "khac" });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("token sai issuer -> tu choi", async () => {
    const token = await makeToken({ issuer: "https://ke-gia-mao.example/auth/v1" });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("chuoi khong phai JWT -> tu choi", async () => {
    await expect(verifier.verify("khong-phai-jwt")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

/* ------------------------------------------------------------------ */
/* RolesGuard                                                          */
/* ------------------------------------------------------------------ */
describe("RolesGuard", () => {
  function ctx(user: AuthenticatedUser | undefined, roles: string[] | undefined) {
    const reflector = {
      getAllAndOverride: (key: string) => (key === ROLES_KEY ? roles : undefined),
    };
    const request = { [AUTH_USER_KEY]: user } as Record<string, unknown>;
    const execCtx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    };
    return { guard: new RolesGuard(reflector as never), execCtx: execCtx as never };
  }

  const admin: AuthenticatedUser = { id: "a", role: "ADMIN", isActive: true, email: null };
  const customer: AuthenticatedUser = { id: "c", role: "CUSTOMER", isActive: true, email: null };

  it("cho qua khi route khong khai @Roles", () => {
    const { guard, execCtx } = ctx(customer, undefined);
    expect(guard.canActivate(execCtx)).toBe(true);
  });

  it("ADMIN qua duoc route yeu cau ADMIN", () => {
    const { guard, execCtx } = ctx(admin, ["ADMIN"]);
    expect(guard.canActivate(execCtx)).toBe(true);
  });

  it("CUSTOMER goi route ADMIN -> ForbiddenException (FORBIDDEN)", () => {
    const { guard, execCtx } = ctx(customer, ["ADMIN"]);
    try {
      guard.canActivate(execCtx);
      throw new Error("dang le phai nem");
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect((e as ForbiddenException).getResponse()).toMatchObject({
        code: ApiErrorCode.FORBIDDEN,
      });
    }
  });
});
