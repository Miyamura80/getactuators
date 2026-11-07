import { CATEGORIES, type CategorySlug } from "@/catalog";
import { SORTABLE_FIELDS } from "@/catalog/query";
import { z } from "zod";

// Zod schemas shared by the MCP tools: input validation and the outputSchema
// every tool advertises (so hosts get typed structuredContent). Units are part
// of each field name: _nm (N.m), _g (grams), _rpm, _usd, _arcmin.

const categorySlugs = CATEGORIES.map((c) => c.slug) as [
    CategorySlug,
    ...CategorySlug[],
];

export const categorySchema = z
    .enum(categorySlugs)
    .describe("Category slug, e.g. qdd_proprioceptive. See list_actuator_categories.");

export const sortSchema = z
    .enum(SORTABLE_FIELDS)
    .describe("Field to sort by. Unknown (null) values always sort last.");

export const actuatorIdSchema = z
    .string()
    .min(1)
    .max(120)
    .describe(
        "Actuator id (slug), e.g. 'nabtesco-rv-42n'. Find ids with search_actuators.",
    );

export const robotIdSchema = z
    .string()
    .min(1)
    .max(120)
    .describe("Robot id (slug), e.g. 'i2rt-yam'. Find ids with list_robots.");

export const limitSchema = (max: number, fallback: number) =>
    z
        .number()
        .int()
        .min(1)
        .max(max)
        .default(fallback)
        .describe(`Max results (1-${max}).`);

export const offsetSchema = z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip, for paging.");

const num = z.number().nullable();
const str = z.string().nullable();

export const actuatorSummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    category: z.string(),
    use_cases: z.array(z.string()),
    peak_torque_nm: num,
    rated_torque_nm: num,
    max_speed_rpm: num,
    weight_g: num,
    torque_density_nm_per_kg: num,
    price_usd: num,
    price_per_nm: num,
    gear_ratio: str,
    backlash_arcmin: num,
    backdrivable: z.boolean().nullable(),
    integrated_driver: z.boolean().nullable(),
    verified: z.boolean(),
    page_url: z.string().describe("Human-readable page on actuatorlist.com."),
});

export const actuatorSchema = actuatorSummarySchema.extend({
    image_url: str.optional(),
    product_url: str,
    datasheet_url: str,
    availability: str,
    repeatability_arcmin: num,
    voltage_v: z.union([z.string(), z.number()]).nullable(),
    peak_current_a: num,
    power_w: num,
    kt_nm_per_a: num,
    comm: z.array(z.string()).nullable(),
    control_modes: z.array(z.string()).nullable(),
    encoder: str,
    ip_rating: str,
    notes: str,
    sources: z.array(z.string()),
    data_source: z.string(),
    country: str,
    country_flag: str,
    source_url: str,
    source_domain: str,
});

export const robotRefSchema = z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
});

export const robotSummarySchema = robotRefSchema.extend({
    country: str,
    dof: z.number().nullable(),
    payload_kg: num,
    reach_mm: num,
    weight_kg: num,
    price_usd: num,
    price_max_usd: num,
    product_url: str,
    summary: z.string(),
    actuator_ids: z
        .array(z.string())
        .describe("Catalog actuator ids used in this robot's joints."),
});

export const motorSchema = z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    rated_torque_nm: num,
    peak_torque_nm: num,
    rated_speed_rpm: num,
    gear_ratio: str,
    weight_g: num,
    torque_density_nm_per_kg: num,
    product_url: str,
    actuator_id: str.describe(
        "Matching catalog actuator id, or null if not in the catalog.",
    ),
});

export const jointSchema = z.object({
    role: z.string(),
    count: z.number(),
    motor: motorSchema,
});
