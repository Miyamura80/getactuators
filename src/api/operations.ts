import type { z } from "zod";
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
import { ActuatorListParams, CompareQueryParams, RobotListParams } from "./params";
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
];
