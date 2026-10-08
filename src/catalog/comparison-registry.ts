import { hasMotorBoundary } from "./evidence";

// Dependency-neutral: no catalog import, filesystem, server or React dependency.
export interface ComparisonRecord {
    id: string;
    name: string;
    category: string;
    peak_torque_nm: number | null;
    rated_torque_nm: number | null;
    max_speed_rpm: number | null;
    weight_g: number | null;
    voltage_v?: string | number | null;
    peak_current_a?: number | null;
    power_w?: number | null;
    kt_nm_per_a?: number | null;
    integrated_driver?: boolean | null;
}
export interface ComparisonPair {
    ids: [string, string];
    category: string;
    path: string;
}
const FIELDS = [
    "peak_torque_nm",
    "rated_torque_nm",
    "max_speed_rpm",
    "weight_g",
] as const;
const positive = (value: number | null) =>
    value !== null && Number.isFinite(value) && value > 0;
const shared = (a: ComparisonRecord, b: ComparisonRecord) =>
    FIELDS.filter((field) => positive(a[field]) && positive(b[field]));
const eligible = (a: ComparisonRecord) =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id) &&
    !/(?:^|-)vs(?:-|$)/.test(a.id) &&
    hasMotorBoundary(a) &&
    FIELDS.filter((field) => positive(a[field])).length >= 3 &&
    (positive(a.peak_torque_nm) || positive(a.rated_torque_nm));
const order = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
function distance(a: ComparisonRecord, b: ComparisonRecord): number {
    const fields = shared(a, b);
    return (
        fields.reduce(
            (sum, field) =>
                sum +
                Math.abs((a[field] as number) - (b[field] as number)) /
                    Math.max(a[field] as number, b[field] as number),
            0,
        ) / fields.length
    );
}

// Each eligible record proposes up to three nearest same-category peers.
// Union, not all combinations: at most N * peers pages. Incoming proposals
// can give a product more than three links. Similarity is discoverability,
// never compatibility, tested performance, or a recommendation.
export function buildComparisonRegistry(
    records: readonly ComparisonRecord[],
    peers = 3,
): ComparisonPair[] {
    // A whole `vs` slug token is reserved, including the ID boundaries.
    // This makes both canonical and reverse paths unambiguous.
    const cap = Number.isFinite(peers)
        ? Math.max(0, Math.min(3, Math.floor(peers)))
        : 3;
    const counts = new Map<string, number>();
    for (const record of records)
        counts.set(record.id, (counts.get(record.id) ?? 0) + 1);
    const rows = records
        .filter((a) => counts.get(a.id) === 1 && eligible(a))
        .sort((a, b) => order(a.id, b.id));
    const pairs = new Map<string, ComparisonPair>();
    for (const a of rows) {
        const candidates = rows
            .filter(
                (b) =>
                    b.id !== a.id &&
                    b.category === a.category &&
                    shared(a, b).length >= 3,
            )
            .sort((b, c) => distance(a, b) - distance(a, c) || order(b.id, c.id))
            .slice(0, cap);
        for (const b of candidates) {
            const ids = [a.id, b.id].sort(order) as [string, string];
            const path = `/comparisons/${ids.join("-vs-")}`;
            const existing = pairs.get(path);
            if (existing && existing.ids.join("\0") !== ids.join("\0")) {
                throw new Error(`Conflicting comparison path identities: ${path}`);
            }
            pairs.set(path, { ids, category: a.category, path });
        }
    }
    return [...pairs.values()].sort((a, b) => order(a.path, b.path));
}

// Preservation exception: an authored evidence dossier overrides the template,
// including when nearest-peer selection would not propose this pair.
export const AUTHORED_COMPARISONS = [
    {
        ids: ["cubemars-ak80-9", "xiaomi-cybergear"] as [string, string],
        category: "qdd_proprioceptive",
        path: "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
        title: "CubeMars AK80-9 V3.0 KV100 vs original Xiaomi CyberGear",
    },
];

