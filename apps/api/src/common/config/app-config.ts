/**
 * Doc va kiem tra bien moi truong mot lan khi khoi dong.
 *
 * Nguyen tac:
 *  - Fail fast khi gia tri sai dinh dang, de khong chay voi cau hinh nua voi.
 *  - KHONG bao gio log gia tri secret. Chi log ten bien va trang thai da/chua dat.
 *  - DATABASE_URL chi duoc doc o day; viec dung no bat dau tu buoc 04.
 */

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  corsOrigins: string[];
  /** true khi DATABASE_URL da duoc dat. Khong luu gia tri thuc o config nay. */
  databaseConfigured: boolean;
  serviceName: string;
  serviceVersion: string;

  /**
   * Cau hinh xac thuc Supabase.
   *
   * supabaseUrl / jwtIssuer / jwtAudience khong phai secret -> luu truc tiep.
   * JWT SECRET (HS256) la secret -> KHONG luu gia tri o day, chi giu co
   * `jwtSecretConfigured`; gia tri doc truc tiep tu process.env tai cho dung,
   * giong cach PrismaService doc DATABASE_URL.
   */
  auth: {
    /** true khi du cau hinh de xac minh token (co URL de lay JWKS, hoac co secret). */
    configured: boolean;
    /** Vi du https://<ref>.supabase.co ; dung de suy ra JWKS + issuer mac dinh. */
    supabaseUrl: string | null;
    /** iss ky vong trong token. Mac dinh <supabaseUrl>/auth/v1 neu khong khai rieng. */
    jwtIssuer: string | null;
    /** aud ky vong, mac dinh "authenticated". */
    jwtAudience: string;
    /** true khi SUPABASE_JWT_SECRET duoc dat (ho tro token HS256 legacy). */
    jwtSecretConfigured: boolean;
  };
}

function parseNodeEnv(raw: string | undefined): AppConfig["nodeEnv"] {
  if (raw === "production" || raw === "test" || raw === "development") return raw;
  if (raw === undefined || raw === "") return "development";
  throw new Error(
    `NODE_ENV khong hop le: "${raw}". Chi nhan development | test | production.`,
  );
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 3001;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`PORT khong hop le: "${raw}". Can so nguyen trong 1..65535.`);
  }
  return n;
}

/**
 * CORS allowlist doc tu env, phan tach bang dau phay.
 * Khong dung wildcard "*" vi API se nhan Authorization header.
 */
function parseCorsOrigins(raw: string | undefined): string[] {
  const fallback = ["http://localhost:3000"];
  if (raw === undefined || raw.trim() === "") return fallback;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (list.includes("*")) {
    throw new Error(
      'CORS_ORIGINS khong duoc chua "*": API nhan Authorization header nen can allowlist cu the.',
    );
  }
  for (const origin of list) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGINS chua origin khong hop le: "${origin}".`);
    }
  }
  return list.length > 0 ? list : fallback;
}

/** Chuan hoa URL Supabase: bo dau "/" cuoi. Tra null khi rong. */
function parseSupabaseUrl(raw: string | undefined): string | null {
  if (raw === undefined || raw.trim() === "") return null;
  const value = raw.trim();
  try {
    new URL(value);
  } catch {
    throw new Error(`SUPABASE_URL khong hop le: "${value}".`);
  }
  return value.replace(/\/+$/, "");
}

function parseAuthConfig(env: NodeJS.ProcessEnv): AppConfig["auth"] {
  const supabaseUrl = parseSupabaseUrl(env.SUPABASE_URL);

  // issuer: uu tien khai tuong minh; neu khong, suy ra tu supabaseUrl.
  const explicitIssuer = env.SUPABASE_JWT_ISSUER?.trim();
  if (explicitIssuer) {
    try {
      new URL(explicitIssuer);
    } catch {
      throw new Error(`SUPABASE_JWT_ISSUER khong hop le: "${explicitIssuer}".`);
    }
  }
  const jwtIssuer = explicitIssuer || (supabaseUrl ? `${supabaseUrl}/auth/v1` : null);

  const jwtAudience = env.SUPABASE_JWT_AUDIENCE?.trim() || "authenticated";
  const jwtSecretConfigured =
    typeof env.SUPABASE_JWT_SECRET === "string" && env.SUPABASE_JWT_SECRET.trim().length > 0;

  // Du cau hinh de xac minh khi co supabaseUrl (lay JWKS cho ES256/RS256) hoac
  // co secret (HS256 legacy).
  const configured = supabaseUrl !== null || jwtSecretConfigured;

  return { configured, supabaseUrl, jwtIssuer, jwtAudience, jwtSecretConfigured };
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    port: parsePort(env.PORT),
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    databaseConfigured:
      typeof env.DATABASE_URL === "string" && env.DATABASE_URL.trim().length > 0,
    serviceName: "coffee-order-api",
    serviceVersion: env.APP_VERSION?.trim() || "0.1.0",
    auth: parseAuthConfig(env),
  };
}

export const APP_CONFIG = "APP_CONFIG";
