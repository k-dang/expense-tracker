const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const cadWholeFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export function formatCurrencyFromCents(amountCents: number): string {
  return cadFormatter.format(amountCents / 100);
}

export function formatCurrency(amount: number): string {
  return cadFormatter.format(amount);
}

export function formatCurrencyWhole(amount: number): string {
  return cadWholeFormatter.format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrencyFromCentsWithCode(
  amountCents: number,
  currency: "USD" | "CAD",
): string {
  const formatter = currency === "USD" ? usdFormatter : cadFormatter;
  return formatter.format(amountCents / 100);
}

export function formatFileSizeBytes(bytes: number): string {
  let n = Math.max(bytes, 0);
  let unitIdx = 0;
  const units = ["B", "KB", "MB", "GB"] as const;
  while (n >= 1024 && unitIdx < units.length - 1) {
    n /= 1024;
    unitIdx += 1;
  }

  const display = n < 10 && unitIdx > 0 ? Number(n.toFixed(1)) : Math.round(n);
  return `${display} ${units[unitIdx]}`;
}

export function shortSha256Preview(digest: string, prefixLen = 10): string {
  if (!digest || digest.length <= prefixLen) return digest;
  return `${digest.slice(0, prefixLen)}…`;
}
