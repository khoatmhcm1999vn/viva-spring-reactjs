import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gop class Tailwind, giai quyet class trung nhom. Dung cho shadcn/ui. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Tien la integer VND. Hien thi dang "45.000 ₫" theo docs/wireframes.md. */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Thoi gian luu ISO 8601, hien thi theo Asia/Ho_Chi_Minh. */
export function formatDateTimeHcm(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
