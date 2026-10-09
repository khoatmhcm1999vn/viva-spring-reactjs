import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Coffee Order",
  description:
    "Web dat ca phe cho bai cuoi khoa. Thuong hieu demo va du lieu gia.",
};

// Khai bao tuong minh thay vi dung global `LayoutProps` cua Next: global do chi
// ton tai sau khi Next sinh .next/types, nen `pnpm typecheck` chay doc lap se loi.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // lang="vi": giao dien huong toi nguoi dung Viet Nam.
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
