import { PROCESS_CHAIN_IDS, processResult } from "@/api/processes";
import { DEFAULT_CHAIN, chainOfStep } from "@/supply-chain/processes";
import { processChainOut } from "@/supply-chain/processes/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// How actuator parts are made: the /manufacturing process graphs. Every key
// number carries its sources, as-of date and confidence.

const getProcess = defineTool({
    name: "get_process",
    title: "Get a manufacturing process",
    description:
        "How a part of an actuator is made, step by step. chain=magnet is the sintered NdFeB magnet from rare earth ore to a magnetised rotor segment, in four stages: mining, separation, metal and alloy, and magnet making, with the heavy rare earth branch and the scrap loop. chain=precision is four side-by-side sub-chains from bar stock to a tested part: strain-wave gear (flexspline, circular spline, wave generator), planetary roller screw, precision bearing and encoder; its country shares are modeled from company shares. Each step lists the companies that run it, the stage's country shares and concentration tier, and its upstream and downstream steps; most steps also carry cited key numbers (temperature, particle size, tolerance, surface finish, yield). Pass step (e.g. jet-milling, roller-thread-grinding) for one step.",
    input: z.object({
        chain: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .optional()
            .describe(
                `Chain id: ${PROCESS_CHAIN_IDS.join(", ")}. Defaults to the chain holding step, else ${DEFAULT_CHAIN}.`,
            ),
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
        const id = chain ?? (step ? chainOfStep(step)?.id : undefined) ?? DEFAULT_CHAIN;
        const r = processResult(id, step);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const processTools = [getProcess];
