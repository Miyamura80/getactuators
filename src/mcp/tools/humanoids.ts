import {
    HumanoidDetailSchema,
    HumanoidSchema,
    serializeHumanoid,
    serializeHumanoidDetail,
} from "@/api/humanoids";
import { HUMANOIDS, getHumanoid } from "@/humanoids";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// The /humanoids joint map as an MCP tool.
export const getHumanoidJoints = defineTool({
    name: "get_humanoid_joints",
    title: "Humanoid joint-by-joint actuators",
    description:
        "What actuator moves each joint of a humanoid (Tesla Optimus, Figure 02, Atlas, Digit, Unitree G1/H1/H2, Fourier GR-1/GR-2 and more): per canonical joint (neck, waist, l-/r- shoulder pitch/roll/yaw, elbow, wrist, hand, hip yaw/roll/pitch, knee, ankle pitch/roll) the actuator type, whether it is reported or estimated and what it was inferred from, motor, reducer, peak torque or force, estimated NdFeB magnet mass and sources, plus robot totals (actuator mix, magnet and rare-earth kg with ranges). Omit robot_id to list every humanoid with its totals.",
    input: z.object({
        robot_id: z
            .string()
            .min(1)
            .max(120)
            .optional()
            .describe(
                "Humanoid id, e.g. 'tesla-optimus' or 'unitree-g1'. Omit to list all.",
            ),
    }),
    output: z.object({
        humanoid: HumanoidDetailSchema.nullable(),
        humanoids: z.array(HumanoidSchema),
    }),
    run: ({ robot_id }) => {
        if (!robot_id)
            return { humanoid: null, humanoids: HUMANOIDS.map(serializeHumanoid) };
        const h = getHumanoid(robot_id);
        if (!h) {
            throw new ToolInputError(
                `No humanoid "${robot_id}". Valid ids: ${HUMANOIDS.map((x) => x.id).join(", ")}.`,
            );
        }
        return { humanoid: serializeHumanoidDetail(h), humanoids: [] };
    },
});
