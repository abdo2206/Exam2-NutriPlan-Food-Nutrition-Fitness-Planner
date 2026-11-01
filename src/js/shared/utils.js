import { HTML_ENTITIES } from "./constants.js";
export function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] ?? "");
}
export function formatGrams(value, digits = 1) {
    if (value === undefined || !Number.isFinite(value))
        return "—";
    return `${Number(value.toFixed(digits))}g`;
}
export function formatCalories(value) {
    if (value === undefined || !Number.isFinite(value))
        return "—";
    return String(Number(value.toFixed(1)));
}
export function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
