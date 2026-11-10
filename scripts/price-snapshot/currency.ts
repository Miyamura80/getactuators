// Price strings and currencies. parsePrice reads "$1,299.00", "€1.299,00",
// "US$ 229.90", "¥ 1 280" or "1299"; FX rates are ECB reference rates via
// the Frankfurter API (no key), stored with each point as US$ per unit.

// A code only counts as a whole word, so "neural" is not EUR. Bare "$" and
// "¥" name no single currency (US, Canadian, Australian dollars; yuan or
// yen), so they are only a hint, used when the page states no currency.
const code = (c: string) => new RegExp(`(?<![A-Za-z])${c}(?![A-Za-z])`, "i");

const SYMBOLS: [RegExp, string][] = [
    [/US\$/, "USD"],
    [code("USD"), "USD"],
    [/CA\$|C\$/, "CAD"],
    [code("CAD"), "CAD"],
    [/A\$/, "AUD"],
    [code("AUD"), "AUD"],
    [/HK\$/, "HKD"],
    [code("HKD"), "HKD"],
    [/S\$/, "SGD"],
    [code("SGD"), "SGD"],
    [/€/, "EUR"],
    [code("EUR"), "EUR"],
    [/£/, "GBP"],
    [code("GBP"), "GBP"],
    [/CN¥|元/, "CNY"],
    [code("RMB"), "CNY"],
    [code("CNY"), "CNY"],
    [/JP¥|円/, "JPY"],
    [code("JPY"), "JPY"],
    [/₩/, "KRW"],
    [code("KRW"), "KRW"],
    [code("CHF"), "CHF"],
    [/₹/, "INR"],
    [code("INR"), "INR"],
];

// The currency a price string names, or null when it names none or only a
// bare "$" or "¥".
export function detectCurrency(text: string): string | null {
    for (const [re, c] of SYMBOLS) if (re.test(text)) return c;
    return null;
}

// What a bare "$" or "¥" most likely means when nothing else says, from the
// page language (<html lang>): "¥" is yuan on a Chinese page and yen on a
// Japanese one, with no guess otherwise (they differ about twentyfold); "$"
// follows the region (en-CA is CAD) and is otherwise US dollars.
const DOLLAR_REGION: Record<string, string> = {
    CA: "CAD",
    AU: "AUD",
    NZ: "NZD",
    SG: "SGD",
    HK: "HKD",
};

export function currencyHint(text: string, lang = ""): string | null {
    const stated = detectCurrency(text);
    if (stated) return stated;
    const [language = "", region = ""] = lang.toLowerCase().split(/[-_]/);
    if (/¥/.test(text))
        return language === "zh" ? "CNY" : language === "ja" ? "JPY" : null;
    if (/\$/.test(text)) return DOLLAR_REGION[region.toUpperCase()] ?? "USD";
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

// Digits, then thousands groups (a mark or a space followed by exactly three
// digits), then decimals. "$299 2 in stock" is 299.
const AMOUNT = /\d+(?:[.,\s\u00a0']\d{3}(?!\d))*(?:[.,]\d+)?/;

export function parseAmount(text: string): number | null {
    const m = AMOUNT.exec(text);
    if (!m) return null;
    const v = Number(normalise(m[0].replace(/[\s\u00a0']/g, "").replace(/[.,]+$/, "")));
    return Number.isFinite(v) && v > 0 ? v : null;
}

// currency is what the string states; hint adds the bare "$" guess.
export function parsePrice(
    text: string,
    lang = "",
): { amount: number; currency: string | null; hint: string | null } | null {
    const amount = parseAmount(text);
    return amount === null
        ? null
        : { amount, currency: detectCurrency(text), hint: currencyHint(text, lang) };
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
