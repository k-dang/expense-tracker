export function parsePage(v?: string): number {
  if (!v) return 1;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}
