import { CATEGORIES } from "@/catalog";
import { REPO_URL, SITE_URL, absoluteUrl } from "@/server/site";
import { CATALOG_TOOLS, MCP_PATH } from "./server";

// Reference pages served by the docs MCP surface (/mcp/docs). Markdown,
// generated from the same constants the product server uses so they cannot
// drift from it.

export interface DocPage {
    id: string;
    title: string;
    description: string;
    markdown: string;
}

const FIELDS: [string, string][] = [
    ["id", "Stable slug; use it with get_actuator and in /actuators/{id} page URLs."],
    ["category", "One of the six category slugs (see Categories)."],
    ["use_cases", "Application tags such as quadruped_leg, humanoid_joint, robot_arm."],
    ["peak_torque_nm", "Peak (momentary) output torque in N.m."],
    ["rated_torque_nm", "Continuous (rated) output torque in N.m."],
    ["max_speed_rpm", "Maximum output speed in rpm."],
    [
        "gear_ratio",
        "Reduction as text, e.g. '9:1'; null for direct drive or undocumented.",
    ],
    ["weight_g", "Mass in grams."],
    ["torque_density_nm_per_kg", "Peak torque divided by mass, N.m/kg."],
    [
        "price_usd",
        "List price in USD when the vendor publishes one; null means quote-only.",
    ],
    ["price_per_nm", "price_usd divided by peak_torque_nm."],
    [
        "backdrivable",
        "Whether the output can be driven by external load (key for legged robots).",
    ],
    ["backlash_arcmin", "Output backlash in arc-minutes."],
    ["voltage_v", "Supply voltage, a number or a range string such as '24-48'."],
    ["kt_nm_per_a", "Torque constant in N.m per A."],
    ["comm", "Communication buses, e.g. CAN, EtherCAT, RS485."],
    ["integrated_driver", "Whether a motor driver is built in."],
    ["sources", "URLs the specs were taken from."],
    ["verified", "True when the specs were checked against manufacturer material."],
];

const overview: DocPage = {
    id: "overview",
    title: "What actuatorlist is",
    description: "Scope, audience, and the ways to read the catalog.",
    markdown: `# actuatorlist

actuatorlist (${SITE_URL}) is a free, open, spec-level catalog of robot actuators and of the robots that use them. It covers QDD / proprioceptive motors, integrated joint modules, smart servos, harmonic and cycloidal reducers, and frameless motor kits. Robot records map each joint to its motor.

## Ways to read the data

- MCP server: ${absoluteUrl(MCP_PATH)} (Streamable HTTP, anonymous, read-only).
- REST API: ${absoluteUrl("/api")} with an OpenAPI description at ${absoluteUrl("/openapi.json")} and docs at ${absoluteUrl("/docs/api")}.
- Plain-text summaries for models: ${absoluteUrl("/llms.txt")} and ${absoluteUrl("/llms-full.txt")}.
- Source and data files: ${REPO_URL}.

## Access and cost

Everything is public. There are no accounts, keys, quotas, payments or write operations.
`,
};

const fields: DocPage = {
    id: "data-fields",
    title: "Actuator data fields and units",
    description: "What each actuator field means and which unit it uses.",
    markdown: `# Actuator data fields

Units are part of the field name. A null value means the manufacturer does not document the value; it is never zero.

${FIELDS.map(([k, v]) => `- \`${k}\`: ${v}`).join("\n")}

## Robots

Robot records carry dof, payload_kg, reach_mm, weight_kg, price_usd (and price_max_usd for ranges), and joints: a list of { role, motor, count }. Each motor has torque, speed, gear ratio and mass, plus actuator_id when it matches a catalog actuator.
`,
};

const categories: DocPage = {
    id: "categories",
    title: "Actuator categories",
    description: "The six category slugs and what distinguishes them.",
    markdown: `# Actuator categories

${CATEGORIES.map((c) => `## ${c.label} (\`${c.slug}\`)\n\n${c.description}`).join("\n\n")}
`,
};

const mcp: DocPage = {
    id: "mcp",
    title: "Connecting to the MCP server",
    description: "Endpoint, client setup, and the list of catalog tools.",
    markdown: `# actuatorlist MCP server

Endpoint: ${absoluteUrl(MCP_PATH)} (Streamable HTTP, stateless, no auth). Server card: ${absoluteUrl("/.well-known/mcp/server-card.json")}.

## Connect

- Claude Code: \`claude mcp add --transport http actuatorlist ${absoluteUrl(MCP_PATH)}\`
- Cursor, Windsurf, VS Code and other clients: add a remote server with url ${absoluteUrl(MCP_PATH)}.

## Tools

${CATALOG_TOOLS.map((t) => `- \`${t.name}\`: ${t.description}`).join("\n")}

## Documentation surface

This documentation is also served over MCP at ${absoluteUrl(`${MCP_PATH}/docs`)} with search_docs and get_doc_page tools.
`,
};

export const DOC_PAGES: readonly DocPage[] = [overview, fields, categories, mcp];
