"use client";

import { useQuery } from "@tanstack/react-query";
import type { HealthResponse, ReadyResponse } from "@coffee-order/contracts";
import Link from "next/link";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/env";
import { formatDateTimeHcm } from "@/lib/utils";

/**
 * Trang smoke cua buoc 03: chung minh web goi duoc API that.
 *
 * Chay o client nen khong co fetch luc build. `/v1/ready` tra 503 khi chua cau hinh
 * DATABASE_URL - day la ket qua dung o buoc 03, khong phai loi.
 */
export default function SmokePage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthResponse>("/health", { auth: false }),
    retry: false,
  });

  const ready = useQuery({
    queryKey: ["ready"],
    // /v1/ready tra 503 khi NOT_READY, nen doc ca truong hop loi co body.
    queryFn: async (): Promise<ReadyResponse> => {
      try {
        return await apiFetch<ReadyResponse>("/ready", { auth: false });
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 503) {
          return {
            status: "NOT_READY",
            checks: { database: "NOT_CONFIGURED" },
            timestamp: new Date().toISOString(),
          };
        }
        throw err;
      }
    },
    retry: false,
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <Link href="/" className="text-sm text-(--muted)">
        &larr; Ve trang chu
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Smoke test web &rarr; API</h1>
      <p className="mt-2 text-sm text-(--muted)">
        Dang goi <code>{API_BASE_URL}</code>
      </p>

      <section className="mt-8 rounded-lg border border-(--line) bg-white p-5">
        <h2 className="font-medium">GET /health</h2>
        {health.isPending && <p className="mt-2 text-sm text-(--muted)">Dang goi...</p>}
        {health.isError && (
          <p className="mt-2 text-sm text-red-700">
            Khong goi duoc API. Kiem tra API dang chay o cong 3001 va bien
            NEXT_PUBLIC_API_BASE_URL.
          </p>
        )}
        {health.data && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-(--muted)">status</dt>
            <dd>{health.data.status}</dd>
            <dt className="text-(--muted)">service</dt>
            <dd>{health.data.service}</dd>
            <dt className="text-(--muted)">version</dt>
            <dd>{health.data.version}</dd>
            <dt className="text-(--muted)">thoi diem</dt>
            <dd>{formatDateTimeHcm(health.data.timestamp)}</dd>
          </dl>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-(--line) bg-white p-5">
        <h2 className="font-medium">GET /ready</h2>
        {ready.isPending && <p className="mt-2 text-sm text-(--muted)">Dang goi...</p>}
        {ready.isError && (
          <p className="mt-2 text-sm text-red-700">Khong goi duoc readiness.</p>
        )}
        {ready.data && (
          <>
            <p className="mt-2 text-sm">
              status: <strong>{ready.data.status}</strong> &middot; database:{" "}
              <strong>{ready.data.checks.database}</strong>
            </p>
            {ready.data.status === "NOT_READY" && (
              <p className="mt-2 text-sm text-(--muted)">
                NOT_READY la ket qua dung o buoc 03: chua co DATABASE_URL va chua co
                Prisma. Kiem tra DB that duoc them o buoc 04.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
