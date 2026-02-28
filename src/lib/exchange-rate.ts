const FALLBACK_USD_TO_CAD = 1.36;

export async function fetchUsdCadRate(): Promise<{ usdToCad: number }> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=CAD",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = data.rates?.CAD;
    if (typeof rate !== "number") throw new Error("Invalid rate response");
    return { usdToCad: rate };
  } catch {
    return { usdToCad: FALLBACK_USD_TO_CAD };
  }
}
