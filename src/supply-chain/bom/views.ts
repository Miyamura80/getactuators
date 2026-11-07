import { z } from "zod";
import { getCompany } from "../registry";
import { CONFIDENCES, type Sourced } from "../sourced";
import { refs, sourceRefOut, sourced, sourcedOut } from "../views";
import { materialLabel, materialPrice } from "./commodities";
import { BOM_AS_OF, BOM_CASES, type BomCase, type BomNode, bomCasePath } from "./index";
import {
    type CostStack,
    flatten,
    marginCapture,
    materialTotals,
    nodeMetrics,
} from "./metrics";
import { usesOf } from "./used-in";

// Wire shape of /bom for REST and MCP: snake_case, nulls for unknowns,
// sources inline, computed metrics alongside the cited figures. Server
// side only (zod).

// A value that is always present.
const cited = (s: Sourced<number>) => sourced(s) as z.input<typeof sourcedOut>;

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

const makerOut = z.object({
    company_id: z.string(),
    name: z.string(),
    country: z.string(),
    gross_margin: sourcedOut.nullable().describe("Latest fiscal year, as a fraction."),
});

const stackOut = z
    .object({
        raw_material_usd: z.number(),
        below_usd: z
            .number()
            .describe("What the tiers below added on top of their raw material."),
        conversion_usd: z
            .number()
            .describe(
                "This step's labour, energy, machines and overhead, plus margin we cannot attribute.",
            ),
        maker_gross_profit_usd: z
            .number()
            .describe("This node's maker's company gross margin times its unit cost."),
        short: z
            .boolean()
            .describe(
                "Inputs as modeled cost more than the node, so the bands are clipped.",
            ),
    })
    .describe(
        "A priced node's unit cost split into four bands that add up to it (computed).",
    );

const stackView = (st: CostStack | null): z.input<typeof stackOut> | null =>
    st
        ? {
              raw_material_usd: r2(st.raw),
              below_usd: r2(st.below),
              conversion_usd: r2(st.conversion),
              maker_gross_profit_usd: r2(st.profit),
              short: st.short,
          }
        : null;

const useOut = z.object({
    name: z.string(),
    brand: z.string(),
    kind: z.enum(["robot", "actuator"]),
    relation: z
        .enum(["this", "same-design"])
        .describe(
            "this: uses this very actuator; same-design: a joint of the same design.",
        ),
    count: z.number().nullable().describe("Joints of this design in the robot."),
    image_url: z
        .string()
        .nullable()
        .describe("Site-relative photo path; null when the site has none."),
    url: z
        .string()
        .nullable()
        .describe("Catalog page on this site, when there is one."),
    how: z.string(),
});

const nodeOut = z.object({
    id: z.string(),
    parent_id: z.string().nullable(),
    depth: z.number(),
    label: z.string(),
    kind: z.enum(["assembly", "component", "material"]),
    qty: z.number().describe("Units of this node in its parent."),
    count: z.number().describe("Units of this node in one actuator."),
    unit_cost: sourcedOut
        .nullable()
        .describe("What the next tier pays for one unit, USD; null when not public."),
    raw_content_usd: z
        .number()
        .describe("Raw material in one unit at the case month, USD (computed)."),
    idiot_index: z
        .number()
        .nullable()
        .describe("Unit cost over raw content (computed); null without a cost."),
    step_multiplier: z
        .number()
        .nullable()
        .describe(
            "Unit cost over the cost of its inputs (computed); null unless every input has a cost.",
        ),
    mass_g: z
        .number()
        .describe("Modeled grams in one unit (computed from the leaves)."),
    cost_stack: stackOut.nullable(),
    route: z
        .array(z.string())
        .describe(
            "Usual steps from raw material to this part, in order (our summary).",
        ),
    material: z
        .object({
            series_id: z.string(),
            label: z.string(),
            mass_g: sourcedOut,
            price_usd_per_kg: sourcedOut.nullable(),
        })
        .nullable(),
    makers: z.array(makerOut),
    maker_confidence: z
        .enum(CONFIDENCES)
        .nullable()
        .describe(
            "reported, estimated (named by analysts or press) or modeled (a typical maker stands in).",
        ),
    maker_note: z.string().nullable(),
    alternate_maker_ids: z.array(z.string()),
    process_step_ids: z
        .array(z.string())
        .describe("Steps on /manufacturing that make this node."),
    inferred: z
        .boolean()
        .describe("Structure or geometry inferred rather than seen in a teardown."),
    references: z.array(z.object({ label: z.string(), value: sourcedOut })),
    note: z.string().nullable(),
    sources: z.array(sourceRefOut),
});

const tierOut = z.object({
    node_id: z.string(),
    company_id: z.string(),
    revenue_usd: z.number(),
    gross_margin: z.number(),
    gross_profit_usd: z.number(),
    share_of_price: z.number(),
    representative: z
        .boolean()
        .describe("A typical maker stands in for an undisclosed supplier."),
});

const marginOut = z.object({
    price_usd: z.number(),
    raw_material_usd: z.number(),
    other_usd: z
        .number()
        .describe("Price left after part makers' gross profit and raw material."),
    tiers: z.array(tierOut),
});

const materialOut = z.object({
    series_id: z.string(),
    label: z.string(),
    grams: z.number(),
    cost_usd: z.number(),
    price_usd_per_kg: sourcedOut.nullable(),
});

