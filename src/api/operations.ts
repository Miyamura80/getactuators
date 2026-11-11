import { CAGR_YEARS, FIRST_YEAR, LAG_MONTHS, TOP_ASSIGNEES } from "@/patents/constants";
import type { z } from "zod";
import {
    AltListParams,
    AltTechListSchema,
    AltTechSchema,
    getAltHandler,
    listAltsHandler,
} from "./alts";
import {
    BenchmarkListParams,
    BenchmarkListSchema,
    actuatorBenchmarksHandler,
    listBenchmarksHandler,
} from "./benchmarks";
import { BomCaseSchema, BomListSchema, getBomHandler, listBomHandler } from "./bom";
import {
    CountryListSchema,
    CountrySchema,
    getCountryHandler,
    listCountriesHandler,
} from "./countries";
import {
    compareActuatorsGet,
    compareActuatorsPost,
    getActuatorById,
    getRobotById,
    listActuators,
    listBrandsHandler,
    listCategories,
    listRobots,
    listUseCasesHandler,
} from "./handlers";
import type { ApiHandler } from "./http";
import {
    HumanoidDetailSchema,
    HumanoidListSchema,
    getHumanoidById,
    listHumanoids,
} from "./humanoids";
import {
    MetalListSchema,
    MetalPriceParams,
    MetalPricesSchema,
    MetalSupplyParams,
    MetalSupplySchema,
    getMetalHandler,
    getMetalPricesHandler,
    listMetalsHandler,
} from "./metals";
import {
    OpenRobotListParams,
    OpenRobotListSchema,
    OpenRobotSchema,
    getOpenRobotHandler,
    listOpenRobotsHandler,
} from "./open-robots";
import { ActuatorListParams, CompareQueryParams, RobotListParams } from "./params";
import {
    PATENT_SCOPES,
    PatentLandscapeSchema,
    PatentParams,
    patentLandscapeHandler,
} from "./patents";
import {
    PeopleListParams,
    PeopleListSchema,
    PersonSchema,
    getPersonHandler,
    listPeopleHandler,
} from "./people";
import {
    PolicyListParams,
    PolicyListSchema,
    PolicyMeasureSchema,
    getPolicyHandler,
    listPolicyHandler,
} from "./policy";
import { PriceHistorySchema, priceHistoryHandler } from "./prices";
import {
    ProcessChainListSchema,
    ProcessChainSchema,
    ProcessParams,
    getProcessHandler,
    listProcessesHandler,
} from "./processes";
import {
    ActuatorDetailSchema,
    ActuatorListSchema,
    CategoryListSchema,
    CompareBodySchema,
    CompareResultSchema,
    NamedCountListSchema,
    RobotDetailSchema,
    RobotListSchema,
} from "./schemas";
import {
    SdkBrandSchema,
    SdkListParams,
    SdkListSchema,
    getSdkHandler,
    listSdkHandler,
} from "./sdk";
import {
    CompanyDetailSchema,
    CompanyListParams,
    CompanyListSchema,
    SiteListParams,
    SiteListSchema,
    getCompanyHandler,
    listCompaniesHandler,
    listSitesHandler,
} from "./supply-chain";
import { TrendListSchema, TrendParams, listTrendsHandler } from "./trends";

// The API surface as data. Routes, the /api index, the OpenAPI document and the
// developer docs are all generated from this list, so they cannot disagree.

export interface Operation {
    operationId: string;
    method: "GET" | "POST";
    // Router syntax (`:id`); openapi.ts converts to `{id}`.
    path: string;
    summary: string;
    description: string;
    query?: z.ZodObject;
    pathParam?: { name: string; description: string; example: string };
    body?: z.ZodType;
    response: z.ZodType;
    // Extra error statuses beyond the 429/500 every operation can return.
    errors: number[];
    // Request used in docs examples (path + query).
    example: string;
    // JSON body for docs examples of POST operations.
    exampleBody?: string;
    handler: ApiHandler;
}

