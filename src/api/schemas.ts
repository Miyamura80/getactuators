import { z } from "zod";

// Response contracts for /api/v1. These zod schemas are the single source of
// truth: the OpenAPI components are generated from them (see openapi.ts) and the
// tests parse live responses with them, so the spec cannot drift from the API.

export const schemaRegistry = z.registry<{ id: string }>();

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

const num = (description: string) => z.number().nullable().describe(description);
const str = (description: string) => z.string().nullable().describe(description);

export const CATEGORY_SLUGS = [
    "qdd_proprioceptive",
    "integrated_joint",
    "smart_servo",
    "harmonic_precision",
    "frameless_driver",
    "cycloidal_premium",
] as const;

export const ActuatorSchema = named(
    "Actuator",
    z
        .object({
            id: z.string().describe("Stable slug, e.g. `robstride-02`."),
            name: z.string(),
            brand: z.string(),
            category: z.enum(CATEGORY_SLUGS),
            use_cases: z.array(z.string()),
            image_url: str("Product image URL."),
            product_url: str("Manufacturer product page."),
            datasheet_url: str("Datasheet URL."),
            price_usd: num("List price in USD, when public."),
            availability: str("in_production, discontinued, eol or unknown."),
            peak_torque_nm: num("Peak torque in N·m."),
            rated_torque_nm: num("Rated (continuous) torque in N·m."),
            max_speed_rpm: num("Max output speed in rpm."),
            gear_ratio: str("Gear ratio, e.g. `9:1`."),
            weight_g: num("Mass in grams."),
            torque_density_nm_per_kg: num("Peak torque divided by mass."),
            backdrivable: z.boolean().nullable(),
            backlash_arcmin: num("Backlash in arc-minutes."),
            repeatability_arcmin: num("Repeatability in arc-minutes."),
            voltage_v: z
                .union([z.string(), z.number()])
                .nullable()
                .describe("Supply voltage (number) or range (string)."),
            peak_current_a: num("Peak current in A."),
            power_w: num("Power in W."),
            kt_nm_per_a: num("Torque constant in N·m/A."),
            comm: z.array(z.string()).nullable().describe("Bus protocols."),
            control_modes: z.array(z.string()).nullable(),
            encoder: str("Encoder description."),
            integrated_driver: z.boolean().nullable(),
            ip_rating: str("Ingress protection rating."),
            notes: str("Free-text notes."),
            sources: z.array(z.string()).describe("Source URLs for the specs."),
            price_per_nm: num("price_usd divided by peak_torque_nm."),
            data_source: z.string(),
            verified: z.boolean().describe("Specs spot-checked against a source."),
            country: str("Manufacturer country."),
            country_flag: str("Flag emoji for country."),
            source_url: str("Primary source URL."),
            source_domain: str("Domain of source_url."),
            url: z.string().describe("Human-readable page on actuatorlist.com."),
            api_url: z.string().describe("Canonical API URL of this resource."),
        })
        .describe("A robot actuator with its published specifications."),
);

export const RobotRefSchema = named(
    "RobotRef",
    z.object({
        id: z.string(),
        name: z.string(),
        brand: z.string(),
        url: z.string(),
        api_url: z.string(),
    }),
);

export const ActuatorDetailSchema = named(
    "ActuatorDetail",
    ActuatorSchema.extend({
        robots_using: z
            .array(RobotRefSchema)
            .describe("Robots in the catalog whose joints use this actuator."),
    }),
);

export const JointSchema = named(
    "Joint",
    z.object({
        role: z.string().describe("Joint group, e.g. `Shoulder (J1-J3)`."),
        count: z.number().describe("Number of joints in this group."),
        motor: z.object({
            id: z.string(),
            name: z.string(),
            brand: z.string(),
            rated_torque_nm: num("Rated torque in N·m."),
            peak_torque_nm: num("Peak torque in N·m."),
            rated_speed_rpm: num("Rated speed in rpm."),
            gear_ratio: str("Gear ratio."),
            weight_g: num("Mass in grams."),
            torque_density_nm_per_kg: num("Torque density."),
            product_url: str("Product page."),
            actuator_id: str("Catalog actuator id, when the motor is listed."),
            actuator_api_url: str("API URL of the linked actuator, if any."),
        }),
    }),
);

