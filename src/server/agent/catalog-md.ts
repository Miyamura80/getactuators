import { ACTUATORS, type Actuator, CATEGORIES, type Robot } from "@/catalog";
import { evidenceFor, fieldCaveat } from "@/catalog/evidence";
import { resolveJoints, robotsUsingActuator } from "@/catalog/query";
import { absoluteUrl } from "../site";
import { engineeringEvidenceSection } from "./engineering-evidence";
import { bullets, humanize, mdLink, mdTable, mdText, num, usd } from "./md";
import {
    engineeringNotes,
    engineeringSources,
    productSummary,
} from "./product-content";
import { sizeAJointSection } from "./size-a-joint";

// Markdown fragments describing catalog records. Shared by the page twins,
// llms-full.txt and the prerendered HTML.

export function actuatorPath(id: string): string {
    return `/actuators/${encodeURIComponent(id)}`;
}

export function categoryLabel(slug: string): string {
    return CATEGORIES.find((c) => c.slug === slug)?.label ?? humanize(slug);
}

// "RobStride 02 (RobStride)" style label used in lists.
export function actuatorLabel(a: Actuator): string {
    return `${a.name} (${a.brand})`;
}

export function actuatorSummary(a: Actuator): string {
    const researched = productSummary(a.id);
    if (researched) return researched;
    const parts = [
        `${categoryLabel(a.category)} actuator from ${a.brand}${a.country ? ` (${a.country})` : ""}.`,
        `Peak torque ${num(a.peak_torque_nm, "Nm")}, rated ${num(a.rated_torque_nm, "Nm")},`,
        `weight ${num(a.weight_g, "g", 0)}, torque density ${num(a.torque_density_nm_per_kg, "Nm/kg")},`,
        `price ${usd(a.price_usd)}.`,
    ];
    return parts.join(" ");
}

function specRows(a: Actuator): string[][] {
    const rows: [string, string][] = [
        ["Category", categoryLabel(a.category)],
        ["Peak torque", num(a.peak_torque_nm, "Nm")],
        ["Rated torque", num(a.rated_torque_nm, "Nm")],
        ["Max speed", num(a.max_speed_rpm, "rpm", 0)],
        ["Gear ratio", a.gear_ratio ?? "n/a"],
        ["Weight", num(a.weight_g, "g", 0)],
        ["Torque density", num(a.torque_density_nm_per_kg, "Nm/kg")],
        ["Price", usd(a.price_usd)],
        ["Price per Nm", a.price_per_nm === null ? "n/a" : `$${num(a.price_per_nm)}`],
        [
            "Backdrivable",
            a.backdrivable === null ? "n/a" : a.backdrivable ? "yes" : "no",
        ],
        ["Backlash", num(a.backlash_arcmin, "arcmin")],
        ["Voltage", a.voltage_v === null ? "n/a" : `${a.voltage_v} V`],
        ["Peak current", num(a.peak_current_a, "A")],
        ["Communication", a.comm?.join(", ") || "n/a"],
        ["Control modes", a.control_modes?.join(", ") || "n/a"],
        ["Encoder", a.encoder ?? "n/a"],
        [
            "Integrated driver",
            a.integrated_driver === null ? "n/a" : a.integrated_driver ? "yes" : "no",
        ],
        ["Availability", a.availability ? humanize(a.availability) : "n/a"],
        ["Data status", evidenceFor(a).label],
    ];
    return rows.map(([k, v]) => {
        if (
            productSummary(a.id) &&
            ["Backlash", "Backdrivable", "Encoder"].includes(k)
        ) {
            return [
                k,
                "Legacy catalog placeholder; not a measured family rating. See engineering notes.",
            ];
        }
        const fields: Record<string, string> = {
            "Peak torque": "peak_torque_nm",
            "Rated torque": "rated_torque_nm",
            "Max speed": "max_speed_rpm",
            "Gear ratio": "gear_ratio",
            Price: "price_usd",
            "Price per Nm": "price_per_nm",
            Voltage: "voltage_v",
            "Peak current": "peak_current_a",
            Weight: "weight_g",
            Encoder: "encoder",
            "Torque density": "torque_density_nm_per_kg",
            Backdrivable: "backdrivable",
            Backlash: "backlash_arcmin",
        };
        const field = fields[k];
        const caveat = field ? fieldCaveat(a, field) : undefined;
        return [k, mdText(`${v}${caveat ? `: ${caveat}` : ""}`)];
    });
}

