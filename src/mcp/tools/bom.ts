import { bomResult } from "@/api/bom";
import { BOM_SLUGS } from "@/supply-chain/bom";
import { bomCaseOut, bomListOut, bomListView } from "@/supply-chain/bom/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// Actuator teardowns (/bom): what is inside, who makes each part, what it
// costs against its raw material, and who keeps the margin.

const listBomCases = defineTool({
    name: "list_bom_cases",
    title: "List actuator BOM teardowns",
    description:
        "The three actuator teardowns on /bom (Tesla Optimus roller-screw linear actuator, Unitree GO-M8010-6 quasi-direct-drive motor, strain-wave cobot joint) with price, raw-material content, idiot index (price over raw material) and margin capture per tier, and the robots that use each. Use get_bom for the full tree.",
    input: z.object({}),
    output: bomListOut,
    run: () => bomListView(),
});

const getBom = defineTool({
    name: "get_bom",
    title: "Get an actuator bill of materials",
    description:
        "One /bom teardown as a tree, parents before children: each node's unit cost (cited, or null when not public), raw-material content at the case month, idiot index (unit cost over raw content), step multiplier (unit cost over its inputs), makers with gross margin and how sure the attribution is (reported, estimated, or modeled when a typical maker stands in), alternate makers, /manufacturing step ids, the usual making route, modeled mass, a cost stack for priced nodes (raw material, what tiers below added, labour and overhead, maker gross profit) and sources. Also the robots that use the actuator or its design (with site photo paths), the raw materials in one actuator and each tier's gross profit as a share of the price. Costs are mostly modeled from analyst shares: quote them as estimates.",
    input: z.object({
        slug: z.enum(BOM_SLUGS).describe(`Case slug: ${BOM_SLUGS.join(", ")}.`),
    }),
    output: bomCaseOut,
    run: ({ slug }) => {
        const r = bomResult(slug);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const bomTools = [listBomCases, getBom];
