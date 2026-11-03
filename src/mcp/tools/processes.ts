import { PROCESS_CHAIN_IDS, processResult } from "@/api/processes";
import { processChainOut } from "@/supply-chain/processes/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// How actuator parts are made: the /manufacturing process graphs. Every key
// number carries its sources, as-of date and confidence.

const getProcess = defineTool({
    name: "get_process",
    title: "Get a manufacturing process",
    description:
        "How a part of an actuator is made, step by step. chain=magnet is the sintered NdFeB magnet from rare earth ore to a magnetised rotor segment: mining, flotation, acid cracking, solvent extraction, heavy rare earth separation, electrolysis, strip casting, hydrogen decrepitation, jet milling, pressing, sintering, grain boundary diffusion, machining, coating, magnetising, inspection and scrap recycling. Each step has cited key numbers (temperature, particle size, yield, energy), the companies that run it, the stage's country shares and concentration tier, and its upstream and downstream steps. Pass step (e.g. jet-milling) for one step.",
    input: z.object({
        chain: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .default("magnet")
            .describe(`Chain id: ${PROCESS_CHAIN_IDS.join(", ")}.`),
        step: z
            .string()
            .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
            .optional()
            .describe("One step id; returns that step and the edges that touch it."),
    }),
    output: processChainOut,
    run: ({ chain, step }) => {
        const r = processResult(chain, step);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const processTools = [getProcess];
