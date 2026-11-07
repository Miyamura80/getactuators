import { OpenRobotListSchema, openRobotList } from "@/api/open-robots";
import { ROBOTS, ROBOT_CREDIT, ROBOT_KINDS } from "@/catalog";
import { jointRows, resolveJoints, robotsUsingActuator } from "@/catalog/query";
import { ROBOT_TYPES } from "@/open-source";
import { z } from "zod";
import {
    actuatorIdSchema,
    jointSchema,
    limitSchema,
    offsetSchema,
    robotIdSchema,
    robotSummarySchema,
} from "../schemas";
import { defineTool } from "../tool";
import { requireActuator, requireRobot, robotSummary } from "../views";
import { getHumanoidJoints } from "./humanoids";

const creditSchema = z
    .object({ name: z.string(), org: z.string(), org_url: z.string() })
    .describe("Attribution for the robot and motor dataset.");

const listRobots = defineTool({
    name: "list_robots",
    title: "List robots",
    description:
        "List catalog robots (humanoids, robot arms, quadrupeds) with kind, DOF, payload (kg), reach (mm), weight (kg), top speed (m/s, quadrupeds), price (USD) and the catalog actuator ids their joints use. Filter by kind, free text or brand.",
    input: z.object({
        q: z
            .string()
            .max(200)
            .optional()
            .describe("Free-text terms matched against id, name, brand and summary."),
        brand: z
            .string()
            .max(80)
            .optional()
            .describe("Exact brand name (case-insensitive)."),
        kind: z
            .enum(ROBOT_KINDS)
            .optional()
            .describe("humanoid, robot_arm or quadruped. Omit for all."),
        limit: limitSchema(100, 50),
        offset: offsetSchema,
    }),
    output: z.object({
        total: z.number(),
        offset: z.number(),
        results: z.array(robotSummarySchema),
        credit: creditSchema,
    }),
    run: ({ q, brand, kind, limit, offset }) => {
        const terms = (q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
        const hits = ROBOTS.filter((r) => {
            if (brand && r.brand.toLowerCase() !== brand.toLowerCase()) return false;
            if (kind && r.kind !== kind) return false;
            const hay = `${r.id} ${r.name} ${r.brand} ${r.summary}`.toLowerCase();
            return terms.every((t) => hay.includes(t));
        });
        return {
            total: hits.length,
            offset,
            results: hits.slice(offset, offset + limit).map(robotSummary),
            credit: ROBOT_CREDIT,
        };
    },
});

const getRobot = defineTool({
    name: "get_robot",
    title: "Get robot and its motors",
    description:
        "Return one robot by id with every joint group resolved to its motor: role, count, motor torque (N.m), speed (rpm), gear ratio, mass (g) and the matching catalog actuator id when there is one, plus the total motor count. A joint's motor is null when no cited source names it (common for quadrupeds).",
    input: z.object({ id: robotIdSchema }),
    output: z.object({
        robot: robotSummarySchema,
        joints: z.array(jointSchema),
        total_motors: z.number(),
        notes: z
            .string()
            .nullable()
            .describe("Which figures are missing or edition-specific, and why."),
        sources: z.array(z.string()),
        credit: creditSchema,
    }),
    run: ({ id }) => {
        const r = requireRobot(id);
        const joints = jointRows(r);
        return {
            robot: robotSummary(r),
            joints,
            total_motors: joints.reduce((s, j) => s + j.count, 0),
            notes: r.notes ?? null,
            sources: r.sources,
            credit: ROBOT_CREDIT,
        };
    },
});

const findRobots = defineTool({
    name: "find_robots_using_actuator",
    title: "Find robots using an actuator",
    description:
        "Given an actuator id, list the robots in the catalog whose joints use it, with the joint roles and counts. Answers questions like 'which arms ship with this motor?'.",
    input: z.object({ actuator_id: actuatorIdSchema }),
    output: z.object({
        actuator_id: z.string(),
        robots: z.array(
            robotSummarySchema
                .pick({ id: true, name: true, brand: true, dof: true })
                .extend({
                    joints: z.array(z.object({ role: z.string(), count: z.number() })),
                }),
        ),
    }),
    run: ({ actuator_id }) => {
        const a = requireActuator(actuator_id);
        return {
            actuator_id: a.id,
            robots: robotsUsingActuator(a.id).map((r) => ({
                id: r.id,
                name: r.name,
                brand: r.brand,
                dof: r.dof,
                joints: resolveJoints(r)
                    .filter((j) => j.motor.actuator_id === a.id)
                    .map((j) => ({ role: j.role, count: j.count })),
            })),
        };
    },
});

// The /open-source directory as an MCP tool; same wire shape as
// GET /api/v1/open-robots.
const listOpenRobots = defineTool({
    name: "list_open_robots",
    title: "List open-source robots",
    description:
        "Open-source robots you can build (YOR, SO-101, LeKiwi, OpenArm, Berkeley Humanoid Lite, ToddlerBot, Solo-12 and more): licences (SPDX), openness score over eight dimensions (mechanical CAD, electronics, firmware, software, BOM, assembly guide, sim model, licence) with a link per published artefact, BOM or kit cost (USD), GitHub stars and last commit, the robot it was derived from, and each joint group's actuator with its catalog id when listed. Filter by type.",
    input: z.object({
        type: z
            .enum(ROBOT_TYPES)
            .optional()
            .describe("mobile-manipulator, arm, humanoid or legged. Omit for all."),
    }),
    output: OpenRobotListSchema,
    run: ({ type }) => openRobotList(type),
});

export const robotTools = [
    listRobots,
    getRobot,
    findRobots,
    getHumanoidJoints,
    listOpenRobots,
];
