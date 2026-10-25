import type { Sourced } from "./sourced";
import type { Ree } from "./types";

// Rare-earth metal prices, US$ per kg of metal. The /metals page (#75) should
// take this table over; /humanoids only reads it.
//
// Value: China domestic metal price (SMM, VAT excluded) at the end of
// September 2026 (praseodymium: a regional index). The range spans the
// sources: FOB China quotes, an earlier 2026 quote for dysprosium.

const AS_OF = "September 2026";

function price(
    value: number,
    high: number,
    sources: string[],
    note: string,
): Sourced<number> {
    return {
        value,
        unit: "USD/kg",
        sources,
        asOf: AS_OF,
        confidence: "reported",
        range: [value, high],
        note,
    };
}

export const REE_METAL_PRICE: Ree<Sourced<number>> = {
    nd: price(
        140.88,
        154,
        ["price-nd"],
        "Neodymium metal: China domestic $140.88/kg, FOB China about $154/kg.",
    ),
    pr: {
        value: 150.27,
        unit: "USD/kg",
        sources: ["price-pr"],
        asOf: AS_OF,
        confidence: "estimated",
        range: [149.86, 150.27],
        note: "Praseodymium: Business Analytiq Northeast Asia index, $149.86/kg (July) and $150.27/kg (September 2026). The index does not say metal or oxide; read here as metal.",
    },
    dy: {
        value: 233.55,
        unit: "USD/kg",
        sources: ["price-dy", "price-feb-2026"],
        asOf: AS_OF,
        confidence: "reported",
        range: [201.4, 233.55],
        note: "Dysprosium metal (99% min): $233.55/kg at end of September; February 2026 quote 1.45 million CNY/t, $201/kg at 7.2 CNY/USD.",
    },
    tb: price(
        1074.34,
        1532,
        ["price-tb"],
        "Terbium metal: China domestic $1,074/kg, FOB China about $1,532/kg.",
    ),
};
