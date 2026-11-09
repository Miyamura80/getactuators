import { ACTUATORS, ROBOTS } from "../catalog";
import { FOOTER_GROUPS } from "../public-navigation";
import { type Citation, licenceErrors } from "../supply-chain/licence";
import { TREND_CHARTS } from "./index";
import { SOURCES, TRENDS_FACTS_ALLOWLIST, isOwnSource } from "./sources";

// Citation audit for /trends: every point cites a known source (or an
// existing actuatorlist actuator, robot or page), no point is dated after
// the audit day, and the reuse rules in src/supply-chain/licence.ts hold.
// One record per point.

export function trendsCitations(): Citation[] {
    return TREND_CHARTS.flatMap((c) =>
        c.series.flatMap((s) =>
            s.points.map(
                (p, i): Citation => [`trend ${c.id}/${s.id}#${i}@${p.date}`, p.sources],
            ),
        ),
    );
}

const PAGE_PATHS = new Set<string>(
    FOOTER_GROUPS.flatMap((g) => g.links.map(([href]) => href)),
);

// An own-data id names something that exists: a catalog actuator, a robot on
// /robots or a page in the site navigation.
function ownSourceExists(id: string): boolean {
    const [kind, ...rest] = id.split(":");
    const ref = rest.join(":");
    if (kind === "catalog") return ACTUATORS.some((a) => a.id === ref);
    if (kind === "robots") return ROBOTS.some((r) => r.id === ref);
    return PAGE_PATHS.has(ref);
}

export function trendsLicenceErrors(
    today = new Date().toISOString().slice(0, 10),
): string[] {
    const citations = trendsCitations();
    const unknown = citations.flatMap(([where, ids]) => [
        ...(ids.length === 0 ? [`${where}: no sources`] : []),
        ...ids
            .filter((id) =>
                isOwnSource(id) ? !ownSourceExists(id) : !Object.hasOwn(SOURCES, id),
            )
            .map((id) =>
                isOwnSource(id)
                    ? `${where}: "${id}" names no actuator, robot or page`
                    : `${where}: unknown source "${id}"; add it to src/trends/sources.ts`,
            ),
    ]);
    // "YYYY" and "YYYY-MM" compare against the same prefix of today.
    const future = TREND_CHARTS.flatMap((c) =>
        c.series.flatMap((s) =>
            s.points
                .filter((p) => p.date > today.slice(0, p.date.length))
                .map((p) => `trend ${c.id}/${s.id}@${p.date}: dated after ${today}`),
        ),
    );
    const used = new Set(citations.flatMap(([, ids]) => ids));
    const orphans = Object.keys(SOURCES)
        .filter((id) => !used.has(id))
        .map(
            (id) =>
                `trends source "${id}" is not cited; remove it from src/trends/sources.ts`,
        );
    return [
        ...unknown,
        ...future,
        ...orphans,
        ...licenceErrors({
            name: "trends",
            file: "src/trends/sources.ts",
            sources: Object.entries(SOURCES).map(([id, s]) => ({ id, ...s })),
            citations: citations.map(([where, ids]) => [
                where,
                ids.filter((id) => !isOwnSource(id)),
            ]),
            allowlist: TRENDS_FACTS_ALLOWLIST,
        }),
    ];
}
