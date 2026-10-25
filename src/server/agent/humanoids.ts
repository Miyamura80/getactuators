import {
    ACTUATOR_TYPES,
    ACTUATOR_TYPE_LABEL,
    HUMANOIDS,
    HUMANOIDS_AS_OF,
    HUMANOIDS_PATH,
    type Humanoid,
    type HumanoidJoint,
    REE_FRACTION,
    SIZE_CLASSES,
    type Sourced,
    humanoidTotals,
    jointLabel,
    magnetRangeG,
    reeTotalKg,
    sourceOf,
} from "@/humanoids";
import { absoluteUrl } from "../site";
import * as ld from "./jsonld";
import { mdLink, mdTable, usd } from "./md";
import type { Page } from "./page-types";

// Markdown twin of /humanoids: the fleet totals, then one joint table per
// robot, then the magnet method.

const range = (s: { value: number; range?: readonly [number, number] }, digits = 2) =>
    s.range
        ? `${s.range[0].toFixed(digits)} to ${s.range[1].toFixed(digits)}`
        : s.value.toFixed(digits);

const figure = (s?: Sourced<number>) =>
    s
        ? `${s.value} ${s.unit ?? ""}${s.confidence === "reported" ? "" : ` (${s.confidence})`}`
        : "";

function mix(h: Humanoid): string {
    const t = humanoidTotals(h).actuatorCountByType;
    return ACTUATOR_TYPES.filter((k) => t[k])
        .map((k) => `${t[k]} ${ACTUATOR_TYPE_LABEL[k]}`)
        .join(", ");
}

function jointRow(j: HumanoidJoint): string[] {
    const type = `${ACTUATOR_TYPE_LABEL[j.actuatorType]}${j.typeConfidence === "estimated" ? " (estimated)" : ""}`;
    const motor =
        j.actuatorId && j.motor
            ? mdLink(j.motor, `/actuators/${j.actuatorId}`)
            : (j.motor ?? "");
    return [
        jointLabel(j.canonical),
        String(j.count),
        type,
        motor,
        figure(j.peakTorqueNm) || figure(j.peakForceN),
        range(j.magnetMassG, 1),
        j.sources.map((id) => mdLink(sourceOf(id).title, sourceOf(id).url)).join("; "),
    ];
}

function robotSection(h: Humanoid): string {
    const t = humanoidTotals(h);
    const ree = reeTotalKg(t);
    const head = `## ${h.name} (${h.brand})\n\n${h.summary}\n\n- **Actuators:** ${t.actuators} (${mix(h)})\n- **DOF:** ${h.dof ?? "not published"}\n- **Magnet:** ${range(t.magnetMassKg)} kg NdFeB (estimated)\n- **Rare earths:** ${range(ree)} kg (Nd ${range(t.reeKg.nd, 3)}, Pr ${range(t.reeKg.pr, 3)}, Dy ${range(t.reeKg.dy, 3)}, Tb ${range(t.reeKg.tb, 3)})`;
    const notes = h.notCounted ? `\n- **Not counted:** ${h.notCounted}` : "";
    const inferred = [...new Set(h.joints.map((j) => j.inferredFrom).filter(Boolean))];
    const basis = inferred.length
        ? `\n\nEstimated types rest on: ${inferred.join(" / ")}.`
        : "";
    const table = mdTable(
        ["Joint", "Count", "Type", "Motor", "Peak", "Magnet g", "Sources"],
        h.joints.map(jointRow),
    );
    return `${head}${notes}${basis}\n\n${table}`;
}

