import { SITE_URL, absoluteUrl } from "@/server/site";
import { McpServer } from "@modelcontextprotocol/server";
import pkg from "../../package.json";
import { registerResources } from "./resources";
import { type ToolDef, registerTools } from "./tool";
import { actuatorTools } from "./tools/actuators";
import { altTools } from "./tools/alts";
import { benchmarkTools } from "./tools/benchmarks";
import { bomTools } from "./tools/bom";
import { compareTools } from "./tools/compare";
import { engineeringTools } from "./tools/engineering";
import { patentTools } from "./tools/patents";
import { peopleTools } from "./tools/people";
import { priceTools } from "./tools/prices";
import { processTools } from "./tools/processes";
import { robotTools } from "./tools/robots";
import { sdkTools } from "./tools/sdk";
import { supplyChainTools } from "./tools/supply-chain";
import { trendTools } from "./tools/trends";

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
    ...supplyChainTools,
    ...benchmarkTools,
    ...processTools,
    ...sdkTools,
    ...peopleTools,
    ...altTools,
    ...bomTools,
    ...trendTools,
    ...priceTools,
    ...patentTools,
];

export const INSTRUCTIONS = `actuatorlist is an open, read-only catalog of robot actuators and the robots that use them. No account or key is needed and no tool changes anything.

Units are encoded in field names: _nm = newton-metres (N.m), _g = grams, _kg = kilograms, _mm = millimetres, _rpm = revolutions per minute, _usd = US dollars, _arcmin = arc-minutes, torque_density_nm_per_kg = peak N.m per kg. A null value means the manufacturer does not document it; never read null as zero, and say it is undocumented.

Provenance: every actuator carries sources (datasheet or product URLs) and verified=true when its specs were checked against manufacturer material. Cite page_url or sources when you quote numbers. Robot and motor data carry a credit block; keep that attribution.

Which tool to use:
- Open question about what fits a job ("actuator for a 12 kg quadruped leg"): recommend_actuators with use_case, min_peak_torque_nm, max_weight_g, max_price_usd and a priority.
- Filtering or sorting the catalog: search_actuators. Discover valid filter values with list_actuator_categories (category slugs, use-case tags) and list_brands.
- One actuator in full: get_actuator. Two to ten side by side, with the winner per metric: compare_actuators.
- Robots: list_robots, get_robot (joints resolved to motors and catalog actuator ids), find_robots_using_actuator.
- Humanoids joint by joint (actuator type per joint, reported vs estimated, magnet and rare-earth kg): get_humanoid_joints.
- Open-source robots to build from (licences, openness per artefact, BOM cost, actuators per joint): list_open_robots.
- Sizing a humanoid: humanoid_joint_requirements gives a static torque estimate per joint (stated pose and arithmetic) and the catalog actuators that reach it. Treat estimates as a floor, not a dynamic requirement.
- Supply chain (who makes magnets, gears and actuators, and where): list_companies, get_company and list_sites. Magnet metals (Nd, Pr, Dy, Tb, Sm, Co): get_metal_supply for country shares by stage, reserves and latest prices; get_metal_prices for a cited price history. Export controls, tariffs, subsidies and standards on the chain, with status history: list_policy_measures. How the NdFeB magnet is made (ore to rotor segment) and how the precision parts are made (strain-wave gears, planetary roller screws, precision bearings, encoders), with cited numbers and who runs each step: get_process. One country's chain on a map (companies, plants, links, stage shares, clusters): get_country. Alternatives to rare-earth actuators (rare-earth-free motors, artificial muscles, hydraulics, transmissions) with TRL, milestones, market size and deployments: list_alt_technologies and get_alt_technology. What is inside an actuator, who makes each part, the idiot index (cost over raw material) and who keeps the margin, for three teardowns: list_bom_cases and get_bom. Sourced values carry sources and a confidence (reported, estimated or modeled); quote estimates as estimates.
- Sizing a robot arm: arm_holding_torque takes link lengths, masses, actuator masses and payload and returns static holding torque per joint, catalog actuators per joint and a calculator_url the user can open.
- Measured performance (dyno and bench tests, not datasheet claims): get_benchmarks gives torque-speed curves, thermal derating, backlash and friction per run with its rig, data method, uncertainty, source, independence and the measured over datasheet ratio. Say whether a figure was digitised from a plot or is vendor data; only independent runs carry a verdict.
- Which actuator brand has the best SDK (drivers, ROS 2, docs, firmware, support), with linked developer posts: get_sdk_score. get_actuator also returns the brand's SDK score as sdk.
- Who matters in actuators and rare-earth magnet supply (researchers, founders, magnet and rare earth executives, analysts, policy leads) with affiliation, key works and sources: list_people, optionally by domain.
- How prices, market shares and runtimes have moved over time (actuator list prices and $/N·m, humanoid shipments by company, roller screw cost, the price of AI against electricity and batteries, humanoid battery runtime), every point dated and cited: get_trends.
- Who files patents in an actuator technology (robot joints, strain-wave, cycloidal and planetary gears, roller and ball screws, NdFeB and rare-earth-free magnets, reluctance and axial-flux motors, artificial muscles, electrohydrostatic actuators): families per year and applicant country, top assignees with 3-year growth, and the largest families: get_patent_landscape.
- One actuator's dated list prices (weekly snapshots, Wayback, curated and catalog points, each with method, page URL and FX rate), latest price and 1-year change: get_price_history.
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
