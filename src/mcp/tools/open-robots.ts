import { OpenRobotListSchema, openRobotList } from "@/api/open-robots";
import { OPEN_ROBOT_TYPES } from "@/open-source";
import { z } from "zod";
import { defineTool } from "../tool";

// The /open-source directory as an MCP tool.
export const listOpenRobots = defineTool({
    name: "list_open_robots",
    title: "Open-source robots and their actuators",
    description:
        "Open-source robots you can build from public files (YOR, Manmaru YOR, LeKiwi, XLeRobot, SO-100/SO-101, Koch, OpenArm, PAROL6, Thor, Berkeley Humanoid Lite, ToddlerBot, K-Bot, Poppy, Asimov 1, Open Duck Mini, Solo-8/12, Upkie, Stanford Doggo): type, DOF, cost to build with sources, SPDX licences, whether it meets the inclusion rule, an openness score with full/partial/missing and a link for each of CAD, electronics, firmware, software, BOM, assembly guide, sim model and licence, GitHub stars and last commit, what it derives from, and every joint group mapped to a catalog actuator id (or named when unlisted). Also returns joint counts per actuator model. Filter by type.",
    input: z.object({
        type: z
            .enum(OPEN_ROBOT_TYPES)
            .optional()
            .describe("mobile-manipulator, arm, humanoid or legged. Omit for all."),
    }),
    output: OpenRobotListSchema,
    run: ({ type }) => openRobotList(type),
});