export const bomCaseOut = z.object({
    slug: z.string(),
    url: z.string(),
    name: z.string(),
    subject: z.string(),
    actuator_id: z.string().nullable().describe("Catalog entry, for get_actuator."),
    price: sourcedOut,
    mass_g: sourcedOut.nullable(),
    volume_assumption: z.string(),
    month: z.string().describe("Month raw materials are priced at."),
    why: z.string(),
    takeaway: z.string(),
    raw_content_usd: z.number(),
    idiot_index: z.number().nullable(),
    modeled_mass_g: z.number().describe("Sum of the modeled part masses."),
    used_in: z
        .array(useOut)
        .describe("Robots and catalog actuators that use this actuator or its design."),
    nodes: z.array(nodeOut).describe("The BOM tree, parents before children."),
    materials: z.array(materialOut),
    margin_capture: marginOut,
});

export const bomListOut = z.object({
    as_of: z.string(),
    cases: z.array(
        bomCaseOut.pick({
            slug: true,
            url: true,
            name: true,
            subject: true,
            price: true,
            raw_content_usd: true,
            idiot_index: true,
            takeaway: true,
            used_in: true,
            margin_capture: true,
        }),
    ),
});

function materialView(node: BomNode, month: string) {
    const m = node.material;
    if (!m) return null;
    return {
        series_id: m.seriesId,
        label: materialLabel(m.seriesId),
        mass_g: cited(m.massG),
        price_usd_per_kg: sourced(materialPrice(m.seriesId, month)?.price),
    };
}

function makersView(node: BomNode) {
    return (node.makerIds ?? []).flatMap((id) => {
        const co = getCompany(id);
        return co
            ? [
                  {
                      company_id: id,
                      name: co.name,
                      country: co.hqCountry,
                      gross_margin: sourced(co.grossMargin),
                  },
              ]
            : [];
    });
}

export function bomCaseView(c: BomCase): z.input<typeof bomCaseOut> {
    const metrics = nodeMetrics(c);
    const root = metrics.get(c.root.id);
    const mc = marginCapture(c);
    return {
        slug: c.slug,
        url: bomCasePath(c.slug),
        name: c.name,
        subject: c.subject,
        actuator_id: c.actuatorId ?? null,
        price: cited(c.price),
        mass_g: sourced(c.massG),
        volume_assumption: c.volumeAssumption,
        month: c.month,
        why: c.why,
        takeaway: c.takeaway,
        raw_content_usd: r2(root?.raw ?? 0),
        idiot_index: r1(root?.idiot ?? null),
        modeled_mass_g: r1(root?.mass ?? 0) ?? 0,
        used_in: usesOf(c).map((u) => ({
            name: u.name,
            brand: u.brand,
            kind: u.kind,
            relation: u.relation,
            count: u.count,
            image_url: u.image,
            url: u.href,
            how: u.how,
        })),
        nodes: flatten(c.root).map(({ node, parent, depth, count }) => {
            const m = metrics.get(node.id);
            return {
                id: node.id,
                parent_id: parent?.id ?? null,
                depth,
                label: node.label,
                kind: node.kind,
                qty: node.qty ?? 1,
                count,
                unit_cost: sourced(node.unitCost),
                raw_content_usd: r2(m?.raw ?? 0),
                idiot_index: r1(m?.idiot ?? null),
                step_multiplier: r1(m?.step ?? null),
                mass_g: Math.round((m?.mass ?? 0) * 1000) / 1000,
                cost_stack: stackView(m?.stack ?? null),
                route: node.route ?? [],
                material: materialView(node, c.month),
                makers: makersView(node),
                maker_confidence: node.makerConfidence ?? null,
                maker_note: node.makerNote ?? null,
                alternate_maker_ids: node.alternateMakerIds ?? [],
                process_step_ids: node.processStepIds ?? [],
                inferred: node.inferred ?? false,
                references: (node.references ?? []).flatMap((ref) => {
                    const v = sourced(ref.value);
                    return v ? [{ label: ref.label, value: v }] : [];
                }),
                note: node.note ?? null,
                sources: refs(node.sources),
            };
        }),
        materials: materialTotals(c).map((t) => ({
            series_id: t.seriesId,
            label: materialLabel(t.seriesId),
            grams: r2(t.grams),
            cost_usd: r2(t.cost),
            price_usd_per_kg: sourced(materialPrice(t.seriesId, c.month)?.price),
        })),
        margin_capture: {
            price_usd: mc.price,
            raw_material_usd: r2(mc.raw),
            other_usd: r2(mc.other),
            tiers: mc.tiers.map((t) => ({
                node_id: t.nodeId,
                company_id: t.companyId,
                revenue_usd: r2(t.revenue),
                gross_margin: t.grossMargin,
                gross_profit_usd: r2(t.grossProfit),
                share_of_price: Math.round(t.share * 10000) / 10000,
                representative: t.representative,
            })),
        },
    };
}

export function bomListView(): z.input<typeof bomListOut> {
    return {
        as_of: BOM_AS_OF,
        cases: BOM_CASES.map((c) => {
            const v = bomCaseView(c);
            return {
                slug: v.slug,
                url: v.url,
                name: v.name,
                subject: v.subject,
                price: v.price,
                raw_content_usd: v.raw_content_usd,
                idiot_index: v.idiot_index,
                takeaway: v.takeaway,
                used_in: v.used_in,
                margin_capture: v.margin_capture,
            };
        }),
    };
}
