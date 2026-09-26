import { getActuator } from "@/catalog";
import { queryActuators } from "@/catalog/query";
import { z } from "zod";
import { COMPARE_VIEW_URI } from "../app/compare-view";
import { PRIORITIES, type Priority, bestPerMetric, scoreCandidates } from "../rank";
import {
    actuatorIdSchema,
    actuatorSummarySchema,
    categorySchema,
    limitSchema,
} from "../schemas";
import { ToolInputError, defineTool } from "../tool";
import { actuatorSummary, requireActuator } from "../views";

const bestSchema = z.array(
    z.object({
        metric: z.string(),
        unit: z.string(),
        direction: z.enum(["higher_is_better", "lower_is_better"]),
        actuator_id: z
            .string()
            .nullable()
            .describe("Null when no compared unit documents it."),
        value: z.number().nullable(),
    }),
);

const compareActuators = defineTool({
    name: "compare_actuators",
    title: "Compare actuators side by side",
    description:
        "Compare 2 to 10 actuators by id side by side and report which one wins each metric (peak and rated torque, speed, mass, torque density, price, price per N.m, backlash). Hosts that support MCP Apps render the result as an interactive comparison card.",
    input: z.object({
        ids: z
            .array(actuatorIdSchema)
            .min(2)
            .max(10)
            .describe("2-10 actuator ids from search_actuators."),
    }),
    output: z.object({
        actuators: z.array(actuatorSummarySchema),
        best: bestSchema,
        missing_ids: z
            .array(z.string())
            .describe("Requested ids not found in the catalog."),
    }),
    uiResourceUri: COMPARE_VIEW_URI,
    run: ({ ids }) => {
        const unique = [...new Set(ids)];
        const found = unique.flatMap((id) => {
            const a = getActuator(id);
            return a ? [a] : [];
        });
        const missing = unique.filter((id) => !getActuator(id));
        if (found.length === 0) requireActuator(missing[0] ?? "");
        return {
            actuators: found.map(actuatorSummary),
            best: bestPerMetric(found),
            missing_ids: missing,
        };
    },
});

const priorityNames = Object.keys(PRIORITIES) as [Priority, ...Priority[]];

const recommendActuators = defineTool({
    name: "recommend_actuators",
    title: "Recommend actuators for a task",
    description:
        "Rank actuators for a concrete job, e.g. a quadruped knee needing 30 N.m under 600 g. Hard constraints (use case, category, minimum peak torque, maximum weight and price, backdrivability) filter the catalog; the survivors are scored deterministically by the chosen priority and returned with per-metric reasons and the specs each one is missing.",
    input: z.object({
        use_case: z
            .string()
            .max(80)
            .optional()
            .describe(
                "Use-case tag, e.g. quadruped_leg, humanoid_joint, robot_arm, exoskeleton.",
            ),
        category: categorySchema.optional(),
        min_peak_torque_nm: z
            .number()
            .min(0)
            .optional()
            .describe("Required peak torque in N.m."),
        max_weight_g: z
            .number()
            .min(0)
            .optional()
            .describe("Mass budget per actuator in grams."),
        max_price_usd: z
            .number()
            .min(0)
            .optional()
            .describe("Budget per actuator in USD (excludes unpriced units)."),
        backdrivable: z
            .boolean()
            .optional()
            .describe(
                "Require backdrivable units (needed for proprioceptive legged control).",
            ),
        priority: z
            .enum(priorityNames)
            .default("balanced")
            .describe(
                "What to optimize: balanced, torque_density, low_price, high_torque, low_weight or precision.",
            ),
        limit: limitSchema(20, 5),
    }),
    output: z.object({
        priority: z.string(),
        candidates_considered: z
            .number()
            .describe("Actuators that met every hard constraint."),
        recommendations: z.array(
            z.object({
                rank: z.number(),
                score: z.number().describe("0-100, relative to the other candidates."),
                actuator: actuatorSummarySchema,
                reasons: z.array(z.string()),
                missing_data: z
                    .array(z.string())
                    .describe("Scored metrics this unit does not document."),
            }),
        ),
    }),
    run: ({ priority, limit, ...filters }) => {
        const candidates = queryActuators(filters);
        if (candidates.length === 0) {
            throw new ToolInputError(
                "No actuator meets every constraint. Relax one (e.g. raise max_weight_g or drop use_case) or check tags with list_actuator_categories.",
            );
        }
        const ranked = scoreCandidates(candidates, priority).slice(0, limit);
        return {
            priority,
            candidates_considered: candidates.length,
            recommendations: ranked.map((s, i) => ({
                rank: i + 1,
                score: s.score,
                actuator: actuatorSummary(s.actuator),
                reasons: s.reasons,
                missing_data: s.missing_data,
            })),
        };
    },
});

export const compareTools = [compareActuators, recommendActuators];
