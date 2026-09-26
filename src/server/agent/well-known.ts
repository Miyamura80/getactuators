import { join } from "node:path";
import { REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "../site";
import { CATALOG_UPDATED_AT } from "./freshness";
import { HOST, MCP_TOOLS, PATHS } from "./links";

// /.well-known discovery documents: ARD catalog, A2A agent card, RFC 9727 API
// catalog and the Agent Skills index.

const u = absoluteUrl;

const SKILL_FILE = join(
    import.meta.dir,
    "..",
    "..",
    "..",
    "skills",
    "actuatorlist",
    "SKILL.md",
);

// The served SKILL.md bytes; the index digest is computed from these.
export async function skillMarkdown(): Promise<Uint8Array<ArrayBuffer> | null> {
    const file = Bun.file(SKILL_FILE);
    if (!(await file.exists())) return null;
    return new Uint8Array(await file.arrayBuffer());
}

function sha256(bytes: Uint8Array): string {
    return new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
}

export async function skillsIndex(): Promise<Record<string, unknown>> {
    const bytes = await skillMarkdown();
    return {
        $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
        skills: bytes
            ? [
                  {
                      name: "actuatorlist",
                      type: "skill-md",
                      description:
                          "Find, rank and compare robot actuators (torque, weight, price) and the motors in real robots via the actuatorlist REST API or MCP server.",
                      url: PATHS.skill,
                      digest: `sha256:${sha256(bytes)}`,
                  },
              ]
            : [],
    };
}

const TRUST = {
    identity: SITE_URL,
    identityType: "https",
    provenance: [{ relation: "sourceCode", sourceId: REPO_URL }],
};

function entry(
    namespace: string,
    name: string,
    fields: {
        displayName: string;
        type: string;
        url?: string;
        data?: Record<string, unknown>;
        description: string;
        representativeQueries: string[];
        capabilities?: string[];
    },
): Record<string, unknown> {
    return {
        identifier: `urn:air:${HOST}:${namespace}:${name}`,
        ...fields,
        tags: ["robotics", "actuators", "catalog"],
        updatedAt: CATALOG_UPDATED_AT,
        trustManifest: TRUST,
    };
}

const QUERIES = [
    "which actuator should I use for a quadruped leg",
    "compare RobStride 02 and CubeMars AK80-9 torque and weight",
    "highest torque density humanoid joint actuator under 1 kg",
    "what motors does a low-cost robot arm use in each joint",
];

export function ardManifest(): Record<string, unknown> {
    return {
        specVersion: "0.91",
        publisher: { name: SITE_NAME, url: SITE_URL },
        entries: [
            entry("mcp", "actuatorlist", {
                displayName: "actuatorlist MCP server",
                type: "application/mcp-server-card+json",
                url: u(PATHS.mcpCard),
                description: `Anonymous, read-only MCP server (Streamable HTTP at ${u(PATHS.mcp)}) over the robot actuator catalog.`,
                representativeQueries: QUERIES,
                capabilities: [...MCP_TOOLS],
            }),
            entry("mcp", "actuatorlist-docs", {
                displayName: "actuatorlist docs MCP server",
                type: "application/mcp-server-card+json",
                data: {
                    name: "actuatorlist-docs",
                    description:
                        "The actuatorlist site and API documentation over MCP.",
                    serverUrl: u(PATHS.mcpDocs),
                    remotes: [{ type: "streamable-http", url: u(PATHS.mcpDocs) }],
                },
                description: `Anonymous MCP server (Streamable HTTP at ${u(PATHS.mcpDocs)}) for reading the actuatorlist documentation.`,
                representativeQueries: [
                    "how do I filter actuatorlist by torque",
                    "what does the actuatorlist API return for an actuator",
                ],
            }),
            entry("api", "rest", {
                displayName: "actuatorlist REST API",
                type: "application/vnd.oai.openapi+json",
                url: u(PATHS.openapi),
                description:
                    "JSON REST API for actuators, robots, categories and brands. No key required.",
                representativeQueries: QUERIES.slice(0, 3),
            }),
            entry("agent", "actuatorlist", {
                displayName: "actuatorlist agent card",
                type: "application/a2a-agent-card+json",
                url: u(PATHS.agentCard),
                description:
                    "A2A agent card describing the catalog's skills; calls go to the MCP server.",
                representativeQueries: QUERIES.slice(0, 2),
            }),
            entry("skill", "actuatorlist", {
                displayName: "actuatorlist agent skill",
                type: "application/ai-skill+md",
                url: u(PATHS.skill),
                description:
                    "SKILL.md that teaches an agent to pick and compare actuators with actuatorlist.",
                representativeQueries: QUERIES.slice(0, 2),
            }),
            entry("docs", "llms-txt", {
                displayName: "actuatorlist llms.txt",
                type: "text/plain",
                url: u(PATHS.llms),
                description:
                    "Index of every agent-facing document and page on actuatorlist.",
                representativeQueries: [
                    "robot actuator database for AI agents",
                    "open dataset of robot joint motors with specs",
                ],
            }),
        ],
    };
}

export function agentCard(): Record<string, unknown> {
    const skill = (
        id: string,
        name: string,
        description: string,
        examples: string[],
    ) => ({
        id,
        name,
        description,
        tags: ["robotics", "actuators"],
        examples,
        inputModes: ["application/json", "text/plain"],
        outputModes: ["application/json", "text/markdown"],
    });
    return {
        protocolVersion: "0.3.0",
        name: SITE_NAME,
        description: `${SITE_DESCRIPTION} Discovery card only: there is no A2A transport, so url points at the MCP server.`,
        url: u(PATHS.mcp),
        version: "1.0.0",
        provider: { organization: SITE_NAME, url: SITE_URL },
        iconUrl: u("/favicon.svg"),
        documentationUrl: u(PATHS.agentsMd),
        capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: false,
        },
        defaultInputModes: ["application/json", "text/plain"],
        defaultOutputModes: ["application/json", "text/markdown"],
        skills: [
            skill(
                "search_actuators",
                "Search actuators",
                "Filter and rank robot actuators by use case, category, brand, torque, weight and price (MCP tools search_actuators and recommend_actuators).",
                [QUERIES[0] ?? "", QUERIES[2] ?? ""],
            ),
            skill(
                "compare_actuators",
                "Compare actuators",
                "Compare several actuators side by side on torque, speed, weight, gearing and price (MCP tool compare_actuators).",
                [QUERIES[1] ?? ""],
            ),
            skill(
                "find_robots_using_actuator",
                "Robot joint motors",
                "List robots and the motor used in each joint, or the robots that use an actuator (MCP tools list_robots, get_robot, find_robots_using_actuator).",
                [QUERIES[3] ?? ""],
            ),
        ],
    };
}

export function apiCatalog(): Record<string, unknown> {
    return {
        linkset: [
            {
                anchor: u("/api/v1"),
                "service-desc": [
                    {
                        href: u(PATHS.openapi),
                        type: "application/vnd.oai.openapi+json",
                    },
                ],
                "service-doc": [
                    { href: u(PATHS.apiDocs), type: "text/html" },
                    { href: u(PATHS.apiDocsMd), type: "text/markdown" },
                ],
                "service-meta": [{ href: u(PATHS.pricingMd), type: "text/markdown" }],
            },
            {
                anchor: u(PATHS.mcp),
                "service-desc": [{ href: u(PATHS.mcpCard), type: "application/json" }],
                "service-doc": [{ href: u(PATHS.agentsMd), type: "text/markdown" }],
            },
        ],
    };
}
