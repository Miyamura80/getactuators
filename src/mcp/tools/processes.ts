import { PROCESS_CHAIN_IDS, processResult } from "@/api/processes";
import { DEFAULT_CHAIN } from "@/supply-chain/processes";
import { processChainOut } from "@/supply-chain/processes/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// How actuator parts are made: the /manufacturing process graphs. Every key
// number carries its sources, as-of date and confidence.

const getProcess = defineTool({
    name: "get_process",
    title: "Get a manufacturing process",
    description:
        "How a part of an actuator is made, step by step. chain=magnet is the sintered NdFeB magnet from rare earth ore to a magnetised rotor segment, in four stages: mining, separation, metal and alloy, and magnet making, with the heavy rare earth branch and the scrap loop. Each step lists the companies that run it, the stage's country shares and concentration tier, and its upstream and downstream steps; most steps also carry cited key numbers (temperature, particle size, yield, energy). Pass step (e.g. jet-milling) for one step.",
    input: z.object({
        chain: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .default(DEFAULT_CHAIN)
            .describe(`Chain id: ${PROCESS_CHAIN_IDS.join(", ")}.`),
        step: z
            .string()
            .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
            .optional()
            .describe(
                "One step id; returns that step, its cluster and the edges that touch it.",
            ),
    }),
    output: processChainOut,
    run: ({ chain, step }) => {
        const r = processResult(chain, step);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const processTools = [getProcess];
