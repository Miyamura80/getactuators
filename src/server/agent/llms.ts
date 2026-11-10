import { ACTUATORS, type Actuator, CATEGORIES, ROBOTS } from "@/catalog";
import { LIVE_COUNTRY_PAGES } from "@/supply-chain/country-pages";
import {
    CODE_LICENSE,
    DATA_LICENSE,
    REPO_URL,
    SITE_DESCRIPTION,
    absoluteUrl,
} from "../site";
import {
    ROBOT_KIND_LABEL,
    actuatorPath,
    categoryLabel,
    robotKindCounts,
    robotSection,
} from "./catalog-md";
import { CATALOG_UPDATED_DATE } from "./freshness";
import { MCP_TOOLS, PATHS, RATE_LIMIT_PER_MINUTE, REST_ENDPOINTS } from "./links";
import { whenToUse } from "./manifests";
import { bullets, dofText, humanize, mdLink, mdText, num, usd } from "./md";
import { catalogStats } from "./pages-md";

// llms.txt (https://llmstxt.org) and its long-form and per-section siblings.

const u = absoluteUrl;

// One line per live country page (/japan, ...), each ending in a newline.
function countryLinks(): string {
    return LIVE_COUNTRY_PAGES.map(
        (p) =>
            `${link(`${p.name}: actuator supply chain`, `${p.path}.md`, `map of rare earth, magnet and motor, gear and bearing, and robot companies with plants, supply links and stage shares; MCP get_country("${p.code}"), REST /api/v1/countries/${p.code}`)}\n`,
    ).join("");
}

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
${link("Robots section", "/robots/llms.txt", "humanoids, robot arms and quadrupeds with the motors in each joint")}
${link("API docs section", "/docs/llms.txt", "REST endpoints and discovery documents")}
${link("Agent skill", PATHS.skill, "SKILL.md teaching an agent to use the API and MCP server")}

## Catalog pages (markdown)

${link("Home", "/index.md", "overview, top actuators by torque density, FAQ")}
${link("Actuators", "/actuators.md", "every actuator in one table, plus categories")}
${link("Robots", "/robots.md", "humanoids, robot arms and quadrupeds with per-joint motors")}
${link("Humanoid joint map", "/humanoids.md", "humanoids mapped joint by joint onto one canonical joint set: actuator type, motor, peak torque or force, and estimated magnet and rare-earth content per robot; MCP get_humanoid_joints, REST /api/v1/humanoids")}
${link("Trends", "/trends.md", "actuator list prices and $/N·m over time, humanoid shipments by company, roller screw cost, the price of AI against electricity and batteries (Epoch AI, Tadepalli) and humanoid battery runtime, every point dated and cited; MCP get_trends, REST /api/v1/trends")}
${link("Open-source robots", "/open-source.md", "robots you can build from published designs: openness matrix with links, licences, BOM cost, actuators per joint and lineage; MCP list_open_robots, REST /api/v1/open-robots")}

## Engineering guides and tools (markdown)

${link("Humanoid robot actuators", "/guides/humanoid-robot-actuators.md", "static torque per joint (pose and arithmetic shown) and catalog actuators that reach it; same data from the MCP tool humanoid_joint_requirements and, on the page, WebMCP tools get_humanoid_joint_requirements and show_humanoid_joint")}
${link("Robot actuator selection guide", "/guides/robot-actuator-selection.md", "efficiency, thermal duty, precision and sim2real checks")}
${link("Motor torque calculator", "/tools/motor-torque-calculator.md", "torque, power and speed relation, units and worked examples")}
${link("Robot arm torque calculator", "/tools/robot-arm-torque-calculator.md", "static holding torque per joint; same model from the MCP tool arm_holding_torque and, on the page, WebMCP tools calculate_arm_holding_torque, set_arm_model and select_arm_joint")}
${link("Measured actuator benchmarks", "/benchmarks.md", "measured runs (vendor test reports, papers, blogs, digitised plots, and dyno or bench runs) against datasheet claims: torque-speed curves, thermal derating, backlash and friction per run with rig, data method, uncertainty and source; MCP get_benchmarks, REST /api/v1/benchmarks")}
${link("Best actuator SDKs", "/sdk.md", "SDK scores per brand on seven dimensions (protocol, bindings, ROS 2 and sim, docs, firmware, support, comms) from objective checks and developer posts, with evidence links; MCP get_sdk_score, REST /api/v1/sdk")}
${link("Leading people", "/people.md", "researched directory of leading voices in actuators and rare-earth magnet supply: researchers, founders, magnet and rare earth executives, analysts and policy leads with affiliation, key works and sources; MCP list_people, REST /api/v1/people")}

