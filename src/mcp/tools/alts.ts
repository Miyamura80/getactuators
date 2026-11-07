import { ALT_TECH_IDS, altResult } from "@/api/alts";
import { ALT_FAMILIES } from "@/supply-chain/alts";
import { altTechListOut, altTechListView, altTechOut } from "@/supply-chain/alts/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// Alternatives to the rare-earth electric actuator (/alts). Every number
// carries its sources, as-of date and confidence.

const listAltTechnologies = defineTool({
    name: "list_alt_technologies",
    title: "List alternative actuator technologies",
    description:
        "Alternatives to today's rare-earth (NdFeB) electric actuator: rare-earth-free motors (induction, switched and synchronous reluctance, ferrite, wound-field, axial-flux, iron nitride), artificial muscles (HASEL, dielectric elastomer, coiled polymer, shape memory alloy, McKibben, hydraulic muscle), hydraulic drives (servo-hydraulic, EHA) and transmissions (cycloidal, cable capstan, roller screw, magnetic gear). Each has its working principle, magnet use, TRL with the evidence behind it, dated milestones (announced targets flagged), registry companies, cited performance figures, published market sizes and growth, and dated deployments. Pass family to filter.",
    input: z.object({
        family: z
            .enum(ALT_FAMILIES)
            .optional()
            .describe("ree-free-motor, artificial-muscle, hydraulic or transmission."),
    }),
    output: altTechListOut,
    run: ({ family }) => altTechListView(family),
});

const getAltTechnology = defineTool({
    name: "get_alt_technology",
    title: "Get an alternative actuator technology",
    description:
        "One alternative actuator technology from /alts by id (e.g. switched-reluctance, hasel, cycloidal): principle, magnet use, TRL, milestones, companies, performance figures, market size and growth, deployments and sources.",
    input: z.object({
        id: z
            .string()
            .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
            .describe(`Technology id: ${ALT_TECH_IDS.join(", ")}.`),
    }),
    output: altTechOut,
    run: ({ id }) => {
        const r = altResult(id);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const altTools = [listAltTechnologies, getAltTechnology];
