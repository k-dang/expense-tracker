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