function similarTo(a: Actuator, limit = 5): Actuator[] {
    return ACTUATORS.filter((b) => b.category === a.category && b.id !== a.id)
        .sort(
            (x, y) =>
                (y.torque_density_nm_per_kg ?? -1) - (x.torque_density_nm_per_kg ?? -1),
        )
        .slice(0, limit);
}

export function actuatorBody(a: Actuator): string {
    const robots = robotsUsingActuator(a.id);
    const similar = similarTo(a);
    const sections = [
        `# ${mdText(a.name)} by ${mdText(a.brand)}`,
        `> ${mdText(actuatorSummary(a))}`,
        `## Specifications\n\n${mdTable(["Spec", "Value"], specRows(a))}${a.id === "cubemars-ak80-9" ? "\n\n**Legacy catalog / revision conflict:** retained catalog fields are not revalidated by this editorial review. Catalog mass is 485 g and motor-side encoder is 14-bit; the [reviewed V3.0 KV100 model page](https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html) lists 490 g and 16-bit inner sensing, while the [AK family manual V3.2.0](https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf) lists 21-bit. Confirm the installed revision before using these values or derived torque density; the documentation discrepancy is unresolved." : ""}`,
        `## Use cases\n\n${bullets(a.use_cases.map(humanize))}`,
    ];
    const sizing = sizeAJointSection(a);
    if (sizing) sections.splice(3, 0, sizing);
    if (robots.length > 0) {
        sections.push(
            `## Robots that use it\n\n${bullets(robots.map((r) => `${mdLink(r.name, absoluteUrl(`/robots#${encodeURIComponent(r.id)}`))} by ${mdText(r.brand)}: ${mdText(r.summary)}`))}`,
        );
    }
    if (a.notes && !productSummary(a.id))
        sections.push(`## Notes\n\n${mdText(a.notes)}`);
    const engineering = engineeringNotes(a.id);
    if (engineering) sections.push(engineering);
    if (a.id === "cubemars-ak80-9" || a.id === "xiaomi-cybergear") {
        sections.push(
            "## Engineering comparison\n\nRead the [AK80-9 V3.0 KV100 versus original CyberGear comparison](/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear) for source-qualified efficiency, thermal duty, precision and modeling boundaries. Hardware/firmware identity and unresolved document conflicts matter; this is not a matched bench test. See the [selection guide](/guides/robot-actuator-selection) for a proposed validation protocol.",
        );
    }
    const researchedEvidence = engineeringEvidenceSection(a.id);
    if (researchedEvidence) sections.push(researchedEvidence);
    const sources = [
        ...engineeringSources(a.id),
        a.product_url,
        a.datasheet_url,
        ...a.sources,
    ].filter((u, i, all): u is string => Boolean(u) && all.indexOf(u) === i);
    if (sources.length > 0) {
        sections.push(`## Sources\n\n${bullets(sources.map((u) => mdLink(u, u)))}`);
    }
    if (similar.length > 0) {
        sections.push(
            `## Similar ${mdText(categoryLabel(a.category))} actuators\n\n${bullets(
                similar.map(
                    (s) =>
                        `${mdLink(actuatorLabel(s), absoluteUrl(actuatorPath(s.id)))}: ${num(s.torque_density_nm_per_kg, "Nm/kg")}`,
                ),
            )}`,
        );
    }
    sections.push(
        `## Machine-readable\n\n${bullets([
            `JSON: ${absoluteUrl(`/api/v1/actuators/${encodeURIComponent(a.id)}`)}`,
            `Catalog index for agents: ${absoluteUrl("/llms.txt")}`,
        ])}`,
    );
    return sections.join("\n\n");
}

