import {
    OPENNESS_DIMENSIONS,
    OPEN_SOURCE_AS_OF,
    OPEN_SOURCE_PATH,
    type OpenRobot,
    REPO_STATS_AS_OF,
    ROBOT_TYPES,
    getOpenRobot,
    openRobotsOfType,
    opennessScore,
    opennessStatus,
    repoStat,
    repoUrl,
    sourceOf,
    totalActuators,
} from "@/open-source";
import { absoluteUrl } from "@/server/site";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/open-robots: the /open-source directory over REST. The same
// serializer backs the MCP tool list_open_robots.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

const toAbsolute = (url: string) => (/^https?:\/\//.test(url) ? url : absoluteUrl(url));

const status = z.enum(["full", "partial", "missing"]);

const opennessCell = z.object({
    status,
    url: z.string().nullable().describe("The published file or folder."),
    licence: z
        .string()
        .nullable()
        .describe("SPDX id (or LicenseRef-*) for this artefact."),
    note: z.string().nullable(),
});

export const OpenRobotSchema = named(
    "OpenRobot",
    z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(ROBOT_TYPES),
        maintainers: z.array(z.string()),
        country: z.string().nullable().describe("ISO 3166-1 alpha-2, when stated."),
        summary: z.string(),
        robot_id: z
            .string()
            .nullable()
            .describe("Matching /api/v1/robots id, when listed."),
        derived_from: z
            .string()
            .nullable()
            .describe("Parent open robot id (family tree)."),
        homepage: z.string(),
        repo_url: z.string().nullable(),
        stars: z.number().nullable(),
        last_commit: z.string().nullable().describe("YYYY-MM-DD of the latest commit."),
        dof: z.number().nullable(),
        payload_kg: z.number().nullable(),
        cost_usd: z.number().nullable(),
        cost_basis: z
            .enum(["bom", "kit"])
            .nullable()
            .describe("Parts BOM or cheapest kit."),
        licence: z
            .array(z.string())
            .describe("SPDX ids; LicenseRef-* for terms with none."),
        openness_score: z
            .number()
            .describe(
                "0 to 1: share of the eight dimensions full, partial counting half.",
            ),
        openness: z.record(z.enum(OPENNESS_DIMENSIONS), opennessCell),
        actuators: z.number().describe("Actuators itemised across all joints."),
        joints: z.array(
            z.object({
                role: z.string(),
                count: z.number(),
                name: z.string(),
                brand: z.string(),
                actuator_id: z
                    .string()
                    .nullable()
                    .describe("Catalog actuator id; null when unlisted."),
                note: z.string().nullable(),
            }),
        ),
        sources: z.array(z.object({ title: z.string(), url: z.string() })),
        page_url: z.string(),
    }),
);

export const OpenRobotListSchema = named(
    "OpenRobotList",
    z.object({
        data: z.array(OpenRobotSchema),
        as_of: z.string(),
        repo_stats_as_of: z.string(),
    }),
);

export const OpenRobotListParams = z.object({
    type: z
        .enum(ROBOT_TYPES)
        .optional()
        .describe("mobile-manipulator, arm, humanoid or legged."),
});

export function serializeOpenRobot(r: OpenRobot): z.infer<typeof OpenRobotSchema> {
    const stat = repoStat(r);
    const openness = Object.fromEntries(
        OPENNESS_DIMENSIONS.map((d) => {
            const link = d === "licence" ? undefined : r.openness[d];
            return [
                d,
                {
                    status: opennessStatus(r, d),
                    url: link?.url ?? null,
                    licence:
                        link?.licence ??
                        (d === "licence" ? r.licence.join(", ") || null : null),
                    note: link?.note ?? null,
                },
            ];
        }),
    ) as z.infer<typeof OpenRobotSchema>["openness"];
    return {
        id: r.id,
        name: r.name,
        type: r.type,
        maintainers: r.maintainers,
        country: r.country,
        summary: r.summary,
        robot_id: r.robotId ?? null,
        derived_from: r.derivedFrom ?? null,
        homepage: r.homepage,
        repo_url: repoUrl(r),
        stars: stat?.stars ?? null,
        last_commit: stat?.lastCommit ?? null,
        dof: r.dof,
        payload_kg: r.payloadKg?.value ?? null,
        cost_usd: r.bomCostUsd?.value ?? null,
        cost_basis: r.bomCostUsd?.basis ?? null,
        licence: r.licence,
        openness_score: Math.round(opennessScore(r).score * 1000) / 1000,
        openness,
        actuators: totalActuators(r),
        joints: r.joints.map((j) => ({
            role: j.role,
            count: j.count,
            name: j.name,
            brand: j.brand,
            actuator_id: j.actuatorId ?? null,
            note: j.note ?? null,
        })),
        sources: r.sources.map((id) => ({
            title: sourceOf(id).title,
            url: toAbsolute(sourceOf(id).url),
        })),
        page_url: absoluteUrl(`${OPEN_SOURCE_PATH}?robot=${r.id}`),
    };
}

export function openRobotList(
    type?: OpenRobot["type"],
): z.infer<typeof OpenRobotListSchema> {
    return {
        data: openRobotsOfType(type).map(serializeOpenRobot),
        as_of: OPEN_SOURCE_AS_OF,
        repo_stats_as_of: REPO_STATS_AS_OF,
    };
}

export function listOpenRobotsHandler({ url }: ApiContext): Response {
    const { type } = parseQuery(OpenRobotListParams, url);
    return json(openRobotList(type));
}

export function getOpenRobotHandler({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const r = getOpenRobot(id);
    if (!r)
        throw new ApiError("not_found", {
            detail: `No open robot "${id}".`,
            hint: "List valid ids with GET /api/v1/open-robots.",
        });
    return json(serializeOpenRobot(r));
}
