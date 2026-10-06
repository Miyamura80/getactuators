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
        "Static torque estimate (N·m) for each humanoid joint (shoulder, elbow, wrist, waist, hip, knee, ankle) of a stated hypothetical 50 kg robot, with the pose and arithmetic, plus catalog actuators that reach it (rated fits before peak-only). Mirrors the humanoid actuator guide. Static only: dynamic gait loads are not estimated.",
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

export const engineeringTools = [humanoidJoints];
