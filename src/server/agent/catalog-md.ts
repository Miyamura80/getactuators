import { ACTUATORS, type Actuator, CATEGORIES, type Robot } from "@/catalog";
import { resolveJoints, robotsUsingActuator } from "@/catalog/query";
import { absoluteUrl } from "../site";
import { bullets, humanize, mdLink, mdTable, mdText, num, usd } from "./md";

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
        ["Data status", a.verified ? "verified against sources" : "unverified"],
    ];
    return rows.map(([k, v]) => [k, mdText(v)]);
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
        `## Specifications\n\n${mdTable(["Spec", "Value"], specRows(a))}`,
        `## Use cases\n\n${bullets(a.use_cases.map(humanize))}`,
    ];
    if (robots.length > 0) {
        sections.push(
            `## Robots that use it\n\n${bullets(robots.map((r) => `${mdText(r.name)} by ${mdText(r.brand)}: ${mdText(r.summary)}`))}`,
        );
    }
    if (a.notes) sections.push(`## Notes\n\n${mdText(a.notes)}`);
    const sources = [a.product_url, a.datasheet_url, ...a.sources].filter(
        (u, i, all): u is string => Boolean(u) && all.indexOf(u) === i,
    );
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

export function robotSection(r: Robot, level = 2): string {
    const h = "#".repeat(level);
    const facts = [
        `Brand: ${mdText(r.brand)}${r.country ? ` (${mdText(r.country)})` : ""}`,
        `Degrees of freedom: ${r.dof}`,
        `Payload: ${num(r.payload_kg, "kg")}`,
        `Reach: ${num(r.reach_mm, "mm", 0)}`,
        `Weight: ${num(r.weight_kg, "kg", 2)}`,
        `Price: ${usd(r.price_usd)}${r.price_max_usd ? ` to ${usd(r.price_max_usd)}` : ""}`,
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