const robotFields = {
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    kind: z.enum(["robot_arm", "humanoid"]).describe("Robot type."),
    country: str("Manufacturer country."),
    country_flag: str("Flag emoji."),
    dof: z.number().describe("Degrees of freedom."),
    payload_kg: num("Payload in kg."),
    reach_mm: num("Reach in mm."),
    height_m: num("Standing height in m (humanoids)."),
    weight_kg: num("Mass in kg."),
    price_usd: num("Price (or lower bound) in USD."),
    price_max_usd: num("Upper price bound in USD, if a range."),
    product_url: str("Product page."),
    image_url: str("Image URL."),
    summary: z.string(),
    sources: z.array(z.string()),
    url: z.string(),
    api_url: z.string(),
};

export const RobotSchema = named(
    "Robot",
    z.object({ ...robotFields, joint_count: z.number() }).describe("A robot."),
);

export const RobotDetailSchema = named(
    "RobotDetail",
    z.object({ ...robotFields, joints: z.array(JointSchema) }),
);

export const PaginationSchema = named(
    "Pagination",
    z.object({
        next_cursor: z
            .string()
            .nullable()
            .describe("Opaque cursor for the next page; null on the last page."),
        has_more: z.boolean(),
        total: z.number().describe("Total matching items across all pages."),
    }),
);

export const ActuatorListSchema = named(
    "ActuatorList",
    z.object({ data: z.array(ActuatorSchema), pagination: PaginationSchema }),
);

export const RobotListSchema = named(
    "RobotList",
    z.object({ data: z.array(RobotSchema), pagination: PaginationSchema }),
);

export const CompareResultSchema = named(
    "CompareResult",
    z.object({
        data: z.array(
            z.object({
                id: z.string(),
                found: z.boolean(),
                actuator: ActuatorSchema.nullable(),
            }),
        ),
        not_found: z.array(z.string()).describe("Requested ids with no match."),
    }),
);

export const CategoryListSchema = named(
    "CategoryList",
    z.object({
        data: z.array(
            z.object({
                slug: z.enum(CATEGORY_SLUGS),
                label: z.string(),
                description: z.string(),
                actuator_count: z.number(),
            }),
        ),
    }),
);

export const NamedCountListSchema = named(
    "NamedCountList",
    z.object({
        data: z.array(z.object({ name: z.string(), actuator_count: z.number() })),
    }),
);

export const ApiIndexSchema = named(
    "ApiIndex",
    z.object({
        name: z.string(),
        version: z.string(),
        description: z.string(),
        auth: z.string(),
        docs: z.string(),
        openapi: z.string(),
        mcp: z.string(),
        endpoints: z.array(
            z.object({ method: z.string(), path: z.string(), summary: z.string() }),
        ),
    }),
);

export const OpenApiDocSchema = named(
    "OpenApiDocument",
    z.record(z.string(), z.unknown()).describe("An OpenAPI 3.1 document."),
);

export const ProblemSchema = named(
    "Problem",
    z
        .object({
            type: z.string().describe("URI identifying the problem type."),
            title: z.string(),
            status: z.number(),
            detail: z.string(),
            code: z.string().describe("Stable machine-readable error code."),
            hint: z.string().optional().describe("How to fix the request."),
            instance: z.string().optional().describe("Request path."),
            docs: z.string().describe("Documentation link."),
            errors: z
                .array(z.object({ field: z.string(), message: z.string() }))
                .optional()
                .describe("Per-field validation errors."),
        })
        .describe("RFC 9457 problem details (application/problem+json)."),
);

export const CompareBodySchema = named(
    "CompareRequest",
    z.object({
        ids: z
            .array(z.string().min(1))
            .min(1)
            .max(20)
            .describe("Actuator ids to fetch (1 to 20)."),
    }),
);

export type ApiActuator = z.infer<typeof ActuatorSchema>;
export type ApiRobot = z.infer<typeof RobotSchema>;
export type ApiRobotDetail = z.infer<typeof RobotDetailSchema>;
export type ApiRobotRef = z.infer<typeof RobotRefSchema>;
export type ApiJoint = z.infer<typeof JointSchema>;
export type ApiProblem = z.infer<typeof ProblemSchema>;
