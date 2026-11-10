import type { PriceMethod, PriceRecord } from "../../src/prices/types";
import { type FxTable, toUsd } from "./currency";
import type { Extraction } from "./extract/types";
import type { Target } from "./targets";
import { type PricedOffer, pickOffer } from "./variant";

// One page read -> one history record, a failure, or a point held back for
// review. A point is held back when the variant pick is ambiguous or the
// price moved more than REVIEW_RATIO either way from the reference (the last
// recorded price, else the catalog's): the PR lists it for a person to add.

export const REVIEW_RATIO = 1.6;

export type Outcome =
    | { kind: "point"; record: PriceRecord }
    | { kind: "review"; record: PriceRecord; reason: string }
    | { kind: "failure"; reason: string };

export interface ReadInput {
    target: Target;
    extraction: Extraction | null;
    pageCurrency: string | null;
    error?: string;
    fx: FxTable;
    date: string;
    url: string;
    // "wayback" for back-fill points; else the extractor's method.
    method?: PriceMethod;
    referenceUsd: number | null;
}

function priced(input: ReadInput): PricedOffer[] | string {
    const offers = input.extraction?.offers ?? [];
    const out: PricedOffer[] = [];
    let missing: string | null = null;
    for (const o of offers) {
        const currency = o.currency ?? input.pageCurrency;
        if (!currency) {
            missing = "no currency on the page";
            continue;
        }
        const usd = toUsd(o.price, currency, input.fx);
        if (!usd) {
            missing = `no FX rate for ${currency}`;
            continue;
        }
        out.push({ ...o, currency, priceUsd: usd.priceUsd });
    }
    return out.length ? out : (missing ?? "no offers");
}

export function toOutcome(input: ReadInput): Outcome {
    if (!input.extraction)
        return { kind: "failure", reason: input.error ?? "no price found" };
    const offers = priced(input);
    if (typeof offers === "string") return { kind: "failure", reason: offers };
    const pick = pickOffer(offers, {
        name: input.target.name,
        referenceUsd: input.referenceUsd,
        variant: input.target.override.variant,
    });
    if (!pick) return { kind: "failure", reason: "no offers" };
    const o = pick.offer;
    const fxRate = toUsd(1, o.currency as string, input.fx)?.fxRate ?? 1;
    const record: PriceRecord = {
        actuatorId: input.target.actuatorId,
        date: input.date,
        priceUsd: o.priceUsd,
        currency: o.currency as string,
        originalPrice: o.price,
        fxRate,
        url: input.url,
        method: input.method ?? input.extraction.method,
        ...(o.inStock === false ? { outOfStock: true } : {}),
        ...(offers.length > 1 && o.title ? { variant: o.title } : {}),
    };
    if (pick.ambiguous)
        return {
            kind: "review",
            record,
            reason: `${offers.length} variants, no clear match`,
        };
    const ref = input.referenceUsd;
    if (ref && (o.priceUsd / ref > REVIEW_RATIO || ref / o.priceUsd > REVIEW_RATIO))
        return {
            kind: "review",
            record,
            reason: `price moved from $${ref} to $${o.priceUsd}`,
        };
    return { kind: "point", record };
}
