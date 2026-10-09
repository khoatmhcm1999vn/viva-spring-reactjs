import { randomInt } from "node:crypto";

/**
 * Sinh ma don de doc cho khach (Q01-04 chot o day).
 *
 * Dinh dang: CF-YYMMDD-XXXX
 *  - CF: tien to san pham.
 *  - YYMMDD: ngay tao theo gio Viet Nam (de nhan vien doi chieu trong ngay).
 *  - XXXX: 4 ky tu tu bo chu Crockford-base32 bo cac ky tu de nham (I,L,O,U),
 *    sinh bang crypto.randomInt nen khong doan tuan tu duoc.
 *
 * Ma nay KHONG phai secret cap quyen (REQ-502): biet ma khong xem duoc don.
 * ID noi bo van la UUID. Unique duoc bao dam boi UNIQUE(orders.code) + retry.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function yymmddHcm(now: Date): string {
  // Lay ngay theo Asia/Ho_Chi_Minh (UTC+7, khong co DST).
  const hcm = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(hcm.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(hcm.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(hcm.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function generateOrderCode(now: Date = new Date()): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `CF-${yymmddHcm(now)}-${suffix}`;
}
