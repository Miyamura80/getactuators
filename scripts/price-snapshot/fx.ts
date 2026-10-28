import type { FetchText } from "./fetcher";

// US dollars per unit of a currency on a date, from the ECB reference rates
// served by frankfurter.app (no key; weekends and holidays return the last
// business day). The rate is stored on every point, so a later re-read never
// changes a past conversion.

const API = "https://api.frankfurter.app";

export function fxRates(fetchText: FetchText) {
    const cache = new Map<string, number | null>();
    return async (currency: string, date: string): Promise<number | null> => {
        if (currency === "USD") return 1;
        const key = `${currency}|${date}`;
        if (cache.has(key)) return cache.get(key) ?? null;
        const res = await fetchText(
            `${API}/${date}?from=${currency}&to=USD`,
            "application/json",
        );
        let rate: number | null = null;
        try {
            const body = res?.status === 200 ? JSON.parse(res.text) : null;
            const v = body?.rates?.USD;
            rate = typeof v === "number" && v > 0 ? v : null;
        } catch {
            rate = null;
        }
        cache.set(key, rate);
        return rate;
    };
}
