import { ACTUATORS, CATEGORIES } from "@/catalog";
import { listBrands, queryActuators, robotsUsingActuator } from "@/catalog/query";
import { z } from "zod";
import {
    actuatorIdSchema,
    actuatorSchema,
    actuatorSummarySchema,
    categorySchema,
    limitSchema,
    offsetSchema,
    robotRefSchema,
    sortSchema,
} from "../schemas";
import { defineTool } from "../tool";
import { actuatorFull, actuatorSummary, requireActuator } from "../views";

const searchActuators = defineTool({
    name: "search_actuators",
    title: "Search actuators",
    description:
        "Filter and sort the robot actuator catalog (QDD motors, integrated joints, smart servos, harmonic and cycloidal reducers). Combine free text with category, brand, use case, minimum peak torque (N.m), maximum weight (g), maximum price (USD) and backdrivability. Returns spec summaries with ids for get_actuator or compare_actuators.",
    input: z.object({
        q: z
            .string()
            .max(200)
            .optional()
            .describe(
                "Free-text terms matched against id, name, brand, category, use cases and notes.",
            ),
        category: categorySchema.optional(),
        brand: z
            .string()
            .max(80)
            .optional()
            .describe("Exact brand name (case-insensitive). See list_brands."),
        use_case: z
            .string()
            .max(80)
            .optional()
            .describe(
                "Use-case tag, e.g. quadruped_leg, humanoid_joint, robot_arm. See list_actuator_categories.",
            ),
        min_peak_torque_nm: z
            .number()
            .min(0)
            .optional()
            .describe("Minimum peak torque in N.m."),
        max_weight_g: z.number().min(0).optional().describe("Maximum mass in grams."),
        max_price_usd: z
            .number()
            .min(0)
            .optional()
            .describe("Maximum list price in USD."),
        backdrivable: z
            .boolean()
            .optional()
            .describe("Only backdrivable (true) or non-backdrivable (false) units."),
        integrated_driver: z
            .boolean()
            .optional()
            .describe(
                "Only units with (true) or without (false) an onboard motor driver.",
            ),
        sort: sortSchema.optional(),
        order: z.enum(["asc", "desc"]).default("desc").describe("Sort direction."),
        limit: limitSchema(100, 20),
        offset: offsetSchema,
    }),
    output: z.object({
        total: z.number().describe("Matches before paging."),
        offset: z.number(),
        results: z.array(actuatorSummarySchema),
    }),
    run: ({ limit, offset, ...filters }) => {
        const all = queryActuators(filters);
        return {
            total: all.length,
            offset,
            results: all.slice(offset, offset + limit).map(actuatorSummary),
        };
    },
});

const getActuatorTool = defineTool({
    name: "get_actuator",
    title: "Get actuator specs",
    description:
        "Return every documented spec for one actuator by id: torque, speed, mass, gear ratio, backlash, voltage, current, Kt, bus, control modes, encoder, price, source links and verification status, plus the robots in the catalog that use it.",
    input: z.object({ id: actuatorIdSchema }),
    output: z.object({
        actuator: actuatorSchema,
        robots_using: z.array(robotRefSchema),
    }),
    run: ({ id }) => {
        const a = requireActuator(id);
        return {
            actuator: actuatorFull(a),
            robots_using: robotsUsingActuator(a.id).map((r) => ({
                id: r.id,
                name: r.name,
                brand: r.brand,
            })),
        };
    },
});

function countBy(values: string[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
}

const listCategories = defineTool({
    name: "list_actuator_categories",
    title: "List actuator categories",
    description:
        "List the six actuator categories (slug, label, what distinguishes them, number of catalog entries) and every use-case tag with its count. Use the slugs and tags as filters for search_actuators and recommend_actuators.",
    input: z.object({}),
    output: z.object({
        categories: z.array(
            z.object({
                slug: z.string(),
                label: z.string(),
                description: z.string(),
                count: z.number(),
            }),
        ),
        use_cases: z.array(z.object({ tag: z.string(), count: z.number() })),
    }),
    run: () => {
        const byCat = countBy(ACTUATORS.map((a) => a.category));
        const byUse = countBy(ACTUATORS.flatMap((a) => a.use_cases));
        return {
            categories: CATEGORIES.map((c) => ({
                ...c,
                count: byCat.get(c.slug) ?? 0,
            })),
            use_cases: [...byUse]
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
        };
    },
});

const listBrandsTool = defineTool({
    name: "list_brands",
    title: "List actuator brands",
    description:
        "List every actuator manufacturer in the catalog with its country and how many actuators and categories it covers. Use a brand name as the brand filter of search_actuators.",
    input: z.object({}),
    output: z.object({
        brands: z.array(
            z.object({
                name: z.string(),
                country: z.string().nullable(),
                actuator_count: z.number(),
                categories: z.array(z.string()),
            }),
        ),
    }),
    run: () => ({
        brands: listBrands().map((name) => {
            const items = ACTUATORS.filter((a) => a.brand === name);
            return {
                name,
                country: items.find((a) => a.country)?.country ?? null,
                actuator_count: items.length,
                categories: [...new Set(items.map((a) => a.category))].sort(),
            };
        }),
    }),
});

export const actuatorTools = [
    searchActuators,
    getActuatorTool,
    listCategories,
    listBrandsTool,
];