## Supply chain (markdown)

${link("Magnet metals", "/metals.md", "Nd, Pr, Dy, Tb, Sm and Co: country share at each stage from mine to magnet, USGS reserves and years of supply, cited price history and the events behind it; same data from the MCP tools get_metal_supply and get_metal_prices")}
${link("Actuator chain policy", "/policy.md", "export controls, tariffs, subsidies and standards from mine to robot with status history and primary sources; MCP list_policy_measures, REST /api/v1/policy, Atom feed /policy/feed.xml")}
${link("How actuator magnets and precision parts are made", "/manufacturing.md", "every step from rare earth ore to a magnetised NdFeB rotor segment, and from bar stock to tested strain-wave gears, planetary roller screws, precision bearings and encoders, with cited tolerances, temperatures and yields, who runs it and the country concentration; MCP get_process, REST /api/v1/processes/magnet and /api/v1/processes/precision")}
${link("Actuator bills of materials", "/bom.md", "three teardowns (Optimus roller-screw linear actuator, Unitree QDD motor, strain-wave cobot joint): every part with its cited or modeled cost, raw material, idiot index, maker and gross margin, and who keeps the price; MCP list_bom_cases and get_bom, REST /api/v1/bom")}
${link("Alternatives to rare-earth actuators", "/alts.md", "rare-earth-free motors, artificial muscles, hydraulic drives and transmissions with cited TRL, milestones (announced targets flagged), market size and growth, dated deployments and how each works; MCP list_alt_technologies and get_alt_technology, REST /api/v1/alts")}

${link("Companies and plants (JSON)", "/api/v1/companies", "the companies, plants and supply links behind the atlas maps, every figure cited; MCP list_companies, get_company and list_sites, REST /api/v1/companies and /api/v1/sites")}

${countryLinks()}
## About

${link("About", "/about.md", "who runs the catalog and how data is verified")}
${link("Contact", "/contact.md", "report wrong data or contribute via GitHub")}
${link("Privacy", "/privacy.md", "no accounts, cookies or analytics")}

## Optional

${link("Sitemap", PATHS.sitemap, "every indexable URL")}
${link("JSON Lines feed", PATHS.feed, "one actuator object per line")}
- [Source repository](${REPO_URL}): dataset (${DATA_LICENSE.name}), site code (${CODE_LICENSE.name}) and AGENTS.md
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

> ${ROBOTS.length} robots (${robotKindCounts(ROBOTS)}) with the motor used in each joint. Use it to answer which actuators a robot uses, or which robots use an actuator. Many quadruped makers do not name their joint motors, so those joints carry a role and count with a null motor.

- ${mdLink("Robots page (markdown)", u("/robots.md"))}: every robot with specs and a joint table
- ${mdLink("Robots API", u("/api/v1/robots"))}: the same data as JSON; filter with \`?kind=humanoid\`, \`robot_arm\` or \`quadruped\` (MCP: list_robots with kind)

## Robots

${ROBOTS.map((r) => `- ${mdText(r.name)} by ${mdText(r.brand)} (${ROBOT_KIND_LABEL[r.kind].toLowerCase()}): ${dofText(r.dof)}, ${usd(r.price_usd)}. ${mdText(r.summary)}`).join("\n")}
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
