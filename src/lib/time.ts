export const SHOP_TZ = "Africa/Addis_Ababa";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function shopDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shopYear(date = new Date()) {
  return Number(shopDateLabel(date).slice(0, 4));
}

export function shopMonthIndex(date = new Date()) {
  return Number(shopDateLabel(date).slice(5, 7)) - 1;
}

export function dayRange(dateStr?: string) {
  const label =
    dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : shopDateLabel();
  const start = new Date(`${label}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { label, start, end };
}

export function monthRange(year: number, monthIndex: number) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const start = new Date(`${year}-${month}-01T00:00:00+03:00`);
  const end =
    monthIndex === 11
      ? new Date(`${year + 1}-01-01T00:00:00+03:00`)
      : new Date(`${year}-${String(monthIndex + 2).padStart(2, "0")}-01T00:00:00+03:00`);
  return { start, end };
}

export function formatShopDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShopTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