export function humanoidsBody(): string {
    const fleet = mdTable(
        ["Robot", "DOF", "Actuators", "Mix", "Magnet kg", "REE kg", "Price"],
        HUMANOIDS.map((h) => {
            const t = humanoidTotals(h);
            return [
                `${h.name} (${h.brand})`,
                h.dof === null ? "n/a" : String(h.dof),
                String(t.actuators),
                mix(h),
                range(t.magnetMassKg),
                range(reeTotalKg(t)),
                h.price_usd === null ? "n/a" : usd(h.price_usd),
            ];
        }),
    );
    const classes = mdTable(
        [
            "Class",
            "Peak torque up to",
            "Peak force up to",
            "Airgap x length",
            "Magnet g per motor",
        ],
        SIZE_CLASSES.map((c) => {
            const [lo, hi] = magnetRangeG(c.id);
            const cap = (n: number, u: string) =>
                Number.isFinite(n) ? `${n} ${u}` : "above";
            return [
                c.label,
                cap(c.maxTorqueNm, "N·m"),
                cap(c.maxForceN, "N"),
                `${c.airgapDiameterMm} x ${c.activeLengthMm} mm`,
                `${lo} to ${hi}`,
            ];
        }),
    );
    const pct = (f: readonly [number, number]) =>
        `${Number((f[0] * 100).toFixed(2))} to ${Number((f[1] * 100).toFixed(2))}%`;
    return `# What moves each joint

${HUMANOIDS.length} humanoids mapped joint by joint onto one canonical joint set (neck, waist, and per side shoulder pitch, roll and yaw, elbow, wrist, hand, hip yaw, roll and pitch, knee, ankle pitch and roll): actuator type, motor, peak torque or force, and estimated magnet and rare-earth content. As of ${HUMANOIDS_AS_OF}. Interactive version: ${absoluteUrl(HUMANOIDS_PATH)}. JSON: ${absoluteUrl("/api/v1/humanoids")}.

Confidence: "reported" figures come from the maker, its URDF or a cited spec page; "estimated" types and figures say what they were inferred from. Magnet and rare-earth masses are always estimated.

## Fleet

${fleet}

${HUMANOIDS.map(robotSection).join("\n\n")}

## Magnet mass method

Each actuator gets a motor size class from its peak torque (rotary) or force (linear), or from its joint and the robot's mass when neither is published. Magnet mass = pi x airgap diameter x active length x magnet thickness x arc fill (70 to 90%) x 7.5 g/cm³ (sintered NdFeB). Hydraulic joints carry no magnet at the joint.

${classes}

Rare earths by magnet mass: Nd ${pct(REE_FRACTION.nd)}, Pr ${pct(REE_FRACTION.pr)}, Dy ${pct(REE_FRACTION.dy)}, Tb ${pct(REE_FRACTION.tb)}. Sources: ${["fai-magnets", "jda-ndfeb", "crystals-gbd"].map((id) => mdLink(sourceOf(id).title, sourceOf(id).url)).join("; ")}.`;
}

const TITLE = "Humanoid joint map";

export const HUMANOIDS_PAGE: Page = {
    path: HUMANOIDS_PATH,
    kind: "spa",
    title: TITLE,
    description: `What actuator moves each joint of ${HUMANOIDS.length} humanoids, from Optimus to Unitree G1, with estimated magnet and rare-earth kg per robot.`,
    body: humanoidsBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", HUMANOIDS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: HUMANOIDS_PATH },
        ]),
        humanoidsItemList(),
    ],
};

// schema.org ItemList of Product, one per humanoid, linking to its view.
export function humanoidsItemList(): Record<string, unknown> {
    return {
        "@type": "ItemList",
        name: "Humanoid robots by joint actuator",
        numberOfItems: HUMANOIDS.length,
        itemListElement: HUMANOIDS.map((h, i) => {
            const t = humanoidTotals(h);
            const url = absoluteUrl(`${HUMANOIDS_PATH}?robot=${h.id}`);
            const dof =
                h.dof === null
                    ? []
                    : [
                          {
                              "@type": "PropertyValue",
                              name: "Degrees of freedom",
                              value: h.dof,
                          },
                      ];
            return {
                "@type": "ListItem",
                position: i + 1,
                url,
                item: {
                    "@type": "Product",
                    name: h.name,
                    brand: { "@type": "Brand", name: h.brand },
                    category: "Humanoid robot",
                    description: h.summary,
                    url,
                    additionalProperty: [
                        {
                            "@type": "PropertyValue",
                            name: "Actuators",
                            value: t.actuators,
                        },
                        ...dof,
                        {
                            "@type": "PropertyValue",
                            name: "Estimated NdFeB magnet mass",
                            value: t.magnetMassKg.value,
                            minValue: t.magnetMassKg.range?.[0],
                            maxValue: t.magnetMassKg.range?.[1],
                            unitText: "kg",
                        },
                    ],
                },
            };
        }),
    };
}
