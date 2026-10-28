import { type PricedPoint, priced } from "../../../../src/prices/history";
import type { PriceObservation } from "../../../../src/prices/types";
import { ACTUATORS } from "../../lib/data";
import type { Actuator } from "../../types";
import type { Spec } from "./url-state";

// The buyer's view of the catalog: every actuator with a recorded price and
// a peak torque (the same set the strip draws), its latest listed price and
// $/Nm, filtered by a spec and ranked cheapest per newton-metre first.

export interface Listing {
    a: Actuator;
    torque: number;
    price: number;
    perNm: number;
    // Priced history points, oldest first.
    points: PricedPoint[];
    // Change from the first recorded price to the latest; null with one point.
    change: number | null;
}

export function buildListings(all: readonly PriceObservation[], actuators: readonly Actuator[] = ACTUATORS): Listing[] {
    const byActuator = new Map<string, PricedPoint[]>();
    for (const p of priced(all)) byActuator.set(p.actuatorId, [...(byActuator.get(p.actuatorId) ?? []), p]);
    return actuators.flatMap((a) => {
        const points = (byActuator.get(a.id) ?? []).sort((x, y) => x.date.localeCompare(y.date) || x.method.localeCompare(y.method));
        const torque = a.peak_torque_nm;
        const price = points.at(-1)?.priceUsd;
        if (!torque || !price) return [];
        const first = points[0]?.priceUsd;
        return [{
            a,
            torque,
            price,
            perNm: price / torque,
            points,
            change: points.length > 1 && first ? price / first - 1 : null,
        }];
    });
}

function meets(l: Listing, spec: Spec): boolean {
    return (spec.nm === null || l.torque >= spec.nm)
        && (spec.budget === null || l.price <= spec.budget)
        && (spec.cls === "" || l.a.category === spec.cls)
        && (spec.country === "" || l.a.country === spec.country);
}

// Matches, cheapest per N·m first; ties go to the cheaper unit.
export function rank(listings: readonly Listing[], spec: Spec): Listing[] {
    return listings.filter((l) => meets(l, spec)).sort((x, y) => x.perNm - y.perNm || x.price - y.price);
}

// Best value frontier: the actuators no other one beats on both counts
// (more or equal torque for less or equal money). Read left to right it is
// the cheapest way to buy at least a given torque. Torque ascending.
export function frontier(listings: readonly Listing[]): Listing[] {
    const out: Listing[] = [];
    let best = Number.POSITIVE_INFINITY;
    for (const l of [...listings].sort((x, y) => y.torque - x.torque || x.price - y.price))
        if (l.price < best) {
            out.push(l);
            best = l.price;
        }
    return out.reverse();
}

// Countries that have a listing, most listings first.
export function countries(listings: readonly Listing[]): { country: string; n: number }[] {
    const n = new Map<string, number>();
    for (const l of listings) if (l.a.country) n.set(l.a.country, (n.get(l.a.country) ?? 0) + 1);
    return [...n].map(([country, k]) => ({ country, n: k })).sort((x, y) => y.n - x.n || x.country.localeCompare(y.country));
}
