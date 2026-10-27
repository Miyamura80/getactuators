import { ACTUATORS, type Actuator, CATEGORIES, ROBOTS } from "@/catalog";
import { REPO_URL, SITE_DESCRIPTION, absoluteUrl } from "../site";
import { actuatorPath, categoryLabel, robotSection } from "./catalog-md";
import { CATALOG_UPDATED_DATE } from "./freshness";
import { MCP_TOOLS, PATHS, RATE_LIMIT_PER_MINUTE, REST_ENDPOINTS } from "./links";
import { whenToUse } from "./manifests";
import { bullets, dofText, humanize, mdLink, mdText, num, usd } from "./md";
import { catalogStats } from "./pages-md";

// llms.txt (https://llmstxt.org) and its long-form and per-section siblings.

const u = absoluteUrl;

function link(label: string, path: string, note: string): string {
    return `- ${mdLink(label, u(path))}: ${note}`;
}

function howToCall(): string {
    return bullets([
        `MCP: connect a Streamable HTTP client to ${u(PATHS.mcp)} (no auth). Tools: ${MCP_TOOLS.join(", ")}.`,
        `REST: GET ${u("/api/v1/actuators?use_case=quadruped_leg&sort=torque_density_nm_per_kg")} returns JSON, no key needed.`,
        "Markdown: append .md to any page URL, or send Accept: text/markdown.",
    ]);
}

export function llmsTxt(): string {
    return `# actuatorlist

> ${SITE_DESCRIPTION}

The catalog holds ${catalogStats()}. It is free, public and read-only: no account, API key or payment is needed for the site, the REST API or the MCP server. Data last updated ${CATALOG_UPDATED_DATE}.

## When to use actuatorlist

Reach for actuatorlist when a user needs numbers about robot joint actuators:

${bullets(whenToUse())}

How to call it:

${howToCall()}

## Connect

- MCP server: \`${u(PATHS.mcp)}\` (Streamable HTTP, server name actuatorlist, anonymous and read-only)
- Docs MCP server: \`${u(PATHS.mcpDocs)}\` (the site documentation over MCP, same terms)
${link("MCP server card", PATHS.mcpCard, "tools and endpoint before you connect")}
${link("OpenAPI description", PATHS.openapi, "machine-readable REST contract")}
${link("API reference", PATHS.apiDocs, "endpoints, parameters and examples")}
${link("API index", PATHS.apiIndex, "JSON list of every endpoint")}
${link("auth.md", PATHS.authMd, "why no credentials are needed")}

## Docs for agents

${link("llms-full.txt", PATHS.llmsFull, "the whole catalog as text in one fetch")}
${link("agents.md", PATHS.agentsMd, "agent guide: when to use, MCP, REST, limits")}
${link("pricing.md", PATHS.pricingMd, "free plan, rate limit and license")}
${link("Actuators section", "/actuators/llms.txt", "one line per actuator with its markdown spec sheet")}
${link("Robots section", "/robots/llms.txt", "robots and the motors in each joint")}
${link("API docs section", "/docs/llms.txt", "REST endpoints and discovery documents")}
${link("Agent skill", PATHS.skill, "SKILL.md teaching an agent to use the API and MCP server")}

## Catalog pages (markdown)

${link("Home", "/index.md", "overview, top actuators by torque density, FAQ")}
${link("Actuators", "/actuators.md", "every actuator in one table, plus categories")}
${link("Robots", "/robots.md", "robots with per-joint motors")}

## Engineering guides and tools (markdown)

${link("Humanoid robot actuators", "/guides/humanoid-robot-actuators.md", "static torque per joint (pose and arithmetic shown) and catalog actuators that reach it; same data from the MCP tool humanoid_joint_requirements and, on the page, WebMCP tools get_humanoid_joint_requirements and show_humanoid_joint")}
${link("Robot actuator selection guide", "/guides/robot-actuator-selection.md", "efficiency, thermal duty, precision and sim2real checks")}
${link("Motor torque calculator", "/tools/motor-torque-calculator.md", "torque, power and speed relation, units and worked examples")}
${link("Robot arm torque calculator", "/tools/robot-arm-torque-calculator.md", "static holding torque per joint; same model from the MCP tool arm_holding_torque and, on the page, WebMCP tools calculate_arm_holding_torque, set_arm_model and select_arm_joint")}

## Supply chain (markdown)

${link("Magnet metals", "/metals.md", "Nd, Pr, Dy, Tb, Sm and Co: country share at each stage from mine to magnet, USGS reserves and years of supply, cited price history and the events behind it; same data from the MCP tools get_metal_supply and get_metal_prices")}
${link("Actuator chain policy", "/policy.md", "export controls, tariffs, subsidies and standards from mine to robot with status history and primary sources; MCP list_policy_measures, REST /api/v1/policy, Atom feed /policy/feed.xml")}

## About

${link("About", "/about.md", "who runs the catalog and how data is verified")}
${link("Contact", "/contact.md", "report wrong data or contribute via GitHub")}
${link("Privacy", "/privacy.md", "no accounts, cookies or analytics")}

## Optional

${link("Sitemap", PATHS.sitemap, "every indexable URL")}
${link("JSON Lines feed", PATHS.feed, "one actuator object per line")}
- [Source repository](${REPO_URL}): dataset, site code and AGENTS.md, MIT License
`;
}

