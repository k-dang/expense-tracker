export function parsePage(v?: string): number {
  if (!v) return 1;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

export function parseEnumParam<const T extends string>(
  value: string | undefined,
  allowedValues: ReadonlySet<T>,
): T | undefined {
  return value && allowedValues.has(value as T) ? (value as T) : undefined;
}
