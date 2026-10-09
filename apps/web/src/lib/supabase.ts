"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Supabase client phia browser (singleton).
 *
 * Dung @supabase/ssr theo huong dan hien tai cho Next.js App Router: client tu
 * luu session va tu refresh access token. Ta KHONG tu dung bang password hay
 * JWT issuer khac.
 *
 * Tra null khi chua cau hinh Supabase (dev chua co project) de phan con lai cua
 * app van chay; cac man can dang nhap se hien trang thai "chua cau hinh".
 */
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (client) return client;
  // isSupabaseConfigured dam bao hai gia tri khong null.
  client = createBrowserClient(SUPABASE_URL as string, SUPABASE_PUBLISHABLE_KEY as string);
  return client;
}

/**
 * Lay access token hien tai (neu co phien). Tra null khi chua dang nhap hoac
 * chua cau hinh Supabase. KHONG log token.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Lam moi phien MOT lan. Dung khi API tra 401 de thu cuu phien het han.
 * Tra access token moi hoac null; KHONG goi vong lap.
 */
export async function refreshSessionOnce(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.refreshSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}
