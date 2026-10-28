// Reading a listed price: "€1.234,56", "US$ 1,299.00", "¥12,800" -> amount
// and ISO 4217 code. Symbols that several currencies share ("$", "¥") are
// resolved by the page's stated currency when there is one, else reported as
// ambiguous so the caller can flag the point for review.

const SYMBOLS: [RegExp, string][] = [
    [/US\$|USD/i, "USD"],
    [/CA\$|C\$|CAD/i, "CAD"],
    [/AU\$|A\$|AUD/i, "AUD"],
    [/HK\$|HKD/i, "HKD"],
    [/S\$|SGD/i, "SGD"],
    [/€|EUR/i, "EUR"],
    [/£|GBP/i, "GBP"],
    [/CHF/i, "CHF"],
    [/JP¥|JPY|円/i, "JPY"],
    [/CN¥|RMB|CNY|元/i, "CNY"],
    [/₩|KRW/i, "KRW"],
    [/₹|INR/i, "INR"],
];

export interface Money {
    amount: number;
    currency: string | null;
    // True when only a shared symbol ($ or ¥) named the currency.
    ambiguous: boolean;
}

export function detectCurrency(text: string): {
    code: string | null;
    ambiguous: boolean;
} {
    for (const [re, code] of SYMBOLS)
        if (re.test(text)) return { code, ambiguous: false };
    if (text.includes("$")) return { code: "USD", ambiguous: true };
    if (text.includes("¥")) return { code: "CNY", ambiguous: true };
    return { code: null, ambiguous: false };
}

// "1.234,56" (comma decimal) and "1,234.56" both read as 1234.56; a lone
// separator followed by exactly three digits is a thousands separator.
function normalize(s: string): string {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    if (lastDot >= 0 && lastComma >= 0) {
        const dec = lastDot > lastComma ? "." : ",";
        const thou = dec === "." ? "," : ".";
        return s.split(thou).join("").replace(dec, ".");
    }
    if (lastDot < 0 && lastComma < 0) return s;
    const parts = s.split(lastComma >= 0 ? "," : ".");
    const tail = parts.at(-1) ?? "";
    return parts.length > 2 || tail.length === 3 ? parts.join("") : parts.join(".");
}

export function parseAmount(raw: string): number | null {
    const m = raw.replace(/\s/g, "").match(/\d[\d.,']*/);
    if (!m) return null;
    const n = Number(normalize(m[0].replace(/'/g, "").replace(/[.,]$/, "")));
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseMoney(raw: string, pageCurrency?: string | null): Money | null {
    const amount = parseAmount(raw);
    if (amount === null) return null;
    const found = detectCurrency(raw);
    if (pageCurrency && (!found.code || found.ambiguous))
        return { amount, currency: pageCurrency.toUpperCase(), ambiguous: false };
    return { amount, currency: found.code, ambiguous: found.ambiguous };
}