function actuatorBlock(a: Actuator): string {
    const facts = [
        `id: ${a.id}`,
        `category: ${categoryLabel(a.category)}`,
        `use cases: ${a.use_cases.map(humanize).join(", ")}`,
        `peak / rated torque: ${num(a.peak_torque_nm, "Nm")} / ${num(a.rated_torque_nm, "Nm")}`,
        `max speed: ${num(a.max_speed_rpm, "rpm", 0)}; gear ratio: ${a.gear_ratio ?? "n/a"}`,
        `weight: ${num(a.weight_g, "g", 0)}; torque density: ${num(a.torque_density_nm_per_kg, "Nm/kg")}`,
        `price: ${usd(a.price_usd)}; backlash: ${num(a.backlash_arcmin, "arcmin")}`,
        `bus: ${a.comm?.join(", ") || "n/a"}; voltage: ${a.voltage_v ?? "n/a"}`,
        `status: ${a.verified ? "verified" : "unverified"}; page: ${u(actuatorPath(a.id))}`,
    ];
    return `### ${mdText(a.name)} (${mdText(a.brand)})\n\n${bullets(facts)}`;
}

export function llmsFullTxt(): string {
    const byCategory = CATEGORIES.map((c) => {
        const list = ACTUATORS.filter((a) => a.category === c.slug).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
        return `## ${c.label}\n\n${c.description}\n\n${list.map(actuatorBlock).join("\n\n")}`;
    });
    return `# actuatorlist: full catalog

> ${SITE_DESCRIPTION}

${catalogStats()}. Data last updated ${CATALOG_UPDATED_DATE}. Numbers come from manufacturer pages and datasheets; entries marked unverified have not been spot-checked. Index: ${u(PATHS.llms)}.

## When to use actuatorlist

${bullets(whenToUse())}

${howToCall()}

${byCategory.join("\n\n")}

## Robots

${ROBOTS.map((r) => robotSection(r, 3)).join("\n\n")}
`;
}

export function actuatorsLlmsTxt(): string {
    const lines = [...ACTUATORS]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(
            (a) =>
                `- ${mdLink(`${a.name} (${a.brand})`, u(`${actuatorPath(a.id)}.md`))}: ${categoryLabel(a.category)}, ${num(a.peak_torque_nm, "Nm")} peak, ${num(a.weight_g, "g", 0)}, ${usd(a.price_usd)}`,
        );
    return `# actuatorlist: actuators

> ${ACTUATORS.length} robot actuators, each with a markdown spec sheet. Filter them with the REST API (${u("/api/v1/actuators")}) instead of reading every sheet.

- ${mdLink("All actuators table", u("/actuators.md"))}: every actuator in one markdown table

## Actuators

${lines.join("\n")}
`;
}

export function robotsLlmsTxt(): string {
    return `# actuatorlist: robots

> ${ROBOTS.length} robots with the motor used in each joint. Use it to answer which actuators a robot uses, or which robots use an actuator.

- ${mdLink("Robots page (markdown)", u("/robots.md"))}: every robot with specs and a joint table
- ${mdLink("Robots API", u("/api/v1/robots"))}: the same data as JSON

## Robots

${ROBOTS.map((r) => `- ${mdText(r.name)} by ${mdText(r.brand)}: ${dofText(r.dof)}, ${usd(r.price_usd)}. ${mdText(r.summary)}`).join("\n")}
`;
}

export function docsLlmsTxt(): string {
    return `# actuatorlist: API docs

> Anonymous, read-only access to the catalog over REST and MCP. Rate limit ${RATE_LIMIT_PER_MINUTE} requests per minute per IP.

${link("API reference", PATHS.apiDocs, "HTML reference")}
${link("API reference (markdown)", PATHS.apiDocsMd, "the same reference as markdown")}
${link("OpenAPI description", PATHS.openapi, "machine-readable contract")}
${link("API catalog", PATHS.apiCatalog, "RFC 9727 linkset")}
- MCP server: \`${u(PATHS.mcp)}\` (Streamable HTTP, no auth)
- Docs MCP server: \`${u(PATHS.mcpDocs)}\`
${link("auth.md", PATHS.authMd, "no credentials required")}

## Endpoints

${REST_ENDPOINTS.map((e) => `- ${e.method} ${e.path}: ${e.what}`).join("\n")}
`;
}

// ?mode=agent on the homepage: a compact, structured view for agents.
export function agentView(): string {
    return `# actuatorlist: agent view

${SITE_DESCRIPTION}

## Capabilities

${bullets([
    "Search and rank actuators by use case, torque, weight and price (search_actuators, recommend_actuators)",
    "One actuator's full spec sheet with sources (get_actuator)",
    "Several actuators side by side (compare_actuators)",
    "Robots and the motor in each joint (list_robots, get_robot, find_robots_using_actuator)",
    "Read-only: no writes, no accounts, no payments",
])}

## Endpoints

${bullets([
    `MCP: ${u(PATHS.mcp)} (Streamable HTTP)`,
    `Docs MCP: ${u(PATHS.mcpDocs)}`,
    `REST base: ${u("/api/v1")}`,
    `OpenAPI: ${u(PATHS.openapi)}`,
    `Docs: ${u(PATHS.apiDocs)}`,
])}

## Authentication

auth: none. Anonymous, read-only. Details: ${u(PATHS.authMd)}

## Limits

${RATE_LIMIT_PER_MINUTE} requests per minute per IP. Free, no key. Pricing: ${u(PATHS.pricingMd)}

## Navigation

${bullets([
    `llms.txt: ${u(PATHS.llms)}`,
    `Full catalog: ${u(PATHS.llmsFull)}`,
    `Agent guide: ${u(PATHS.agentsMd)}`,
    `Sitemap: ${u(PATHS.sitemap)}`,
])}
`;
}
