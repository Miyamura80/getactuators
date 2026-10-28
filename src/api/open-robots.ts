import {
    OPENNESS_DIMENSIONS,
    OPEN_ROBOTS_AS_OF,
    OPEN_ROBOT_TYPES,
    OPEN_SOURCE_PATH,
    type OpenRobot,
    REPO_STATS,
    actuatorUsage,
    jointMotor,
    motorCount,
    openRobotsOfType,
    opennessScore,
    opennessState,
    repoStat,
    repoUrl,
} from "@/open-source";
import { absoluteUrl } from "@/server/site";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { schemaRegistry } from "./schemas";

// /api/v1/open-robots: the /open-source dataset. The same serializer backs
// the MCP tool list_open_robots.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

const status = z.enum(["full", "partial", "missing"]);

const OpenRobotJointSchema = z.object({
    role: z.string(),
    count: z
        .number()
        .nullable()
        .describe("Motors in this group; null when not published."),
    actuator_id: z
        .string()
        .nullable()
        .describe("Catalog actuator id, or null when unlisted."),
    actuator_url: z.string().nullable(),
    motor: z.string(),
    brand: z.string(),
    note: z.string().nullable(),
    sources: z.array(z.string()),
});

export const OpenRobotSchema = named(
    "OpenRobot",
    z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(OPEN_ROBOT_TYPES),
        url: z.string().describe("This robot on /open-source."),
        repo_url: z.string().nullable(),
        homepage: z.string().nullable(),
        summary: z.string(),
        maintainers: z.array(z.string()),
        country: z.string().nullable(),
        dof: z.number().nullable(),
        dof_note: z.string().nullable(),
        licence: z.array(z.string()).describe("SPDX ids, hardware and software."),
        meets_inclusion_rule: z
            .boolean()
            .describe(
                "Mechanical design, or full BOM plus build instructions, public under a stated licence.",
            ),
        inclusion_note: z.string().nullable(),
        openness_score: z
            .number()
            .describe(
                "Share of the eight dimensions that are full; partial counts half.",
            ),
        openness: z.array(
            z.object({
                dimension: z.enum(OPENNESS_DIMENSIONS),
                status,
                url: z.string().nullable(),
                note: z.string().nullable(),
            }),
        ),
        bom_cost: z
            .object({
                value: z.number(),
                unit: z.string(),
                confidence: z.enum(["reported", "estimated", "modeled"]),
                low: z.number().nullable(),
                high: z.number().nullable(),
                note: z.string().nullable(),
                as_of: z.string(),
                sources: z.array(z.string()),
            })
            .nullable(),
        github: z
            .object({
                stars: z.number(),
                stars_rounded: z.boolean(),
                last_commit: z.string(),
                as_of: z.string(),
            })
            .nullable(),
        derived_from: z.array(z.string()),
        catalog_robot_id: z.string().nullable(),
        motor_count: z.number(),
        joints: z.array(OpenRobotJointSchema),
        sources: z.array(z.string()),
    }),
);

export const OpenRobotListSchema = named(
    "OpenRobotList",
    z.object({
        data: z.array(OpenRobotSchema),
        total: z.number(),
        as_of: z.string(),
        actuator_usage: z
            .array(
                z.object({
                    actuator_id: z.string().nullable(),
                    name: z.string(),
                    brand: z.string(),
                    joints: z.number(),
                    robots: z.array(z.string()),
                }),
            )
            .describe(
                "Joints per actuator model across the listed robots, most used first.",
            ),
    }),
);

export const OpenRobotListParams = z.object({
    type: z
        .enum(OPEN_ROBOT_TYPES)
        .optional()
        .describe("Only this type: mobile-manipulator, arm, humanoid or legged."),
});

export function serializeOpenRobot(r: OpenRobot): z.infer<typeof OpenRobotSchema> {
    const stat = repoStat(r);
    const c = r.bomCost;
    return {
        id: r.id,
        name: r.name,
        type: r.type,
        url: absoluteUrl(`${OPEN_SOURCE_PATH}?robot=${r.id}`),
        repo_url: repoUrl(r),
        homepage: r.homepage ?? null,
        summary: r.summary,
        maintainers: r.maintainers,
        country: r.country ?? null,
        dof: r.dof,
        dof_note: r.dofNote ?? null,
        licence: r.licence,
        meets_inclusion_rule: r.meetsInclusionRule,
        inclusion_note: r.inclusionNote ?? null,
        openness_score: Number(opennessScore(r).score.toFixed(3)),
        openness: OPENNESS_DIMENSIONS.map((d) => ({
            dimension: d,
            status: opennessState(r, d),
            url: r.openness[d]?.url ?? null,
            note: r.openness[d]?.note ?? null,
        })),
        bom_cost: c
            ? {
                  value: c.value,
                  unit: c.unit ?? "USD",
                  confidence: c.confidence,
                  low: c.range?.[0] ?? null,
                  high: c.range?.[1] ?? null,
                  note: c.note ?? null,
                  as_of: c.asOf,
                  sources: c.sources,
              }
            : null,
        github: stat
            ? {
                  stars: stat.stars,
                  stars_rounded: stat.starsRounded,
                  last_commit: stat.lastCommit,
                  as_of: REPO_STATS.asOf,
              }
            : null,
        derived_from: r.derivedFrom ?? [],
        catalog_robot_id: r.catalogRobotId ?? null,
        motor_count: motorCount(r),
        joints: r.joints.map((j) => {
            const m = jointMotor(j);
            return {
                role: j.role,
                count: j.count,
                actuator_id: j.actuatorId ?? null,
                actuator_url: j.actuatorId
                    ? absoluteUrl(`/actuators/${j.actuatorId}`)
                    : null,
                motor: m.name,
                brand: m.brand,
                note: j.note ?? null,
                sources: j.sources,
            };
        }),
        sources: r.sources,
    };
}

export function openRobotList(
    type?: OpenRobot["type"],
): z.infer<typeof OpenRobotListSchema> {
    const robots = openRobotsOfType(type);
    return {
        data: robots.map(serializeOpenRobot),
        total: robots.length,
        as_of: OPEN_ROBOTS_AS_OF,
        actuator_usage: actuatorUsage(robots).map((u) => ({
            actuator_id: u.actuatorId,
            name: u.name,
            brand: u.brand,
            joints: u.joints,
            robots: u.robots,
        })),
    };
}

export function listOpenRobotsHandler({ url }: ApiContext): Response {
    const { type } = parseQuery(OpenRobotListParams, url);
    return json(openRobotList(type));
}
