import { countryFlag, countryName } from "@/country-flag";
import {
    ACTUATOR_TYPES,
    type Bom,
    HUMANOIDS,
    HUMANOIDS_AS_OF,
    HUMANOIDS_PATH,
    type Humanoid,
    type HumanoidJoint,
    type REE_ELEMENTS,
    REE_METAL_PRICE,
    type Sourced,
    type Span,
    bomPriceShare,
    getHumanoid,
    humanoidBom,
    humanoidTotals,
    reeByDesign,
    sourceOf,
    spanTotal,
} from "@/humanoids";
import { absoluteUrl } from "@/server/site";

const toAbsolute = (url: string) => (/^https?:\/\//.test(url) ? url : absoluteUrl(url));
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/humanoids: the joint-by-joint actuator map behind /humanoids. The
// same serializers back the MCP tool get_humanoid_joints.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

const confidence = z.enum(["reported", "estimated", "modeled"]);

export const SourcedNumberSchema = named(
    "SourcedNumber",
    z
        .object({
            value: z.number(),
            unit: z.string().nullable(),
            confidence,
            low: z
                .number()
                .nullable()
                .describe("Low bound, when the value is a range."),
            high: z
                .number()
                .nullable()
                .describe("High bound, when the value is a range."),
            note: z.string().nullable(),
            as_of: z.string(),
            sources: z.array(z.string()).describe("Source URLs."),
        })
        .describe("A figure with its unit, confidence, range and sources."),
);

const sourceSchema = z.object({ title: z.string(), url: z.string() });

export const HumanoidJointSchema = named(
    "HumanoidJoint",
    z.object({
        canonical: z
            .string()
            .describe("Canonical joint, e.g. `l-knee`, `neck`, `r-shoulder-pitch`."),
        count: z.number().describe("Actuators at this joint node."),
        actuator_type: z.enum(ACTUATOR_TYPES),
        type_confidence: z.enum(["reported", "estimated"]),
        inferred_from: z
            .string()
            .nullable()
            .describe("What an estimated type was inferred from."),
        actuator_id: z
            .string()
            .nullable()
            .describe("Catalog actuator id, when listed."),
        motor: z.string().nullable(),
        reducer: z.string().nullable(),
        peak_torque_nm: SourcedNumberSchema.nullable(),
        peak_force_n: SourcedNumberSchema.nullable(),
        size_class: z
            .enum(["xs", "s", "m", "l", "xl"])
            .describe("Motor size class, from motor-side torque."),
        load_class: z
            .enum(["xs", "s", "m", "l", "xl"])
            .describe("Joint load class, from output torque or force."),
        motor_sizing: z
            .object({
                gear_ratio: SourcedNumberSchema.describe(
                    "Reduction n:1, or screw lead in mm for screw actuators. Modeled when the design's typical band stands in.",
                ),
                efficiency: SourcedNumberSchema.describe(
                    "Reducer or screw efficiency, 0 to 1.",
                ),
                motor_torque_nm: SourcedNumberSchema.describe(
                    "Peak torque the motor must make: output / (ratio x efficiency), or force x lead / (2 pi x efficiency).",
                ),
            })
            .nullable()
            .describe("How the motor behind the joint was sized; null for hydraulics."),
        magnet_mass_g: SourcedNumberSchema.describe(
            "Estimated NdFeB at this node, all actuators.",
        ),
        sources: z.array(sourceSchema),
    }),
);

const reeSchema = z.object({
    nd: SourcedNumberSchema,
    pr: SourcedNumberSchema,
    dy: SourcedNumberSchema,
    tb: SourcedNumberSchema,
});

const humanoidFields = {
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    country: z.string().describe("ISO 3166-1 alpha-2 code, e.g. `CN`."),
    country_name: z.string().describe("Country name with its flag, e.g. `🇨🇳 China`."),
    robot_id: z
        .string()
        .nullable()
        .describe("Matching /api/v1/robots id, when there is one."),
    dof: z.number().nullable(),
    height_m: z.number().nullable(),
    weight_kg: z.number().nullable(),
    price_usd: z.number().nullable(),
    actuators: z.number().describe("Actuators on the canonical joint set."),
    actuator_count_by_type: z.record(z.string(), z.number()),
    magnet_mass_kg: SourcedNumberSchema,
    ree_kg: reeSchema,
    actuator_bom_usd: z
        .number()
        .describe(
            "Actuator cost total (USD), excluding actuators with no defensible price.",
        ),
    page_url: z.string(),
    api_url: z.string(),
};

export const HumanoidSchema = named(
    "Humanoid",
    z.object(humanoidFields).describe("A humanoid with its actuator totals."),
);

const lowHigh = {
    value: z.number(),
    low: z.number(),
    high: z.number(),
};

export const ActuatorBomSchema = named(
    "ActuatorBom",
    z
        .object({
            metric: z.enum(["cost", "mass", "magnet"]),
            unit: z.string().describe("`USD` for cost, `kg` for mass and magnet."),
            total: z
                .object(lowHigh)
                .describe("Whole robot where the rest is sourced, else actuators."),
            actuators: z.object(lowHigh),
            rest: z
                .object(lowHigh)
                .nullable()
                .describe("Non-actuator parts, null when no source covers them."),
            slices: z.array(
                z.object({
                    label: z
                        .string()
                        .describe(
                            "Actuator model or design, `Other`, or a non-actuator category.",
                        ),
                    category: z.enum(["actuator", "non-actuator"]),
                    lumped: z
                        .boolean()
                        .describe(
                            "A non-actuator total the source does not break into categories.",
                        ),
                    actuator_type: z.enum(ACTUATOR_TYPES),
                    count: z.number(),
                    unit_value: SourcedNumberSchema.nullable().describe(
                        "Per actuator, with confidence and sources; null for `Other`.",
                    ),
                    ...lowHigh,
                    share: z.number().describe("Share of the total, 0 to 1."),
                    joints: z.array(z.string()),
                }),
            ),
            excluded: z
                .array(
                    z.object({
                        label: z.string(),
                        count: z.number(),
                        reason: z.string(),
                    }),
                )
                .describe(
                    "Actuators with no defensible number, left out of the total.",
                ),
            price_share: z
                .object(lowHigh)
                .nullable()
                .describe(
                    "Actuator cost over the robot's list price, when both exist.",
                ),
        })
        .describe("Actuator bill of materials, at most 6 slices plus Other."),
);

const spanSchema = z.object({ value: z.number(), low: z.number(), high: z.number() });
const perElement = z.object({
    nd: spanSchema,
    pr: spanSchema,
    dy: spanSchema,
    tb: spanSchema,
});

export const RareEarthByDesignSchema = named(
    "RareEarthByDesign",
    z
        .object({
            label: z.string().describe("Actuator design, as in the BOM."),
            actuator_type: z.enum(ACTUATOR_TYPES),
            count: z.number(),
            grams: perElement.describe(
                "Grams of each element across all units, estimated.",
            ),
            total_grams: spanSchema,
            metal_usd: perElement.describe(
                "Raw metal value (grams x US$/kg), not a magnet price.",
            ),
            total_metal_usd: spanSchema,
        })
        .describe("Rare earth in one actuator design, from its magnet mass estimate."),
);

export const HumanoidDetailSchema = named(
    "HumanoidDetail",
    z.object({
        ...humanoidFields,
        summary: z.string(),
        not_counted: z.string().nullable(),
        joints: z.array(HumanoidJointSchema),
        rare_earth_by_design: z.array(RareEarthByDesignSchema),
        rare_earth_metal_price_usd_per_kg: z
            .object({
                nd: SourcedNumberSchema,
                pr: SourcedNumberSchema,
                dy: SourcedNumberSchema,
                tb: SourcedNumberSchema,
            })
            .describe("Metal prices behind metal_usd."),
        bom: z.object({
            cost: ActuatorBomSchema,
            mass: ActuatorBomSchema,
            magnet: ActuatorBomSchema,
        }),
        sources: z.array(sourceSchema),
    }),
);

export const HumanoidListSchema = named(
    "HumanoidList",
    z.object({ data: z.array(HumanoidSchema), as_of: z.string() }),
);

function sourced(s: Sourced<number> | undefined) {
    if (!s) return null;
    return {
        value: s.value,
        unit: s.unit ?? null,
        confidence: s.confidence,
        low: s.range?.[0] ?? null,
        high: s.range?.[1] ?? null,
        note: s.note ?? null,
        as_of: s.asOf,
        sources: s.sources.map((id) => toAbsolute(sourceOf(id).url)),
    };
}

const sources = (ids: string[]) =>
    ids.map((id) => ({
        title: sourceOf(id).title,
        url: toAbsolute(sourceOf(id).url),
    }));

export function serializeHumanoid(h: Humanoid): z.infer<typeof HumanoidSchema> {
    const t = humanoidTotals(h);
    return {
        id: h.id,
        name: h.name,
        brand: h.brand,
        country: h.country,
        country_name: `${countryFlag(h.country)} ${countryName(h.country)}`,
        robot_id: h.robotId ?? null,
        dof: h.dof,
        height_m: h.height_m,
        weight_kg: h.weight_kg,
        price_usd: h.price_usd,
        actuators: t.actuators,
        actuator_count_by_type: t.actuatorCountByType as Record<string, number>,
        magnet_mass_kg: sourced(t.magnetMassKg)!,
        ree_kg: {
            nd: sourced(t.reeKg.nd)!,
            pr: sourced(t.reeKg.pr)!,
            dy: sourced(t.reeKg.dy)!,
            tb: sourced(t.reeKg.tb)!,
        },
        actuator_bom_usd: humanoidBom(h, "cost").actuators.value,
        page_url: absoluteUrl(`${HUMANOIDS_PATH}?robot=${h.id}`),
        api_url: absoluteUrl(`/api/v1/humanoids/${h.id}`),
    };
}

function serializeJoint(j: HumanoidJoint): z.infer<typeof HumanoidJointSchema> {
    return {
        canonical: j.canonical,
        count: j.count,
        actuator_type: j.actuatorType,
        type_confidence: j.typeConfidence,
        inferred_from: j.inferredFrom ?? null,
        actuator_id: j.actuatorId ?? null,
        motor: j.motor ?? null,
        reducer: j.reducer ?? null,
        peak_torque_nm: sourced(j.peakTorqueNm),
        peak_force_n: sourced(j.peakForceN),
        size_class: j.sizeClass,
        load_class: j.loadClass,
        motor_sizing: j.motorSizing
            ? {
                  gear_ratio: sourced(j.motorSizing.gearRatio)!,
                  efficiency: sourced(j.motorSizing.efficiency)!,
                  motor_torque_nm: sourced(j.motorSizing.motorTorqueNm)!,
              }
            : null,
        magnet_mass_g: sourced(j.magnetMassG)!,
        sources: sources(j.sources),
    };
}

export function serializeHumanoidDetail(
    h: Humanoid,
): z.infer<typeof HumanoidDetailSchema> {
    return {
        ...serializeHumanoid(h),
        summary: h.summary,
        not_counted: h.notCounted ?? null,
        joints: h.joints.map(serializeJoint),
        rare_earth_by_design: reeByDesign(h).map((d) => ({
            label: d.label,
            actuator_type: d.type,
            count: d.count,
            grams: perEl(d.grams),
            total_grams: span(
                spanTotal(d.grams, "mid"),
                spanTotal(d.grams, "lo"),
                spanTotal(d.grams, "hi"),
            ),
            metal_usd: perEl(d.usd),
            total_metal_usd: span(
                spanTotal(d.usd, "mid"),
                spanTotal(d.usd, "lo"),
                spanTotal(d.usd, "hi"),
            ),
        })),
        rare_earth_metal_price_usd_per_kg: {
            nd: req(REE_METAL_PRICE.nd),
            pr: req(REE_METAL_PRICE.pr),
            dy: req(REE_METAL_PRICE.dy),
            tb: req(REE_METAL_PRICE.tb),
        },
        bom: {
            cost: serializeBom(h, humanoidBom(h, "cost")),
            mass: serializeBom(h, humanoidBom(h, "mass")),
            magnet: serializeBom(h, humanoidBom(h, "magnet")),
        },
        sources: sources(h.sources),
    };
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const span = (value: number, low: number, high: number) => ({
    value: r2(value),
    low: r2(low),
    high: r2(high),
});
const perEl = (r: Record<(typeof REE_ELEMENTS)[number], Span>) => ({
    nd: span(r.nd.mid, r.nd.lo, r.nd.hi),
    pr: span(r.pr.mid, r.pr.lo, r.pr.hi),
    dy: span(r.dy.mid, r.dy.lo, r.dy.hi),
    tb: span(r.tb.mid, r.tb.lo, r.tb.hi),
});
const req = (s: Sourced<number>) =>
    sourced(s) as NonNullable<ReturnType<typeof sourced>>;

const lh = (x: { value: number; range: readonly [number, number] }) => ({
    value: x.value,
    low: x.range[0],
    high: x.range[1],
});

function serializeBom(h: Humanoid, b: Bom): z.infer<typeof ActuatorBomSchema> {
    const share = bomPriceShare(h, b);
    return {
        metric: b.metric,
        unit: b.unit,
        total: lh(b.total),
        actuators: lh(b.actuators),
        rest: b.rest ? lh(b.rest) : null,
        slices: b.slices.map((s) => ({
            label: s.label,
            category: s.category,
            lumped: s.lumped ?? false,
            actuator_type: s.type,
            count: s.count,
            unit_value: sourced(s.unit ?? undefined),
            ...lh(s),
            share: Math.round(s.share * 1000) / 1000,
            joints: s.joints,
        })),
        excluded: b.excluded,
        price_share: share ? lh(share) : null,
    };
}

export function listHumanoids(): Response {
    return json({ data: HUMANOIDS.map(serializeHumanoid), as_of: HUMANOIDS_AS_OF });
}

export function getHumanoidById({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const h = getHumanoid(id);
    if (!h) {
        throw new ApiError("not_found", {
            detail: `No humanoid with id "${id}".`,
            hint: "List valid ids with GET /api/v1/humanoids.",
        });
    }
    return json(serializeHumanoidDetail(h));
}
