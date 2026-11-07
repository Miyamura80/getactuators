import { expect, test } from "bun:test";
import { ACTUATORS, type Actuator } from "@/catalog";
import * as evidence from "@/catalog/evidence";
import { actuatorBody, categoryLabel } from "@/server/agent/catalog-md";
import { humanize } from "@/server/agent/md";

test("family membership is exact, not an ordinary product's brand prefix", () => {
    const predicate = evidence.isReducerFamily;
    expect(typeof predicate).toBe("function");
    for (const id of familyIds) expect(predicate!(id)).toBe(true);
    for (const id of [
        "leaderdrive-future-integrated",
        "nidec-future-integrated",
        "cubemars-ak80-9",
    ]) {
        expect(predicate(id)).toBe(false);
        const ordinary = { ...ACTUATORS.find((a) => a.id === "cubemars-ak80-9")!, id };
        expect(evidence.evidenceFor(ordinary).label).not.toContain("Family-level");
        expect(specValue(actuatorBody(ordinary), "Rated torque")).not.toContain(
            "Family-level",
        );
    }
});

const familyIds = [
    "leaderdrive-lcs",
    "leaderdrive-lhd",
    "leaderdrive-lhs",
    "nidec-flexwave-wpg",
    "nidec-smart-flexwave-srh",
];

function ordinaryTextRows(a: Actuator): [string, string][] {
    return [
        ["Category", categoryLabel(a.category)],
        ["Availability", a.availability ? humanize(a.availability) : "n/a"],
        ["Communication", a.comm?.join(", ") || "n/a"],
        ["Control modes", a.control_modes?.join(", ") || "n/a"],
        [
            "Integrated driver",
            a.integrated_driver === null ? "n/a" : a.integrated_driver ? "yes" : "no",
        ],
    ];
}

function specValue(body: string, label: string): string {
    const row = body.split("\n").find((line) => line.startsWith(`| ${label} | `));
    expect(row).toBeDefined();
    return row!.slice(`| ${label} | `.length, -2);
}

test("family qualifiers apply to physical specs and quotes, not ordinary text rows", () => {
    for (const id of familyIds) {
        const a = ACTUATORS.find((record) => record.id === id)!;
        const body = actuatorBody(a);
        for (const [label, value] of ordinaryTextRows(a))
            expect(specValue(body, label!)).toBe(value!);
        for (const label of [
            "Peak torque",
            "Rated torque",
            "Max speed",
            "Gear ratio",
            "Weight",
            "Torque density",
            "Price",
            "Price per Nm",
            "Voltage",
            "Peak current",
        ])
            expect(specValue(body, label)).toContain(
                "Family-level catalog value; confirm frame, ratio and variant.",
            );
        for (const label of ["Backdrivable", "Backlash", "Encoder"])
            expect(specValue(body, label)).toBe(
                "Legacy catalog placeholder; not a measured family rating. See engineering notes.",
            );
    }
});