export function authoredComparisonDirectory(records: readonly ComparisonRecord[]) {
    const paths = new Set<string>();
    const authored = AUTHORED_COMPARISONS.filter((pair) => {
        if (
            pair.ids.length !== 2 ||
            pair.ids[0] === pair.ids[1] ||
            !pair.ids.every(
                (id) =>
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
                    !/(?:^|-)vs(?:-|$)/.test(id),
            )
        ) {
            throw new Error(`Invalid authored comparison IDs: ${pair.path}`);
        }
        const ids = [...pair.ids].sort(order);
        if (pair.path !== `/comparisons/${ids.join("-vs-")}`) {
            throw new Error(`Invalid authored comparison path identity: ${pair.path}`);
        }
        if (paths.has(pair.path)) {
            throw new Error(`Conflicting authored comparison identity: ${pair.path}`);
        }
        paths.add(pair.path);
        return pair.ids.every(
            (id) => records.filter((record) => record.id === id).length === 1,
        );
    });
    return authored.map((pair) => ({
        ...pair,
        ids: [...pair.ids].sort(order) as [string, string],
    }));
}

export function comparisonDirectory(
    records: readonly ComparisonRecord[],
): ComparisonPair[] {
    // Validate authored identities before they can suppress generated paths.
    const authored = authoredComparisonDirectory(records);
    const authoredPaths = new Set(authored.map((pair) => pair.path));
    return [
        ...buildComparisonRegistry(records).filter(
            (pair) => !authoredPaths.has(pair.path),
        ),
        ...authored,
    ].sort((a, b) => order(a.path, b.path));
}

export function canonicalComparisonPath(
    path: string,
    pairs: readonly ComparisonPair[],
): string | null {
    const md = path.endsWith(".md") ? ".md" : "";
    const base = md ? path.slice(0, -3) : path;
    const pair = pairs.find(
        (pair) =>
            base === pair.path ||
            base === `/comparisons/${[...pair.ids].reverse().join("-vs-")}`,
    );
    if (
        pair &&
        pairs.some(
            (candidate) =>
                candidate.path === pair.path &&
                candidate.ids.join("\0") !== pair.ids.join("\0"),
        )
    )
        return null;
    return pair ? `${pair.path}${md}` : null;
}

export const COMPARISON_METHOD =
    "Each exact-model record needs at least three positive finite mechanical fields (peak torque, rated torque, maximum speed, mass), including torque. Pairs share at least three fields and the same drive category. Each eligible model proposes up to three nearest peers by mean relative difference across shared fields; ties use sorted IDs. Proposals are deduplicated, so incoming links can exceed three. This is a discoverability heuristic, not engineering compatibility or measured performance. Controller, bare-reducer, family/series and sparse records are excluded; zeros and nulls do not establish similarity. An authored evidence dossier takes precedence. Arbitrary gallery selections remain available but are not generated SEO pages.";

export function comparisonTitle(
    pair: ComparisonPair,
    records: readonly ComparisonRecord[],
): string {
    return (
        AUTHORED_COMPARISONS.find((authored) => authored.path === pair.path)?.title ??
        pair.ids
            .map((id) => records.find((record) => record.id === id)?.name ?? id)
            .join(" vs ")
    );
}

// Pure snapshot factory: callers cache only their immutable production catalog.
// Synthetic or mutable record inputs always get a fresh snapshot.
export function comparisonSnapshot(records: readonly ComparisonRecord[]) {
    const directory = comparisonDirectory(records).map((pair) => {
        const copy = { ...pair, ids: [...pair.ids] as [string, string] };
        Object.freeze(copy.ids);
        return Object.freeze(copy);
    });
    const authored = authoredComparisonDirectory(records).map((pair) => {
        const copy = { ...pair, ids: [...pair.ids] as [string, string] };
        Object.freeze(copy.ids);
        return Object.freeze(copy);
    });
    const groups = groupsForPairs(directory).map((group) =>
        Object.freeze({ ...group, pairs: Object.freeze(group.pairs) }),
    );
    return Object.freeze({
        directory: Object.freeze(directory),
        authored: Object.freeze(authored),
        groups: Object.freeze(groups),
    });
}

export function comparisonGroups(records: readonly ComparisonRecord[]) {
    return groupsForPairs(comparisonDirectory(records));
}

function groupsForPairs(pairs: readonly ComparisonPair[]) {
    return [...new Set(pairs.map((pair) => pair.category))].sort().map((category) => ({
        category,
        pairs: pairs.filter(
            (pair) =>
                pair.category === category &&
                !AUTHORED_COMPARISONS.some((authored) => authored.path === pair.path),
        ),
    }));
}
