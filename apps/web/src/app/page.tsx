import Link from "next/link";

/**
 * Trang chu. O buoc 03 day chi la cho dat cho menu.
 * Menu that (REQ-100, REQ-101) duoc dung o buoc 06.
 */
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-semibold">Coffee Order</h1>
      <p className="mt-2 text-sm text-(--muted)">
        Monorepo da duoc khoi tao. Menu, gio hang va dat don duoc xay o cac buoc sau.
      </p>

      <div className="mt-8 rounded-lg border border-(--line) bg-white p-5">
        <h2 className="font-medium">Trang thai buoc 03</h2>
        <ul className="mt-3 space-y-1 text-sm text-(--muted)">
          <li>Next.js App Router + TypeScript strict + Tailwind: xong</li>
          <li>NestJS /v1 + Swagger /docs: xong</li>
          <li>packages/contracts dung chung web va api: xong</li>
          <li>Schema, auth, menu, gio, don: chua lam</li>
        </ul>
        <Link
          href="/smoke"
          className="mt-5 inline-block rounded-md bg-(--brand) px-4 py-2 text-sm font-medium text-white"
        >
          Mo trang smoke goi API health
        </Link>
      </div>

      <p className="mt-6 text-xs text-(--muted)">
        Thuong hieu demo, du lieu gia. Khong phai he thong cua doanh nghiep nao.
      </p>
    </main>
  );
}
