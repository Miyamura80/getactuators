import type { ApiContext } from "@/api/http";
import { humanoidDetail, humanoidList } from "@/api/humanoids";
import { findPerson, peopleQuery } from "@/api/people";
import { ACTUATOR_TYPE_LABEL, type ActuatorType, SOURCES } from "@/humanoids";
import { toAbsolute } from "../jsonld";
import { bullets, mdLink, mdTable, mdText, num, usd } from "../md";
import {
    type SourceNotes,
    type SourceRef,
    country,
    filterSummary,
    idTwin,
    sourceNotes,
} from "./shared";

// Markdown twins of /api/v1/humanoids (joint-by-joint actuator map) and
// /api/v1/people (the /people directory).

interface Figure {
    value: number;
    unit: string | null;
    confidence: string;
    low: number | null;
    high: number | null;
    sources: string[];
}

// Humanoid figures cite bare URLs; title them from the /humanoids registry.
const TITLES = new Map(
    Object.values(SOURCES).map((s) => [toAbsolute(s.url), s.title] as const),
);
const CATALOG = toAbsolute("/actuators/");

export function titled(urls: readonly string[]): SourceRef[] {
    return urls.map((url) => ({
        url,
        title:
            TITLES.get(url) ??
            (url.startsWith(CATALOG)
                ? `actuatorlist catalog: ${url.slice(CATALOG.length)}`
                : url),
    }));
}

// "1.2 kg (0.9-1.5, estimated)[^3]": a humanoid figure with its range and
// footnotes for its own sources.
function figure(f: Figure | null, fn: SourceNotes, digits = 1): string {
    if (!f) return "n/a";
    const r = (x: number) => num(x, "", digits);
    const range =
        f.low !== null && f.high !== null && f.low !== f.high
            ? `${r(f.low)}-${r(f.high)}, `
            : "";
    // Ratios read "14.3:1", other units take a space ("88 N·m").
    const u = f.unit ? mdText(f.unit) : "";
    const unit = !u || u.startsWith(":") ? u : ` ${u}`;
    return `${r(f.value)}${unit} (${range}${f.confidence})${fn.ref(titled(f.sources))}`;
}

const typeMix = (counts: Record<string, number>) =>
    Object.entries(counts)
        .map(([t, n]) => `${n} ${ACTUATOR_TYPE_LABEL[t as ActuatorType] ?? t}`)
        .join(", ");

export function listHumanoids(): string {
    const list = humanoidList();
    const fn = sourceNotes();
    const rows = list.data.map((h) => [
        idTwin(h.name, "humanoids", h.id),
        mdText(h.brand),
        country(h.country),
        num(h.dof),
        String(h.actuators),
        mdText(typeMix(h.actuator_count_by_type)),
        figure(h.magnet_mass_kg, fn, 2),
        usd(h.actuator_bom_usd),
    ]);
    return [
        "# Humanoids with actuator totals",
        `${list.data.length} humanoids, as of ${list.as_of}. Joint-by-joint detail: /api/v1/humanoids/{id}.md.`,
        mdTable(
            [
                "Humanoid",
                "Brand",
                "Country",
                "DOF",
                "Actuators",
                "By type",
                "NdFeB magnet (kg)",
                "Actuator BOM",
            ],
            rows,
        ),
        fn.section(),
    ].join("\n\n");
}

