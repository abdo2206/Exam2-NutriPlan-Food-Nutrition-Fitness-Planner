import { HTML_ENTITIES } from "./constants.js";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] ?? "");
}

export function formatGrams(
  value: number | undefined,
  digits = 1,
): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${Number(value.toFixed(digits))}g`;
}

export function formatCalories(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return String(Number(value.toFixed(1)));
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
