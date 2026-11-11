import {
    PATENT_SCOPES,
    PatentLandscapeSchema,
    patentLandscapeResult,
} from "@/api/patents";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// /patents over MCP: one technology's patent landscape.

const getPatentLandscape = defineTool({
    name: "get_patent_landscape",
    title: "Get a technology's patent landscape",
    description:
        'Patent families since 2010 for one actuator technology from /patents, deduplicated by DOCDB family, from Google Patents Public Datasets on BigQuery. Returns the reviewed CPC codes with their rationale and keyword filters, families per priority year (years from incomplete_from on are still being published, so do not read their drop as a decline), families per applicant country per year, the top 15 first assignees with family count, share and 3-year CAGR (company_id links to get_company), the top-five share, and the largest families with Google Patents links. Use technology "all" for every family once.',
    input: z.object({
        technology: z
            .enum(PATENT_SCOPES)
            .describe(
                "robot-joints, strain-wave, cycloidal, planetary, screws, ndfeb, re-free-magnets, re-free-motors, artificial-muscles, eha, or all.",
            ),
        limit: z
            .number()
            .int()
            .min(0)
            .max(200)
            .optional()
            .describe("Top families to return (default 50)."),
    }),
    output: PatentLandscapeSchema,
    run: ({ technology, limit }) => {
        const r = patentLandscapeResult(technology, limit ?? 50);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const patentTools = [getPatentLandscape];
