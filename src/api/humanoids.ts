import { countryFlag, countryName } from "@/country-flag";
import {
    ACTUATOR_TYPES,
    HUMANOIDS,
    HUMANOIDS_AS_OF,
    HUMANOIDS_PATH,
    type Humanoid,
    type HumanoidJoint,
    type Sourced,
    getHumanoid,
    humanoidTotals,
    sourceOf,
} from "@/humanoids";
import { absoluteUrl } from "@/server/site";
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
        size_class: z.enum(["xs", "s", "m", "l", "xl"]),
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
    page_url: z.string(),
    api_url: z.string(),
};

export const HumanoidSchema = named(
    "Humanoid",
    z.object(humanoidFields).describe("A humanoid with its actuator totals."),
);

export const HumanoidDetailSchema = named(
    "HumanoidDetail",
    z.object({
        ...humanoidFields,
        summary: z.string(),
        not_counted: z.string().nullable(),
        joints: z.array(HumanoidJointSchema),
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
        sources: s.sources.map((id) => absoluteUrl(sourceOf(id).url)),
    };
}

const sources = (ids: string[]) =>
    ids.map((id) => ({
        title: sourceOf(id).title,
        url: absoluteUrl(sourceOf(id).url),
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
        sources: sources(h.sources),
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
