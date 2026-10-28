import { TECHNOLOGY_IDS, getTechnology } from "@/patents/technologies";
import { patentLandscapeOut, patentLandscapeView } from "@/patents/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// The /patents landscape over MCP: same wire shape as
// GET /api/v1/patents/{technology}.

const getPatentLandscape = defineTool({
    name: "get_patent_landscape",
    title: "Get patent landscape",
    description:
        "Patent families since 2010 for one actuator or magnet technology (robot-joints, strain-wave, cycloidal, planetary, screws, ndfeb, ree-free-magnets, ree-free-motors, artificial-muscles), scoped by CPC codes and deduplicated by family: the CPC code set with rationale, counts per priority year and applicant country, top 15 assignees with share and 3-year CAGR (linked to company registry ids), top-5 share and recent families with Google Patents links. Recent priority years are incomplete (publication lag): see first_incomplete_year. status is not_collected until the first snapshot; then report that no counts exist yet rather than estimating.",
    input: z.object({
        technology: z.enum(TECHNOLOGY_IDS).describe("Technology id."),
        families: z
            .number()
            .int()
            .min(0)
            .max(200)
            .default(20)
            .describe("How many recent families to include (default 20)."),
    }),
    output: patentLandscapeOut,
    run: ({ technology, families }) => {
        const t = getTechnology(technology);
        if (!t) throw new ToolInputError(`No technology "${technology}".`);
        return patentLandscapeView(t, families);
    },
});

export const patentTools = [getPatentLandscape];
