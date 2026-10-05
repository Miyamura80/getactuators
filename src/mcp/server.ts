import { SITE_URL, absoluteUrl } from "@/server/site";
import { McpServer } from "@modelcontextprotocol/server";
import pkg from "../../package.json";
import { registerResources } from "./resources";
import { type ToolDef, registerTools } from "./tool";
import { actuatorTools } from "./tools/actuators";
import { compareTools } from "./tools/compare";
import { engineeringTools } from "./tools/engineering";
import { robotTools } from "./tools/robots";

// The public catalog MCP server: anonymous, read-only, stateless. A fresh
// instance is built per HTTP request (see ./http.ts), which is cheap because
// the catalog is an in-memory import.

export const SERVER_NAME = "actuatorlist";
export const REGISTRY_NAME = "io.github.Miyamura80/actuatorlist";
export const SERVER_TITLE = "actuatorlist: robot actuator catalog";
export const SERVER_VERSION = pkg.version;
export const SERVER_DESCRIPTION =
    "Spec-level data on robot actuators (QDD motors, integrated joints, smart servos, harmonic and cycloidal reducers), the robots that use them, and the motors in each robot joint. Free, anonymous and read-only.";
export const MCP_PATH = "/mcp";
export const ICON_URL = absoluteUrl("/favicon.svg");

export const CATALOG_TOOLS: readonly ToolDef[] = [
    ...actuatorTools,
    ...compareTools,
    ...robotTools,
    ...engineeringTools,
];

export const INSTRUCTIONS = `actuatorlist is an open, read-only catalog of robot actuators and the robots that use them. No account or key is needed and no tool changes anything.

Units are encoded in field names: _nm = newton-metres (N.m), _g = grams, _kg = kilograms, _mm = millimetres, _rpm = revolutions per minute, _usd = US dollars, _arcmin = arc-minutes, torque_density_nm_per_kg = peak N.m per kg. A null value means the manufacturer does not document it; never read null as zero, and say it is undocumented.

Provenance: every actuator carries sources (datasheet or product URLs) and verified=true when its specs were checked against manufacturer material. Cite page_url or sources when you quote numbers. Robot and motor data carry a credit block; keep that attribution.

Which tool to use:
- Open question about what fits a job ("actuator for a 12 kg quadruped leg"): recommend_actuators with use_case, min_peak_torque_nm, max_weight_g, max_price_usd and a priority.
- Filtering or sorting the catalog: search_actuators. Discover valid filter values with list_actuator_categories (category slugs, use-case tags) and list_brands.
- One actuator in full: get_actuator. Two to ten side by side, with the winner per metric: compare_actuators.
- Robots: list_robots, get_robot (joints resolved to motors and catalog actuator ids), find_robots_using_actuator.
- Sizing a humanoid: humanoid_joint_requirements gives a static torque estimate per joint (stated pose and arithmetic) and the catalog actuators that reach it. Treat estimates as a floor, not a dynamic requirement.
Bulk snapshots are also exposed as resources (catalog://actuators, catalog://robots, catalog://categories, actuator://{id}, robot://{id}). Website: ${SITE_URL}.`;

export function createCatalogServer(): McpServer {
    const server = new McpServer(
        {
            name: SERVER_NAME,
            title: SERVER_TITLE,
            version: SERVER_VERSION,
            description: SERVER_DESCRIPTION,
            websiteUrl: SITE_URL,
            icons: [{ src: ICON_URL, mimeType: "image/svg+xml", sizes: ["any"] }],
        },
        { instructions: INSTRUCTIONS },
    );
    registerTools(server, CATALOG_TOOLS);
    registerResources(server);
    return server;
}