export const OPERATIONS: Operation[] = [
    {
        operationId: "list_actuators",
        method: "GET",
        path: "/api/v1/actuators",
        summary: "Search and filter actuators",
        description:
            "List robot actuators with optional filters (text, category, brand, use case, torque, mass, price, backdrivability, onboard driver) and sorting. Cursor-paginated: follow `pagination.next_cursor` until `has_more` is false.",
        query: ActuatorListParams,
        response: ActuatorListSchema,
        errors: [400],
        example:
            "/api/v1/actuators?category=qdd_proprioceptive&min_peak_torque_nm=20&sort=torque_density_nm_per_kg&limit=5",
        handler: listActuators,
    },
    {
        operationId: "compare_actuators",
        method: "GET",
        path: "/api/v1/actuators/compare",
        summary: "Fetch several actuators by id",
        description:
            "Batch lookup of up to 20 actuators by id for side-by-side comparison. Results keep request order; unknown ids are listed in `not_found` instead of failing the whole request.",
        query: CompareQueryParams,
        response: CompareResultSchema,
        errors: [400],
        example: "/api/v1/actuators/compare?ids=robstride-02,cubemars-ak80-9",
        handler: compareActuatorsGet,
    },
    {
        operationId: "compare_actuators_batch",
        method: "POST",
        path: "/api/v1/actuators/compare",
        summary: "Fetch several actuators by id (JSON body)",
        description:
            'Same as `compare_actuators` but takes `{"ids": [...]}` (1 to 20 ids) as a JSON body. Read-only and safe to retry: an `Idempotency-Key` header is accepted but not required.',
        body: CompareBodySchema,
        response: CompareResultSchema,
        errors: [400, 415, 422],
        example: "/api/v1/actuators/compare",
        exampleBody: '{"ids": ["robstride-02", "cubemars-ak80-9", "not-a-real-id"]}',
        handler: compareActuatorsPost,
    },
    {
        operationId: "get_actuator",
        method: "GET",
        path: "/api/v1/actuators/:id",
        summary: "Get one actuator",
        description:
            "Full specifications for one actuator, plus `robots_using`: the robots in the catalog whose joints use it.",
        pathParam: {
            name: "id",
            description: "Actuator id (slug).",
            example: "robstride-02",
        },
        response: ActuatorDetailSchema,
        errors: [404],
        example: "/api/v1/actuators/robstride-02",
        handler: getActuatorById,
    },
    {
        operationId: "list_robots",
        method: "GET",
        path: "/api/v1/robots",
        summary: "List robots",
        description:
            "Robots (arms, humanoids, quadrupeds) in the catalog with headline specs. Cursor-paginated like `list_actuators`.",
        query: RobotListParams,
        response: RobotListSchema,
        errors: [400],
        example: "/api/v1/robots?kind=quadruped&limit=10",
        handler: listRobots,
    },
    {
        operationId: "get_robot",
        method: "GET",
        path: "/api/v1/robots/:id",
        summary: "Get one robot with its joint motors",
        description:
            "One robot with every joint group resolved to its motor specs, linked to the matching catalog actuator when there is one.",
        pathParam: { name: "id", description: "Robot id (slug).", example: "i2rt-yam" },
        response: RobotDetailSchema,
        errors: [404],
        example: "/api/v1/robots/i2rt-yam",
        handler: getRobotById,
    },
    {
        operationId: "list_categories",
        method: "GET",
        path: "/api/v1/categories",
        summary: "List actuator categories",
        description:
            "Every category slug with a label, description and actuator count.",
        response: CategoryListSchema,
        errors: [],
        example: "/api/v1/categories",
        handler: listCategories,
    },
    {
        operationId: "list_brands",
        method: "GET",
        path: "/api/v1/brands",
        summary: "List actuator brands",
        description:
            "Every brand name (usable as the `brand` filter) with its actuator count.",
        response: NamedCountListSchema,
        errors: [],
        example: "/api/v1/brands",
        handler: listBrandsHandler,
    },
    {
        operationId: "list_use_cases",
        method: "GET",
        path: "/api/v1/use-cases",
        summary: "List use-case tags",
        description:
            "Every use-case tag (usable as the `use_case` filter) with its actuator count.",
        response: NamedCountListSchema,
        errors: [],
        example: "/api/v1/use-cases",
        handler: listUseCasesHandler,
    },
    {
        operationId: "list_companies",
        method: "GET",
        path: "/api/v1/companies",
        summary: "List supply-chain companies",
        description:
            "Companies along the actuator supply chain (rare earths, magnets and motors, gears and bearings, robot and actuator makers). Filter by country, stage or segment. Every number carries sources, as-of date and confidence. Cursor-paginated.",
        query: CompanyListParams,
        response: CompanyListSchema,
        errors: [400],
        example: "/api/v1/companies?country=JP&stage=gearing",
        handler: listCompaniesHandler,
    },
    {
        operationId: "get_company",
        method: "GET",
        path: "/api/v1/companies/:id",
        summary: "Get one supply-chain company",
        description:
            "One company with its sites, the companies it supplies and the companies that supply it, each with citations.",
        pathParam: { name: "id", description: "Company id (slug).", example: "jl-mag" },
        response: CompanyDetailSchema,
        errors: [404],
        example: "/api/v1/companies/jl-mag",
        handler: getCompanyHandler,
    },
    {
        operationId: "list_sites",
        method: "GET",
        path: "/api/v1/sites",
        summary: "List supply-chain sites",
        description:
            "Headquarters, plants, mines and refineries with coordinates and their precision. Filter by country, stage, company or kind. Cursor-paginated.",
        query: SiteListParams,
        response: SiteListSchema,
        errors: [400],
        example: "/api/v1/sites?company=jl-mag",
        handler: listSitesHandler,
    },
    {
        operationId: "list_metals",
        method: "GET",
        path: "/api/v1/metals",
        summary: "List magnet metals",
        description:
            "The six metals in an actuator's permanent magnet (Nd, Pr, Dy, Tb for NdFeB; Sm, Co for SmCo) with their role and the leading country at each stage: mining, separation, metal and alloy, magnets.",
        response: MetalListSchema,
        errors: [],
        example: "/api/v1/metals",
        handler: listMetalsHandler,
    },
    {
        operationId: "get_metal",
        method: "GET",
        path: "/api/v1/metals/:element",
        summary: "Who supplies one magnet metal",
        description:
            "Country shares of each stage (or one with `stage`), USGS mine production, reserves and years of supply by country, and the latest cited price of every series for the element. Stages no public source splits by country are marked `gap`.",
        pathParam: {
            name: "element",
            description: "Element id: nd, pr, dy, tb, sm or co.",
            example: "dy",
        },
        query: MetalSupplyParams,
        response: MetalSupplySchema,
        errors: [400, 404],
        example: "/api/v1/metals/dy?stage=separation",
        handler: getMetalHandler,
    },
    {
        operationId: "get_metal_prices",
        method: "GET",
        path: "/api/v1/metal-prices/:series",
        summary: "Price history of a magnet metal",
        description:
            "Cited price points for one series in US$/kg (USGS annual averages and year-end ranges, a few cited SMM readings in 2026) with the events that touched the element. `from` and `to` take YYYY-MM.",
        pathParam: {
            name: "series",
            description:
                "Series id, e.g. ndpr-oxide, dy-oxide, tb-metal-cn, tb-metal-fob, co-metal.",
            example: "dy-oxide",
        },
        query: MetalPriceParams,
        response: MetalPricesSchema,
        errors: [400, 404],
        example: "/api/v1/metal-prices/dy-oxide?from=2020-01",
        handler: getMetalPricesHandler,
    },
    {
        operationId: "list_policy_measures",
        method: "GET",
        path: "/api/v1/policy",
        summary: "List policy measures on the actuator chain",
        description:
            "Export controls, tariffs, subsidies and standards that touch the actuator supply chain (mining to robot) in China, the US, the EU, Japan, Korea, Australia and international standards bodies, oldest first. Each measure has its status history with a primary source per change. Filter by jurisdiction, type, stage or status.",
        query: PolicyListParams,
        response: PolicyListSchema,
        errors: [400],
        example: "/api/v1/policy?jurisdiction=CN&type=export-control",
        handler: listPolicyHandler,
    },
    {
        operationId: "get_policy_measure",
        method: "GET",
        path: "/api/v1/policy/:id",
        summary: "Get one policy measure",
        description:
            "One measure with its issuer, dates, status history, affected stages, HS codes, companies, award size and sources.",
        pathParam: {
            name: "id",
            description: "Measure id, e.g. cn-mofcom-2025-18.",
            example: "cn-mofcom-2025-18",
        },
        response: PolicyMeasureSchema,
        errors: [404],
        example: "/api/v1/policy/cn-mofcom-2025-18",
        handler: getPolicyHandler,
    },
    {
        operationId: "list_processes",
        method: "GET",
        path: "/api/v1/processes",
        summary: "List manufacturing process chains",
        description:
            "The process graphs on /manufacturing (the NdFeB magnet chain, ore to rotor segment; the precision chain of strain-wave gears, roller screws, precision bearings and encoders, bar stock to tested part) with their step counts.",
        response: ProcessChainListSchema,
        errors: [],
        example: "/api/v1/processes",
        handler: listProcessesHandler,
    },
    {
        operationId: "get_process",
        method: "GET",
        path: "/api/v1/processes/:chain",
        summary: "Get a manufacturing process chain",
        description:
            "Every step of one chain in order, grouped by stage or sub-chain: inputs and outputs, cited key numbers (temperature, particle size, tolerance, surface finish, yield, energy), the companies that run it, the stage's country shares and concentration tier, upstream and downstream steps, /bom node and /metals element links, and sources. Pass `step` for one step and its edges.",
        pathParam: {
            name: "chain",
            description: "Chain id: magnet or precision.",
            example: "magnet",
        },
        query: ProcessParams,
        response: ProcessChainSchema,
        errors: [400, 404],
        example: "/api/v1/processes/magnet?step=jet-milling",
        handler: getProcessHandler,
    },
    {
        operationId: "list_bom_cases",
        method: "GET",
        path: "/api/v1/bom",
        summary: "List actuator BOM teardowns",
        description:
            "The three teardowns on /bom (Optimus roller-screw linear actuator, Unitree GO-M8010-6 joint motor, strain-wave cobot joint) with price, raw-material content, idiot index and each tier's gross profit as a share of the price.",
        response: BomListSchema,
        errors: [],
        example: "/api/v1/bom",
        handler: listBomHandler,
    },
    {
        operationId: "get_bom",
        method: "GET",
        path: "/api/v1/bom/:slug",
        summary: "Get an actuator bill of materials",
        description:
            "One /bom teardown as a tree, parents before children: unit cost (cited or null), raw-material content, idiot index, step multiplier, makers with gross margin and attribution confidence, alternates, /manufacturing step ids and sources; plus raw materials per actuator and margin capture.",
        pathParam: {
            name: "slug",
            description:
                "Case slug: optimus-linear, unitree-qdd or harmonic-frameless.",
            example: "unitree-qdd",
        },
        response: BomCaseSchema,
        errors: [404],
        example: "/api/v1/bom/unitree-qdd",
        handler: getBomHandler,
    },
    {
        operationId: "list_alt_technologies",
        method: "GET",
        path: "/api/v1/alts",
        summary: "List alternative actuator technologies",
        description:
            "Every technology on /alts (rare-earth-free motors, artificial muscles, hydraulic drives, transmissions) with principle, magnet use, TRL, milestones, companies, cited performance figures, market sizes and deployments. Filter with `family`.",
        query: AltListParams,
        response: AltTechListSchema,
        errors: [400],
        example: "/api/v1/alts?family=artificial-muscle",
        handler: listAltsHandler,
    },
    {
        operationId: "get_alt_technology",
        method: "GET",
        path: "/api/v1/alts/:id",
        summary: "Get an alternative actuator technology",
        description:
            "One /alts technology: principle, magnet use, TRL with its evidence, dated milestones (announced targets flagged), companies, performance figures, market size and growth, deployments and sources.",
        pathParam: {
            name: "id",
            description: "Technology id, e.g. switched-reluctance.",
            example: "switched-reluctance",
        },
        response: AltTechSchema,
        errors: [404],
        example: "/api/v1/alts/switched-reluctance",
        handler: getAltHandler,
    },
    {
        operationId: "list_trends",
        method: "GET",
        path: "/api/v1/trends",
        summary: "List the /trends charts",
        description:
            "Every /trends chart as dated, cited points: actuator list prices and $/N·m, rated life, humanoid and industrial robot market shares, the rotary/linear split, roller screw cost, the price of AI against earlier technologies (Epoch AI, Karthik Tadepalli) and humanoid battery runtime. Each point has a confidence and its sources with reuse terms. Filter with `section` or `chart`.",
        query: TrendParams,
        response: TrendListSchema,
        errors: [400, 404],
        example: "/api/v1/trends?section=ai",
        handler: listTrendsHandler,
    },
    {
        operationId: "get_price_history",
        method: "GET",
        path: "/api/v1/prices/:id",
        summary: "Price history for one actuator",
        description:
            "Every dated list price on file for one catalog actuator, oldest first: weekly product page snapshots, Wayback Machine snapshots, curated points and the current catalog price. Each point has its US$ price, the listed currency and price, the FX rate used, the page URL, the method (jsonld, shopify, woocommerce, selector, wayback, manual), an out-of-stock flag, $/N·m and sources. Also the latest price and the change over one year. 404 for an unknown actuator; count 0 when it has no price yet.",
        pathParam: {
            name: "id",
            description: "Catalog actuator id.",
            example: "dynamixel-xm430-w350-t",
        },
        response: PriceHistorySchema,
        errors: [404],
        example: "/api/v1/prices/dynamixel-xm430-w350-t",
        handler: priceHistoryHandler,
    },
    {
        operationId: "get_patent_landscape",
        method: "GET",
        path: "/api/v1/patents/:technology",
        summary: "Patent landscape for one actuator technology",
        description: `Patent families since ${FIRST_YEAR} for one technology on /patents (or all of them): its reviewed CPC codes with rationale and keyword filters, families per priority year (the last ${LAG_MONTHS} months flagged incomplete for publication lag), families per applicant country per year, the top ${TOP_ASSIGNEES} first assignees with their family count, share and ${CAGR_YEARS}-year CAGR, the share held by the top five, and the largest families with Google Patents links. Families are deduplicated by DOCDB family; data from Google Patents Public Datasets on BigQuery (CC BY 4.0).`,
        pathParam: {
            name: "technology",
            description: `Technology id: ${PATENT_SCOPES.join(", ")}.`,
            example: "strain-wave",
        },
        query: PatentParams,
        response: PatentLandscapeSchema,
        errors: [400, 404],
        example: "/api/v1/patents/strain-wave",
        handler: patentLandscapeHandler,
    },
    {
        operationId: "list_humanoids",
        method: "GET",
        path: "/api/v1/humanoids",
        summary: "List humanoids with actuator totals",
        description:
            "Every humanoid on /humanoids with its actuator count by type (QDD, planetary, harmonic, cycloidal, roller screw, ball screw, hydraulic, tendon, undisclosed) and estimated NdFeB magnet and rare-earth (Nd, Pr, Dy, Tb) mass, each with a range and confidence.",
        response: HumanoidListSchema,
        errors: [],
        example: "/api/v1/humanoids",
        handler: listHumanoids,
    },
    {
        operationId: "get_humanoid",
        method: "GET",
        path: "/api/v1/humanoids/:id",
        summary: "Get one humanoid joint by joint",
        description:
            "One humanoid mapped onto the canonical joint set: per joint the actuator type and whether it is reported or estimated (with what it was inferred from), motor, reducer, peak torque or force, gear ratio and motor-side torque, estimated magnet mass and sources.",
        pathParam: {
            name: "id",
            description: "Humanoid id (slug).",
            example: "unitree-g1",
        },
        response: HumanoidDetailSchema,
        errors: [404],
        example: "/api/v1/humanoids/unitree-g1",
        handler: getHumanoidById,
    },
    {
        operationId: "list_open_robots",
        method: "GET",
        path: "/api/v1/open-robots",
        summary: "List open-source robots",
        description:
            "Every robot on /open-source (mobile manipulators, arms, humanoids, legged): licences, an openness score over eight dimensions (CAD, electronics, firmware, software, BOM, assembly guide, sim model, licence) with a link per published artefact, BOM or kit cost, GitHub stars and last commit, family-tree parent, and the actuator in each joint group with its catalog id when listed.",
        query: OpenRobotListParams,
        response: OpenRobotListSchema,
        errors: [400],
        example: "/api/v1/open-robots?type=humanoid",
        handler: listOpenRobotsHandler,
    },
    {
        operationId: "get_open_robot",
        method: "GET",
        path: "/api/v1/open-robots/:id",
        summary: "Get one open-source robot",
        description:
            "One open robot with its openness matrix row (status, link, licence per dimension), joints mapped to catalog actuators, cost, repository stats and sources.",
        pathParam: {
            name: "id",
            description: "Open robot id (slug).",
            example: "yor",
        },
        response: OpenRobotSchema,
        errors: [404],
        example: "/api/v1/open-robots/yor",
        handler: getOpenRobotHandler,
    },
    {
        operationId: "list_benchmarks",
        method: "GET",
        path: "/api/v1/benchmarks",
        summary: "List measured actuator runs",
        description:
            "Measured performance from /benchmarks: torque-speed curves, thermal derating, backlash, friction and control figures from published tests (papers, vendor test reports, blogs) and community runs submitted by pull request. Each run carries its rig, data method (raw, tabulated, digitised or reported), uncertainty per metric, source and the gap to the datasheet. Filter by actuator_id or origin.",
        query: BenchmarkListParams,
        response: BenchmarkListSchema,
        errors: [400],
        example: "/api/v1/benchmarks?actuator_id=robstride-02",
        handler: listBenchmarksHandler,
    },
    {
        operationId: "get_actuator_benchmarks",
        method: "GET",
        path: "/api/v1/actuators/:id/benchmarks",
        summary: "Measured runs for one actuator",
        description:
            "Every measured run on file for one catalog actuator, newest first, with measured against datasheet ratios. 404 when the actuator is unknown or has no runs yet.",
        pathParam: {
            name: "id",
            description: "Catalog actuator id.",
            example: "xiaomi-cybergear",
        },
        response: BenchmarkListSchema,
        errors: [404],
        example: "/api/v1/actuators/xiaomi-cybergear/benchmarks",
        handler: actuatorBenchmarksHandler,
    },
    {
        operationId: "list_countries",
        method: "GET",
        path: "/api/v1/countries",
        summary: "List live country pages",
        description:
            "Country pages of the supply-chain atlas (/japan, ...) that pass the coverage gate, with how many companies, sites and supply links each holds.",
        response: CountryListSchema,
        errors: [],
        example: "/api/v1/countries",
        handler: listCountriesHandler,
    },
    {
        operationId: "get_country",
        method: "GET",
        path: "/api/v1/countries/:code",
        summary: "One country's actuator supply chain",
        description:
            "Everything on a country page: the country's share of each stage (with the world leader), named industrial clusters with their sites, its policy measures, every company headquartered there or with a site there, the sites in the country and the current supply links touching those companies, all with citations.",
        pathParam: {
            name: "code",
            description: "ISO 3166 alpha-2 code or page slug, e.g. JP or japan.",
            example: "JP",
        },
        response: CountrySchema,
        errors: [404],
        example: "/api/v1/countries/JP",
        handler: getCountryHandler,
    },
    {
        operationId: "list_sdk_scores",
        method: "GET",
        path: "/api/v1/sdk",
        summary: "List actuator SDK scores by brand",
        description:
            "Every actuator brand with software to score, ranked by SDK quality: seven dimension scores (protocol openness, bindings, ROS 2 and sim, docs, firmware and tooling, support, comms reliability), capability matrix, cited objective checks, top pain points and the newest community evidence. Choose a reader preset to re-weight the overall score.",
        query: SdkListParams,
        response: SdkListSchema,
        errors: [400],
        example: "/api/v1/sdk?preset=ros2",
        handler: listSdkHandler,
    },
    {
        operationId: "get_sdk_score",
        method: "GET",
        path: "/api/v1/sdk/:brand",
        summary: "Get one brand's SDK score",
        description:
            "One brand's SDK score with every check and every evidence item (claim summary, link, forum, date). Accepts an SDK brand id or a catalog actuator id.",
        pathParam: {
            name: "brand",
            description:
                "SDK brand id (e.g. odrive) or catalog actuator id (e.g. odrive-s1).",
            example: "odrive",
        },
        query: SdkListParams,
        response: SdkBrandSchema,
        errors: [400, 404],
        example: "/api/v1/sdk/odrive",
        handler: getSdkHandler,
    },
    {
        operationId: "list_people",
        method: "GET",
        path: "/api/v1/people",
        summary: "List leading people in actuators and rare earths",
        description:
            "The /people directory: actuator researchers, actuator and robot founders, magnet and rare earth executives, and analysts and policy leads. Each person carries role, affiliations (with supply-chain company ids), why they matter, key works, the inclusion criterion met and sources. Filter by domain.",
        query: PeopleListParams,
        response: PeopleListSchema,
        errors: [400],
        example: "/api/v1/people?domain=magnets",
        handler: listPeopleHandler,
    },
    {
        operationId: "get_person",
        method: "GET",
        path: "/api/v1/people/:id",
        summary: "Get one person from the people directory",
        description:
            "One person from /people with affiliations, key works, site links (country page, humanoid joint map, catalog) and sources.",
        pathParam: {
            name: "id",
            description: "Person id (slug).",
            example: "masato-sagawa",
        },
        response: PersonSchema,
        errors: [404],
        example: "/api/v1/people/masato-sagawa",
        handler: getPersonHandler,
    },
];
