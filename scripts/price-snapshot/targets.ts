import { ACTUATORS } from "../../src/catalog";

// What the snapshot reads: every catalog actuator with a product_url. An
// override can point at another page, pin a variant (a substring of the
// variant title), give a CSS selector for the price element, or skip a page
// with a reason (shown in the PR). Add one when a weekly PR reports a wrong
// variant or a page whose price the generic extractors miss.

export interface Override {
    url?: string;
    variant?: string;
    selector?: string;
    skip?: string;
    // Older product URLs for the Wayback back-fill.
    oldUrls?: string[];
}

export const OVERRIDES: Record<string, Override> = {};

export interface Target {
    actuatorId: string;
    name: string;
    url: string;
    catalogUsd: number | null;
    override: Override;
}

// Every target, or those named in only; an id that names no actuator with a
// product page is an error, so a typo does not run nothing.
export function targets(only?: string[]): Target[] {
    if (only) {
        const known = new Set(ACTUATORS.filter((a) => a.product_url).map((a) => a.id));
        const unknown = only.filter((id) => !known.has(id));
        if (unknown.length)
            throw new Error(
                `no catalog actuator with a product page: ${unknown.join(", ")}`,
            );
    }
    return ACTUATORS.filter((a) => a.product_url && (!only || only.includes(a.id))).map(
        (a) => {
            const override = OVERRIDES[a.id] ?? {};
            return {
                actuatorId: a.id,
                name: `${a.brand} ${a.name}`,
                url: override.url ?? (a.product_url as string),
                catalogUsd: a.price_usd,
                override,
            };
        },
    );
}
