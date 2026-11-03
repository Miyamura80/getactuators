import { PeopleListSchema, peopleList } from "@/api/people";
import { PEOPLE_DOMAINS } from "@/people";
import { z } from "zod";
import { defineTool } from "../tool";

// The /people directory as an MCP tool. Same wire shape as GET /api/v1/people.
const listPeople = defineTool({
    name: "list_people",
    title: "Leading people in actuators and rare earths",
    description:
        "Researched directory of who matters in robot actuators and the rare-earth magnet supply chain: actuator researchers (series elastic, proprioceptive, artificial muscles), actuator and humanoid company founders, magnet and rare earth executives, and analysts and policy leads. Each person has role, main and other affiliations (with supply-chain company ids), why they matter, key works with links, the inclusion criterion met and sources. Filter by domain: research, industry, magnets or policy.",
    input: z.object({
        domain: z
            .enum(PEOPLE_DOMAINS)
            .optional()
            .describe("research, industry, magnets or policy. Omit for everyone."),
    }),
    output: PeopleListSchema,
    run: ({ domain }) => peopleList(domain),
});

export const peopleTools = [listPeople];
