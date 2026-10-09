/**
 * Bien moi truong duoc phep xuat hien o browser.
 *
 * Chi bien co tien to NEXT_PUBLIC_ moi di ra bundle client. Tuyet doi khong dat
 * DATABASE_URL hay service-role key vao NEXT_PUBLIC_ (xem .kiro/steering/tech.md).
 *
 * File nay doc bien o thoi diem module duoc nap. Next thay the gia tri
 * process.env.NEXT_PUBLIC_* ngay luc build nen khong doc duoc dong tu runtime.
 */

function required(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Thieu bien moi truong ${name}. Xem apps/web/.env.example va tao .env.local.`,
    );
  }
  return value.trim();
}

/** Base URL cua API NestJS, vi du http://localhost:3001/v1 */
export const API_BASE_URL = required(
  "NEXT_PUBLIC_API_BASE_URL",
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/v1",
);
