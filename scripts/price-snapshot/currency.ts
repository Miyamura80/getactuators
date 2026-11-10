// Price strings and currencies. parsePrice reads "$1,299.00", "€1.299,00",
// "US$ 229.90", "¥ 1 280" or "1299"; FX rates are ECB reference rates via
// the Frankfurter API (no key), stored with each point as US$ per unit.

const SYMBOLS: [RegExp, string][] = [
    [/US\$|USD/i, "USD"],
    [/CA\$|C\$|CAD/i, "CAD"],
    [/A\$|AUD/i, "AUD"],
    [/HK\$|HKD/i, "HKD"],
    [/S\$|SGD/i, "SGD"],
    [/€|EUR/i, "EUR"],
    [/£|GBP/i, "GBP"],
    [/CN¥|RMB|CNY|元/i, "CNY"],
    [/JP¥|JPY|円/i, "JPY"],
    [/₩|KRW/i, "KRW"],
    [/CHF/i, "CHF"],
    [/₹|INR/i, "INR"],
    [/\$/, "USD"],
    [/¥/, "CNY"],
];

export function detectCurrency(text: string): string | null {
    for (const [re, code] of SYMBOLS) if (re.test(text)) return code;
    return null;
}

// The number in a price string. With both "." and ",", the last one is the
// decimal mark ("1.299,00" and "1,299.00" are both 1299). With one kind, it
// is a thousands mark when repeated or followed by exactly three digits.
function normalise(s: string): string {
    const hasDot = s.includes(".");
    const hasComma = s.includes(",");
    if (hasDot && hasComma) {
        const dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
        const thousands = dec === "." ? "," : ".";
        return s.split(thousands).join("").replace(dec, ".");
    }
    if (!hasDot && !hasComma) return s;
    const parts = s.split(hasDot ? "." : ",");
    const tail = parts.at(-1) ?? "";
    return parts.length > 2 || tail.length === 3 ? parts.join("") : parts.join(".");
}

export function parseAmount(text: string): number | null {
    const m = /\d[\d.,\s\u00a0']*/.exec(text);
    if (!m) return null;
    const v = Number(normalise(m[0].replace(/[\s\u00a0']/g, "").replace(/[.,]+$/, "")));
    return Number.isFinite(v) && v > 0 ? v : null;
}

export function parsePrice(
    text: string,
): { amount: number; currency: string | null } | null {
    const amount = parseAmount(text);
    return amount === null ? null : { amount, currency: detectCurrency(text) };
}

export const round2 = (v: number): number => Math.round(v * 100) / 100;

// US$ per unit of each currency on a day, from the ECB reference rates.
export type FxTable = Record<string, number>;

export async function fetchFx(
    date: string | "latest",
    fetcher: (url: string) => Promise<Response> = fetch,
): Promise<FxTable> {
    const res = await fetcher(`https://api.frankfurter.app/${date}?from=USD`);
    if (!res.ok) throw new Error(`FX rates for ${date}: HTTP ${res.status}`);
    const body = (await res.json()) as { rates: Record<string, number> };
    return fxFromUsdRates(body.rates);
}

// Frankfurter gives units per US$; invert to US$ per unit.
export function fxFromUsdRates(rates: Record<string, number>): FxTable {
    const out: FxTable = { USD: 1 };
    for (const [code, perUsd] of Object.entries(rates))
        if (perUsd > 0) out[code] = 1 / perUsd;
    return out;
}

export function toUsd(
    amount: number,
    currency: string,
    fx: FxTable,
): { priceUsd: number; fxRate: number } | null {
    const rate = fx[currency];
    if (!rate) return null;
    const fxRate = currency === "USD" ? 1 : Number(rate.toPrecision(6));
    return { priceUsd: round2(amount * fxRate), fxRate };
}
