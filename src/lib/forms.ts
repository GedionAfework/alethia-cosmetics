export function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export function intField(formData: FormData, key: string) {
  const raw = field(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  return n;
}

export function moneyField(formData: FormData, key: string) {
  const raw = field(formData, key).replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}
