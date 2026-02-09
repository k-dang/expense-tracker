export function formatCurrencyFromCents(amountCents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amountCents / 100);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
