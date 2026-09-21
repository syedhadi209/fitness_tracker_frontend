export function num(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function round(value: unknown, digits = 0): number {
  const n = num(value);
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDays(today, -1)) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function kcal(value: unknown): string {
  return `${Math.round(num(value)).toLocaleString()} kcal`;
}

export function grams(value: unknown): string {
  return `${round(value, 0)}g`;
}

export function initials(email: string, firstName?: string): string {
  if (firstName?.trim()) return firstName.trim().slice(0, 1).toUpperCase();
  return email.slice(0, 1).toUpperCase();
}
