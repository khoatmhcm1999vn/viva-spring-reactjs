# Frontend — @coffee-order/web

Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4. TanStack Query cho server state. Khởi tạo ở bước 03.

## Chạy
```powershell
pnpm --filter @coffee-order/web run dev     # cổng 3000
pnpm --filter @coffee-order/web run build
pnpm --filter @coffee-order/web run start
```
Từ root: `pnpm dev:web`.

Copy `.env.example` thành `.env.local`. API phải chạy ở cổng 3001 để trang `/smoke` gọi được.

## Route hiện có
| Route | Mô tả |
|---|---|
| `/` | Trang chủ tạm, chỗ đặt cho menu (bước 06) |
| `/smoke` | Gọi `GET /v1/health` và `GET /v1/ready` qua TanStack Query. `/ready` trả 503 là **đúng** ở bước 03 vì chưa có DB. |

## Cấu trúc
```
src/
  app/          routes (App Router)
  features/     catalog, cart, checkout, orders — thêm từ bước 06
  lib/env.ts    chỉ đọc biến NEXT_PUBLIC_*
  lib/api.ts    client gọi API, giữ nguyên body lỗi {code,message,details,requestId}
  lib/utils.ts  cn(), formatVnd(), formatDateTimeHcm()
```

## Ranh giới bắt buộc
Mọi biến `NEXT_PUBLIC_*` đều **đi ra bundle client** và người dùng đọc được. Không đặt `DATABASE_URL`, service-role key hay bất kỳ secret nào vào `NEXT_PUBLIC_`. Không import Prisma client/model hay dependency chỉ chạy được trên Node vào đây.

## Xác thực (bước 05)
- `src/lib/supabase.ts` — Supabase browser client (`@supabase/ssr`), `getAccessToken()`, `refreshSessionOnce()`. Chỉ dùng key publishable/anon; không bao giờ đặt secret vào `NEXT_PUBLIC_`.
- `src/lib/api.ts` — tự gắn `Authorization: Bearer <token>` cho request có `auth !== false`; khi API trả 401 thì **refresh phiên đúng một lần** rồi gọi lại, không vòng lặp retry.
- Chưa cấu hình `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` thì client Supabase trả null, request đi mà không có token (phù hợp cho catalog công khai).

## Giỏ hàng (bước 07)
- `src/features/cart/cart-store.ts` — Zustand persist (localStorage), key `coffee-order-cart`, `version: 1`. Lưu `storeId` + `lines` (variantId, size, modifierOptionIds đã sort, modifierLabels, note đã normalize, quantity). **Không** lưu token/PII/giá. Đổi format → `migrate` reset về giỏ rỗng an toàn.
- `lineKey` = variantId + modifier đã sort + note → khác cấu hình là dòng riêng, không gộp. Một giỏ chỉ thuộc một store; thêm món store khác trả `{storeConflict:true}` để UI hỏi `switchStore`.
- `src/features/cart/use-cart-hydrated.ts` — chờ persist rehydrate xong, tránh hydration mismatch.
- `src/features/cart/quote.ts` — `buildQuoteRequest` dựng payload (chính là cart payload mà POST /orders sẽ gửi), `requestQuote` gọi `POST /v1/checkout/quote`.

## Chưa có
Trang đăng nhập/đăng ký và UI menu/giỏ/checkout (dùng khi dựng màn ở các bước sau). Component shadcn/ui (`components.json` đã cấu hình sẵn). React Hook Form + Zod cho form (bước 08).