export function getHumanoid(ctx: ApiContext): string {
    const h = humanoidDetail(ctx);
    const fn = sourceNotes();
    const ree = h.ree_kg;
    const joints = h.joints.map((j) => [
        mdText(j.canonical),
        String(j.count),
        `${ACTUATOR_TYPE_LABEL[j.actuator_type] ?? j.actuator_type} (${j.type_confidence})`,
        j.actuator_id
            ? idTwin(j.motor ?? j.actuator_id, "actuators", j.actuator_id)
            : mdText(j.motor ?? "n/a"),
        mdText(j.reducer ?? "n/a"),
        j.peak_torque_nm ? figure(j.peak_torque_nm, fn) : figure(j.peak_force_n, fn),
        j.motor_sizing ? figure(j.motor_sizing.gear_ratio, fn) : "n/a",
        figure(j.magnet_mass_g, fn, 0),
        fn.ref(j.sources),
    ]);
    const cost = h.bom.cost;
    const slices = cost.slices.map((s) => [
        mdText(s.label),
        s.category,
        String(s.count),
        `${usd(s.value)} (${usd(s.low)}-${usd(s.high)})`,
        `${Math.round(s.share * 100)}%`,
        fn.ref(titled(s.unit_value?.sources ?? [])),
    ]);
    return [
        `# ${mdText(h.name)} by ${mdText(h.brand)}: actuators joint by joint`,
        mdText(h.summary),
        bullets(
            [
                `Id: \`${h.id}\`; country: ${country(h.country)}`,
                `DOF: ${num(h.dof)}; height: ${num(h.height_m, "m", 2)}; weight: ${num(h.weight_kg, "kg")}; price: ${usd(h.price_usd)}`,
                `Actuators: ${h.actuators} (${mdText(typeMix(h.actuator_count_by_type))})`,
                `NdFeB magnet: ${figure(h.magnet_mass_kg, fn, 2)}`,
                `Rare earth (kg): Nd ${figure(ree.nd, fn, 3)}, Pr ${figure(ree.pr, fn, 3)}, Dy ${figure(ree.dy, fn, 3)}, Tb ${figure(ree.tb, fn, 3)}`,
                `Actuator cost: ${usd(cost.actuators.value)} (${usd(cost.actuators.low)}-${usd(cost.actuators.high)})`,
                h.robot_id
                    ? `Catalog robot: ${idTwin(h.robot_id, "robots", h.robot_id)}`
                    : "",
                h.not_counted ? `Not counted: ${mdText(h.not_counted)}` : "",
                `Page: ${mdLink("/humanoids", h.page_url)}`,
                h.sources.length ? `Sources: ${fn.ref(h.sources)}` : "",
            ].filter(Boolean),
        ),
        `## Joints\n\n${mdTable(
            [
                "Joint",
                "Count",
                "Type",
                "Motor",
                "Reducer",
                "Peak torque or force",
                "Gear ratio",
                "Magnet (g)",
                "Sources",
            ],
            joints,
        )}`,
        slices.length
            ? `## Actuator cost by design\n\n${mdTable(["Slice", "Category", "Count", "Cost", "Share", "Sources"], slices)}\n\nMass and magnet breakdowns and rare earth by design are in the JSON.`
            : "",
        fn.section(),
    ].join("\n\n");
}

export function listPeople(ctx: ApiContext): string {
    const list = peopleQuery(ctx);
    const rows = list.data.map((p) => [
        idTwin(p.name, "people", p.id),
        mdText(p.role),
        mdText(p.affiliation.name),
        mdText(p.domain_label),
    ]);
    return [
        `# People in actuators and rare earths${filterSummary(ctx.url)}`,
        list.total > 0
            ? `${list.total} people, as of ${list.as_of}. Each meets one of these criteria:`
            : "No people match this query.",
        list.total > 0 ? bullets(list.criteria.map(mdText)) : "",
        rows.length ? mdTable(["Person", "Role", "Affiliation", "Domain"], rows) : "",
    ].join("\n\n");
}

type Org = ReturnType<typeof findPerson>["affiliation"];

const orgText = (o: Org) =>
    `${o.company_id ? idTwin(o.name, "companies", o.company_id) : mdLink(o.name, o.url)}${o.country ? `, ${country(o.country)}` : ""}`;

export function getPerson(ctx: ApiContext): string {
    const p = findPerson(ctx);
    const fn = sourceNotes();
    const works = p.key_works.map(
        (w) => `${mdLink(w.title, w.url)}${w.year ? ` (${w.year})` : ""}, ${w.kind}`,
    );
    const links = [
        ...p.links.map((l) => mdLink(l.kind, l.url)),
        ...p.site_links.map((l) => mdLink(l.label, l.url)),
    ];
    return [
        `# ${mdText(p.name)}${p.local_name ? ` (${mdText(p.local_name)})` : ""}`,
        `${mdText(p.role)}. ${mdText(p.why_they_matter)} ${fn.ref(p.sources)}`,
        bullets([
            `Id: \`${p.id}\`; domain: ${mdText(p.domain_label)}`,
            `Affiliation: ${orgText(p.affiliation)}`,
            ...p.other_affiliations.map((o) => `Also: ${orgText(o)}`),
            `Included because: ${mdText(p.criterion)}`,
            `Page: ${mdLink("/people", p.page_url)}`,
        ]),
        works.length ? `## Key works\n\n${bullets(works)}` : "",
        links.length ? `## Links\n\n${bullets(links)}` : "",
        fn.section(),
    ].join("\n\n");
}
