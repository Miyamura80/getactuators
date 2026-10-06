import { type Arm, MAX_LINKS, MIN_LINKS, armReport } from "@/engineering/arm-torque";
import {
    HUMANOID_GUIDE_PATH,
    JOINTS,
    humanoidJointRequirements,
} from "@/server/agent/humanoid-joints";
import { absoluteUrl } from "@/server/site";
import { z } from "zod";
import { limitSchema } from "../schemas";
import { defineTool } from "../tool";

// Engineering sizing helpers behind the site's guides and calculators. They
// answer from the same functions the pages render, so a tool result and the
// page a user opens never disagree.

function absolute<T extends { page_path: string }>(rows: T[]) {
    return rows.map(({ page_path, ...c }) => ({
        ...c,
        page_url: absoluteUrl(page_path),
    }));
}

const JOINT_IDS = JOINTS.map((j) => j.id) as [string, ...string[]];

const candidateSchema = z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    rated_torque_nm: z.number().nullable(),
    peak_torque_nm: z.number().nullable(),
    weight_g: z.number().nullable(),
    fit: z
        .enum(["rated", "peak"])
        .describe(
            "rated: rated torque covers the estimate. peak: only peak does (short duty).",
        ),
    fit_label: z.string(),
    note: z
        .string()
        .nullable()
        .describe("Integration caveat, e.g. drive electronics not included."),
    page_url: z.string(),
});

const humanoidJoints = defineTool({
    name: "humanoid_joint_requirements",
    title: "Humanoid joint torque requirements",
    description:
        "Static gravity-moment estimate (N·m) for each humanoid joint (shoulder, elbow, wrist, waist, hip, knee, ankle) of a stated hypothetical 50 kg robot, with the pose and arithmetic, plus catalog actuators that reach it (rated fits before peak-only). Mirrors the humanoid actuator guide. Static only: dynamic gait loads are not estimated.",
    input: z.object({
        joint: z.enum(JOINT_IDS).optional().describe("One joint; omit for all seven."),
        limit: limitSchema(20, 5),
    }),
    output: z.object({
        assumptions: z.string(),
        screen: z.string(),
        joints: z.array(
            z.object({
                id: z.string(),
                number: z.number(),
                name: z.string(),
                typical_dof: z.string(),
                static_torque_nm: z.number(),
                pose: z.string(),
                working: z.string(),
                screen_total: z
                    .number()
                    .describe("Catalog entries that pass before the limit."),
                shortlist: z.array(candidateSchema),
                section_url: z.string(),
            }),
        ),
        undocumented: z
            .array(z.object({ id: z.string(), name: z.string(), brand: z.string() }))
            .describe(
                "Humanoid-tagged entries with no documented torque; they never pass.",
            ),
        guide_url: z.string(),
    }),
    run: ({ joint, limit }) => {
        const data = humanoidJointRequirements(joint, limit);
        return {
            ...data,
            joints: data.joints.map(({ section_path, shortlist, ...j }) => ({
                ...j,
                shortlist: shortlist.map(({ page_path, ...c }) => ({
                    ...c,
                    page_url: absoluteUrl(page_path),
                })),
                section_url: absoluteUrl(section_path),
            })),
            guide_url: absoluteUrl(HUMANOID_GUIDE_PATH),
        };
    },
});

const linkSchema = z.object({
    length_m: z.number().positive().max(10).describe("Joint-to-joint length, metres."),
    mass_kg: z.number().min(0).max(1000).describe("Structure mass of this link, kg."),
    actuator_mass_kg: z
        .number()
        .min(0)
        .max(1000)
        .default(0)
        .describe(
            "Mass of the actuator at this link's far end (driving the next joint), kg. Ignored on the last link.",
        ),
});

const armHoldingTorque = defineTool({
    name: "arm_holding_torque",
    title: "Robot arm holding torque per joint",
    description:
        "Static holding moment (N·m) at each pitch joint of a 2 to 4 link arm held horizontal (the worst gravity case), from link lengths, link masses, actuator masses and payload, plus catalog actuators per joint (rated fits before peak-only). Also returns a shareable calculator URL. Gravity only: inertia, friction and safety margins are not modeled.",
    input: z.object({
        links: z
            .array(linkSchema)
            .min(MIN_LINKS)
            .max(MAX_LINKS)
            .describe("From the base outward."),
        payload_kg: z
            .number()
            .min(0)
            .max(1000)
            .describe("Payload plus gripper at the tip, kg."),
        com_fraction: z
            .number()
            .min(0)
            .max(1)
            .default(0.5)
            .describe("Where each link's own mass acts, as a fraction of its length."),
        limit: limitSchema(20, 5),
    }),
    output: z.object({
        assumptions: z.string(),
        joints: z.array(
            z.object({
                number: z.number(),
                name: z.string(),
                position_m: z.number().describe("Distance from the first joint."),
                holding_torque_nm: z.number(),
                screen_total: z.number(),
                shortlist: z.array(candidateSchema),
            }),
        ),
        calculator_url: z
            .string()
            .describe("Opens this exact arm in the browser calculator."),
    }),
    run: ({ links, payload_kg, com_fraction, limit }) => {
        const arm: Arm = {
            payload: payload_kg,
            comFraction: com_fraction,
            links: links.map((l, i) => ({
                length: l.length_m,
                mass: l.mass_kg,
                actuatorMass: i === links.length - 1 ? 0 : l.actuator_mass_kg,
            })),
        };
        const report = armReport(arm, limit);
        return {
            assumptions: report.assumptions,
            joints: report.joints.map((j) => ({
                ...j,
                shortlist: absolute(j.shortlist),
            })),
            calculator_url: absoluteUrl(report.calculator_path),
        };
    },
});

export const engineeringTools = [humanoidJoints, armHoldingTorque];
