import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import {
    AUTHORED_COMPARISONS,
    authoredComparisonDirectory,
    buildComparisonRegistry,
    canonicalComparisonPath,
    comparisonDirectory,
    comparisonSnapshot,
} from "@/catalog/comparison-registry";

test("ambiguous external path identities fail closed in either route direction", () => {
    const pairs = [
        {
            ids: ["a", "vs-b"] as [string, string],
            category: "smart_servo",
            path: "/comparisons/a-vs-vs-b",
        },
        {
            ids: ["a-vs", "b"] as [string, string],
            category: "smart_servo",
            path: "/comparisons/a-vs-vs-b",
        },
    ];
    for (const path of [
        "/comparisons/a-vs-vs-b",
        "/comparisons/b-vs-a-vs",
        "/comparisons/vs-b-vs-a",
    ]) {
        expect(canonicalComparisonPath(path, pairs)).toBeNull();
        expect(canonicalComparisonPath(`${path}.md`, [...pairs].reverse())).toBeNull();
    }
});

test("bare component boundaries survive new IDs, renamed SKUs and reducer aliases", () => {
    const reducer = model("nabtesco-rv-42n");
    for (const name of [
        "Bare cycloidal reducer SKU",
        "Precision gearbox",
        "Exact RV42 component",
        "Strain wave gearhead",
    ]) {
        const records = [1, 2].map((n) => ({
            ...reducer,
            id: `new-reducer-${n}`,
            name: `${name}${n}`,
        }));
        expect(buildComparisonRegistry(records)).toEqual([]);
    }
    for (const name of [
        "FOC controller",
        "Motor driver",
        "Reducer family",
        "Gearbox series",
    ]) {
        expect(
            buildComparisonRegistry([base, { ...base, id: "component", name }]),
        ).toEqual([]);
    }
    const motor = model("cubemars-ri60-kv120");
    expect(
        buildComparisonRegistry([
            motor,
            { ...motor, id: "new-frameless", name: "Frameless motor" },
        ]),
    ).toHaveLength(1);
    expect(
        buildComparisonRegistry([
            base,
            { ...base, id: "geared-motor", name: "Integrated motor with gearbox" },
        ]),
    ).toHaveLength(1);
});

test("electrified reducer sensors do not establish a motor boundary", () => {
    const reducer = model("nabtesco-rv-42n");
    const records = [1, 2].map((n) => ({
        ...reducer,
        id: `sensor-reducer-${n}`,
        name: `Encoder gearbox SKU${n}`,
        voltage_v: 5,
    }));
    expect(buildComparisonRegistry(records)).toEqual([]);
    const unknown = [1, 2].map((n) => ({
        ...reducer,
        id: `unknown-${n}`,
        name: `Unknown SKU${n}`,
        voltage_v: Number.POSITIVE_INFINITY,
    }));
    expect(buildComparisonRegistry(unknown)).toEqual([]);
});

test("immutable snapshots leave synthetic inputs mutable and never cache stale record arrays", () => {
    const records = [
        model("cubemars-ak60-6"),
        { ...model("cubemars-ak60-6"), id: "peer" },
    ];
    const before = comparisonSnapshot(records);
    expect(before.directory).toHaveLength(1);
    expect(Object.isFrozen(before)).toBe(true);
    expect(Object.isFrozen(before.directory[0]?.ids)).toBe(true);
    expect(Object.isFrozen(before.groups[0]?.pairs)).toBe(true);
    expect(Object.isFrozen(records)).toBe(false);
    records[1] = { ...model("cubemars-ak60-6"), id: "different-peer" };
    const after = comparisonSnapshot(records);
    expect(after.directory).toEqual(buildComparisonRegistry(records));
    expect(after.directory[0]?.path).not.toBe(before.directory[0]?.path);
    expect(before.directory[0]?.ids).toContain("peer");
});

test("snapshot freezing does not mutate authored registry metadata", () => {
    comparisonSnapshot(ACTUATORS);
    expect(Object.isFrozen(AUTHORED_COMPARISONS[0])).toBe(false);
    expect(Object.isFrozen(AUTHORED_COMPARISONS[0]?.ids)).toBe(false);
});

test("authored metadata cannot replace a different generated pair at its URL", () => {
    const records = ["a", "b", "c", "d"].map((id) => ({ ...base, id }));
    const authored = [
        {
            ids: ["c", "d"] as [string, string],
            category: base.category,
            path: "/comparisons/a-vs-b",
            title: "Conflicting authored pair",
        },
    ];
    expect(() => comparisonDirectory(records, authored)).toThrow(
        "Invalid authored comparison path identity",
    );
    expect(() => comparisonSnapshot(records, authored)).toThrow(
        "Invalid authored comparison path identity",
    );
});

