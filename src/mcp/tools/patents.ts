import {
    PATENT_SCOPES,
    PatentLandscapeSchema,
    patentLandscapeResult,
    patentLimit,
} from "@/api/patents";
import {
    CAGR_YEARS,
    FIRST_YEAR,
    PATENT_LIMIT,
    TOP_ASSIGNEES,
    TOP_VALUE,
} from "@/patents/constants";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// /patents over MCP: one technology's patent landscape.

const getPatentLandscape = defineTool({
    name: "get_patent_landscape",
    title: "Get a technology's patent landscape",
    description: `Patent families since ${FIRST_YEAR} for one actuator technology from /patents, deduplicated by DOCDB family, from Google Patents Public Datasets on BigQuery. Returns the reviewed CPC codes with their rationale and keyword filters, families per priority year (years from incomplete_from on are still being published, so do not read their drop as a decline), families per applicant country per year, the top ${TOP_ASSIGNEES} first assignees with family count, share and ${CAGR_YEARS}-year CAGR (company_id links to get_company), the top-five share, per-year counts of granted, 2+ office and US+EP+JP families, a value view (top ${TOP_VALUE} assignees with the share filed in 2+ offices and granted families; Chinese vs other applicants filed abroad), application areas by CPC co-classification with early and late shares, and the largest families with Google Patents links. Use technology "all" for every family once.`,
    input: z.object({
        technology: z
            .enum(PATENT_SCOPES)
            .describe(`Technology id: ${PATENT_SCOPES.join(", ")}.`),
        limit: patentLimit(z.number()).optional(),
    }),
    output: PatentLandscapeSchema,
    run: ({ technology, limit }) => {
        const r = patentLandscapeResult(technology, limit ?? PATENT_LIMIT);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const patentTools = [getPatentLandscape];