export function actuatorTable(list: readonly Actuator[]): string {
    return mdTable(
        ["Actuator", "Brand", "Category", "Peak Nm", "Weight g", "Nm/kg", "Price"],
        list.map((a) => [
            mdLink(a.name, absoluteUrl(actuatorPath(a.id))),
            mdText(a.brand),
            mdText(categoryLabel(a.category)),
            num(a.peak_torque_nm),
            num(a.weight_g, "", 0),
            num(a.torque_density_nm_per_kg),
            usd(a.price_usd),
        ]),
    );
}

const AVAILABILITY: Record<NonNullable<Robot["availability"]>, string> = {
    shipping: "shipping",
    preorder: "pre-order",
    quote_only: "quote only",
    discontinued: "discontinued",
};

function runtimeFact(r: Robot): string | null {
    if (r.power === "mains") return "Runtime: mains-powered";
    if (r.power !== "battery") return null;
    const value = r.runtime_h == null ? "not published" : `${r.runtime_h} h`;
    return `Runtime: ${value}${r.runtime_note ? ` (${mdText(r.runtime_note)})` : ""}`;
}

function opennessFact(r: Robot): string | null {
    const o = r.openness;
    if (!o) return null;
    const parts = [
        o.cad && "CAD",
        o.urdf && "URDF",
        o.sdk && "SDK source",
        o.bom && "BOM",
    ].filter(Boolean);
    return `Published: ${parts.length ? parts.join(", ") : "none"}`;
}

// Power, buying and openness facts, for robots that have been researched.
function researchFacts(r: Robot): string[] {
    const sourcing = r.actuator_sourcing
        ? `Actuators: ${r.actuator_sourcing === "in_house" ? "designed in-house" : "bought off the shelf"}`
        : null;
    const availability = r.availability
        ? `Availability: ${AVAILABILITY[r.availability]}${r.lead_time ? ` (${mdText(r.lead_time)})` : ""}`
        : null;
    return [runtimeFact(r), sourcing, opennessFact(r), availability].filter(
        (x): x is string => x != null,
    );
}

export function robotSection(r: Robot, level = 2): string {
    const h = "#".repeat(level);
    const facts = [
        `Brand: ${mdText(r.brand)}${r.country ? ` (${mdText(r.country)})` : ""}`,
        ...(r.kind === "humanoid" ? ["Type: Humanoid"] : []),
        `Degrees of freedom: ${num(r.dof)}`,
        `Payload: ${num(r.payload_kg, "kg")}${r.payload_basis === "whole_body" ? " (whole body)" : ""}`,
        r.kind === "humanoid"
            ? `Height: ${num(r.height_m, "m", 2)}`
            : `Reach: ${num(r.reach_mm, "mm", 0)}`,
        `Weight: ${num(r.weight_kg, "kg", 2)}`,
        `Price: ${usd(r.price_usd)}${r.price_max_usd ? ` to ${usd(r.price_max_usd)}` : ""}`,
        ...researchFacts(r),
    ];
    const joints = resolveJoints(r).map((j) => [
        mdText(j.role),
        String(j.count),
        j.motor.actuator_id
            ? mdLink(
                  `${j.motor.brand} ${j.motor.name}`,
                  absoluteUrl(actuatorPath(j.motor.actuator_id)),
              )
            : mdText(`${j.motor.brand} ${j.motor.name}`),
        num(j.motor.peak_torque_nm, "Nm"),
    ]);
    return [
        `${h} ${mdText(r.name)} by ${mdText(r.brand)}`,
        mdText(r.summary),
        bullets(facts),
        mdTable(["Joint", "Count", "Motor", "Peak torque"], joints),
    ].join("\n\n");
}