test("malformed authored pair identities fail closed on every directory surface", () => {
    for (const ids of [
        ["a", "a"],
        ["a", "vs-b"],
        ["a-vs", "b"],
        ["a", "Bad"],
        ["a"],
        ["a", "b", "c"],
    ]) {
        const records = [...new Set(ids)].map((id) => ({ ...base, id }));
        const authored = [
            {
                ids: ids as [string, string],
                category: base.category,
                path: `/comparisons/${[...ids].sort().join("-vs-")}`,
                title: "Malformed authored identity",
            },
        ];
        expect(() => comparisonDirectory(records, authored)).toThrow(
            "Invalid authored comparison IDs",
        );
        expect(() => authoredComparisonDirectory(records, authored)).toThrow(
            "Invalid authored comparison IDs",
        );
        expect(() => comparisonSnapshot(records, authored)).toThrow(
            "Invalid authored comparison IDs",
        );
    }
});

test("conflicting duplicate authored metadata fails closed regardless of input order", () => {
    const first = {
        ids: ["a", "b"] as [string, string],
        category: base.category,
        path: "/comparisons/a-vs-b",
        title: "First authored dossier",
    };
    const second = {
        ...first,
        ids: ["b", "a"] as [string, string],
        title: "Other dossier",
    };
    for (const entries of [
        [first, second],
        [second, first],
    ]) {
        const records = ["a", "b"].map((id) => ({ ...base, id }));
        expect(() => comparisonDirectory(records, entries)).toThrow(
            "Conflicting authored comparison identity",
        );
        expect(() => authoredComparisonDirectory(records, entries)).toThrow(
            "Conflicting authored comparison identity",
        );
        expect(() => comparisonSnapshot(records, entries)).toThrow(
            "Conflicting authored comparison identity",
        );
    }
});

test("authored overrides normalize reversed IDs without mutating source metadata", () => {
    const entry = {
        ids: ["b", "a"] as [string, string],
        category: base.category,
        path: "/comparisons/a-vs-b",
        title: "Valid authored dossier",
    };
    for (const records of [
        ["a", "b"].map((id) => ({ ...base, id })),
        ["a", "b"].map((id) => ({
            ...base,
            id,
            peak_torque_nm: null,
            rated_torque_nm: null,
        })),
    ]) {
        const expected = { ...entry, ids: ["a", "b"] as [string, string] };
        expect(comparisonDirectory(records, [entry])).toEqual([expected]);
        expect(authoredComparisonDirectory(records, [entry])).toEqual([expected]);
        const snapshot = comparisonSnapshot(records, [entry]);
        expect(snapshot.directory).toEqual([expected]);
        expect(snapshot.authored).toEqual([expected]);
        expect(snapshot.groups.flatMap((group) => group.pairs)).toEqual([]);
        for (const path of [entry.path, "/comparisons/b-vs-a"]) {
            expect(canonicalComparisonPath(path, snapshot.directory)).toBe(entry.path);
            expect(canonicalComparisonPath(`${path}.md`, snapshot.directory)).toBe(
                `${entry.path}.md`,
            );
        }
        expect(entry.ids).toEqual(["b", "a"]);
        expect(Object.isFrozen(entry.ids)).toBe(false);
    }
    for (const records of [
        [{ ...base, id: "a" }],
        ["a", "b", "b"].map((id) => ({ ...base, id })),
    ]) {
        expect(comparisonDirectory(records, [entry])).toEqual([]);
        expect(authoredComparisonDirectory(records, [entry])).toEqual([]);
        expect(comparisonSnapshot(records, [entry]).authored).toEqual([]);
    }
});

function model(id: string) {
    const record = ACTUATORS.find((a) => a.id === id);
    if (!record) throw new Error(`Missing model: ${id}`);
    return record;
}
const base = model("cubemars-ak60-6");
test("whole hyphen-delimited vs tokens are reserved at both ID boundaries", () => {
    const records = ["a", "a-vs", "b", "vs-b", "vs", "a-vs-b"].map((id) => ({
        ...base,
        id,
        name: `Exact ${id}`,
    }));
    const pairs = buildComparisonRegistry(records);
    expect(pairs.map((pair) => pair.ids)).toEqual([["a", "b"]]);
    expect(buildComparisonRegistry([...records].reverse())).toEqual(pairs);
    for (const path of [
        "/comparisons/a-vs-vs-b",
        "/comparisons/b-vs-a-vs",
        "/comparisons/vs-b-vs-a",
    ]) {
        expect(canonicalComparisonPath(path, pairs)).toBeNull();
    }
    expect(canonicalComparisonPath("/comparisons/b-vs-a", pairs)).toBe(
        "/comparisons/a-vs-b",
    );
    const normal = ["avsync", "servo-vslot", "b"].map((id) => ({ ...base, id }));
    expect(buildComparisonRegistry(normal)).toHaveLength(3);
});
