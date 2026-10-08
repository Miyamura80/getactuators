import { gearboxOnlyIds } from "./evidence";

// Dependency-neutral: no catalog import, filesystem, server or React dependency.
export interface ComparisonRecord {
    id: string;
    name: string;
    category: string;
    peak_torque_nm: number | null;
    rated_torque_nm: number | null;
    max_speed_rpm: number | null;
    weight_g: number | null;
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
    !a.id.includes("-vs-") &&
    !gearboxOnlyIds.has(a.id) &&
    !/\b(series|family|controller|driver)\b/i.test(a.name) &&
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

export function comparisonDirectory(
    records: readonly ComparisonRecord[],
): ComparisonPair[] {
    const authored = AUTHORED_COMPARISONS.filter((pair) =>
        pair.ids.every(
            (id) => records.filter((record) => record.id === id).length === 1,
        ),
    );
    const paths = new Set(authored.map((pair) => pair.path));
    return [
        ...buildComparisonRegistry(records).filter((pair) => !paths.has(pair.path)),
        ...authored,
    ].sort((a, b) => order(a.path, b.path));
}

export function authoredComparisonDirectory(records: readonly ComparisonRecord[]) {
    const directory = comparisonDirectory(records);
    return AUTHORED_COMPARISONS.filter((authored) =>
        directory.some((pair) => pair.path === authored.path),
    );
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

export function comparisonGroups(records: readonly ComparisonRecord[]) {
    const pairs = comparisonDirectory(records);
    return [...new Set(pairs.map((pair) => pair.category))].sort().map((category) => ({
        category,
        pairs: pairs.filter(
            (pair) =>
                pair.category === category &&
                !AUTHORED_COMPARISONS.some((authored) => authored.path === pair.path),
        ),
    }));
}
