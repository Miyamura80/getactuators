import type { z } from "zod";
import {
    ActuatorBenchmarksSchema,
    BenchmarkListParams,
    BenchmarkListSchema,
    getActuatorBenchmarksHandler,
    listBenchmarksHandler,
} from "./benchmarks";
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
    listOpenRobotsHandler,
} from "./open-robots";
import { ActuatorListParams, CompareQueryParams, RobotListParams } from "./params";
import {
    PatentLandscapeParams,
    PatentLandscapeSchema,
    PatentTechnologyListSchema,
    getPatentLandscapeHandler,
    listPatentTechnologiesHandler,
} from "./patents";
import { PriceHistorySchema, getPriceHistoryHandler } from "./prices";
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
    getSdkBrandHandler,
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
        operationId: "get_price_history",
        method: "GET",
        path: "/api/v1/prices/:actuatorId",
        summary: "Price history of one actuator",
        description:
            "Every recorded listed price of one actuator, oldest first, in USD with the original currency, FX rate, method (jsonld, shopify, woocommerce, selector, wayback or manual) and source URL per point, plus the latest price, $/Nm and one-year change. Out-of-stock reads carry `in_stock: false` and no price.",
        pathParam: {
            name: "actuatorId",
            description: "Actuator id (slug).",
            example: "robstride-02",
        },
        response: PriceHistorySchema,
        errors: [404],
        example: "/api/v1/prices/robstride-02",
        handler: getPriceHistoryHandler,
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
        example: "/api/v1/robots?limit=10",
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
            "Cited price points for one series in US$/kg (USGS annual averages and year-end ranges, monthly SMM readings in 2026) with the events that touched the element. `from` and `to` take YYYY-MM.",
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
        operationId: "list_sdk_scores",
        method: "GET",
        path: "/api/v1/sdk",
        summary: "Actuator SDK leaderboard",
        description:
            "Brands ranked by SDK quality: overall score for a weighting preset, seven dimension scores 0-10, a capability matrix (Python, C++, Rust, ROS 2, ros2_control, URDF, MJCF, open firmware, documented protocol), evidence counts and the collectors behind the snapshot.",
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
        summary: "One brand's SDK scorecard",
        description:
            "Every check behind a brand's SDK score, with the GitHub files, maker docs and forum posts it rests on. Takes a brand id or a catalog actuator id.",
        pathParam: {
            name: "brand",
            description: "Brand id (e.g. robotis, mjbots, odrive) or an actuator id.",
            example: "mjbots",
        },
        response: SdkBrandSchema,
        errors: [404],
        example: "/api/v1/sdk/mjbots",
        handler: getSdkBrandHandler,
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
        operationId: "list_patent_technologies",
        method: "GET",
        path: "/api/v1/patents",
        summary: "List patent landscape technologies",
        description:
            "The actuator and magnet technologies /patents tracks, each with its CPC code set, keyword filters and rationale, and the number of patent families since 2010 once a snapshot is collected (`status`).",
        response: PatentTechnologyListSchema,
        errors: [],
        example: "/api/v1/patents",
        handler: listPatentTechnologiesHandler,
    },
    {
        operationId: "get_patent_landscape",
        method: "GET",
        path: "/api/v1/patents/:technology",
        summary: "Patent landscape of one technology",
        description:
            "Patent families since 2010 for one technology, deduplicated by family: counts per priority year and applicant country, the top 15 assignees with share and 3-year CAGR (linked to the company registry where possible), top-5 share and the most recent families with Google Patents links. Priority years from `first_incomplete_year` on are still filling in. Empty with `status: not_collected` until the first snapshot.",
        pathParam: {
            name: "technology",
            description: "Technology id, e.g. strain-wave, ndfeb, robot-joints.",
            example: "strain-wave",
        },
        query: PatentLandscapeParams,
        response: PatentLandscapeSchema,
        errors: [400, 404],
        example: "/api/v1/patents/strain-wave?families=10",
        handler: getPatentLandscapeHandler,
    },
    {
        operationId: "list_open_robots",
        method: "GET",
        path: "/api/v1/open-robots",
        summary: "List open-source robots and the actuators they use",
        description:
            "Every robot on /open-source: type, DOF, cost to build, licences, an openness score over eight dimensions (CAD, electronics, firmware, software, BOM, assembly guide, sim model, licence) with a link per dimension, GitHub stars, what it derives from, and its joints mapped to catalog actuator ids. Also returns joint counts per actuator model.",
        query: OpenRobotListParams,
        response: OpenRobotListSchema,
        errors: [400],
        example: "/api/v1/open-robots?type=arm",
        handler: listOpenRobotsHandler,
    },
    {
        operationId: "list_benchmarks",
        method: "GET",
        path: "/api/v1/benchmarks",
        summary: "List measured benchmark runs",
        description:
            "Measured actuator runs from published tests (papers, vendor test reports, reviewer tests) and community dyno submissions: torque-speed points, thermal holds (time to thermal limit), backlash, stiffness, friction, ripple, bandwidth, latency and repeatability, each with origin, independence (vendor, vendor-affiliated or independent), rig, uncertainty and source.",
        query: BenchmarkListParams,
        response: BenchmarkListSchema,
        errors: [400],
        example: "/api/v1/benchmarks?actuator=feetech-sts3215",
        handler: listBenchmarksHandler,
    },
    {
        operationId: "get_actuator_benchmarks",
        method: "GET",
        path: "/api/v1/benchmarks/:id",
        summary: "Get one actuator's measured runs vs its datasheet",
        description:
            "Every measured run of one catalog actuator plus a datasheet-vs-measured comparison (ratio, independence and verdict per metric; only independent runs get a verdict) and its measured continuous torque density when a continuous hold was measured. Empty runs mean nothing has been measured yet.",
        pathParam: {
            name: "id",
            description: "Actuator id (slug).",
            example: "mjbots-qdd100",
        },
        response: ActuatorBenchmarksSchema,
        errors: [404],
        example: "/api/v1/benchmarks/mjbots-qdd100",
        handler: getActuatorBenchmarksHandler,
    },
];
