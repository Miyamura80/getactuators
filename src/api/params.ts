import { SORTABLE_FIELDS } from "@/catalog/query";
import { z } from "zod";
import { ApiError } from "./problem";
import { CATEGORY_SLUGS, CompareBodySchema } from "./schemas";

// Query-parameter contracts. Each z.object below is used both to validate
// requests and (via openapi.ts) to emit the OpenAPI `parameters` list.

const bool = (description: string) =>
    z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .optional()
        .describe(description);

const nonNegative = (description: string) =>
    z.coerce.number().min(0).optional().describe(description);

const pageParams = {
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(25)
        .describe("Page size, 1 to 100 (default 25)."),
    cursor: z
        .string()
        .min(1)
        .optional()
        .describe("Opaque `pagination.next_cursor` from the previous page."),
};

export const ActuatorListParams = z.object({
    q: z
        .string()
        .optional()
        .describe("Free-text search over id, name, brand, category, use cases, notes."),
    category: z.enum(CATEGORY_SLUGS).optional().describe("Category slug."),
    brand: z.string().optional().describe("Exact brand name (case-insensitive)."),
    use_case: z.string().optional().describe("Use-case tag, e.g. `humanoid`."),
    min_peak_torque_nm: nonNegative("Minimum peak torque in N·m."),
    max_weight_g: nonNegative("Maximum mass in grams."),
    max_price_usd: nonNegative("Maximum list price in USD."),
    backdrivable: bool("Only backdrivable (`true`) or non-backdrivable (`false`)."),
    integrated_driver: bool(
        "Only actuators with (`true`) or without an onboard driver.",
    ),
    sort: z.enum(SORTABLE_FIELDS).optional().describe("Sort field (default: id)."),
    order: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default desc when `sort` is set)."),
    ...pageParams,
});

export const RobotListParams = z.object({
    q: z.string().optional().describe("Free-text search over name, brand, summary."),
    brand: z.string().optional().describe("Exact brand name (case-insensitive)."),
    ...pageParams,
});

export const CompareQueryParams = z.object({
    ids: z
        .string()
        .min(1)
        .describe("Comma-separated actuator ids, 1 to 20, e.g. `a,b,c`."),
});

function toFieldErrors(error: z.ZodError): { field: string; message: string }[] {
    return error.issues.map((i) => ({
        field: i.path.join(".") || "(root)",
        message: i.message,
    }));
}

export function parseQuery<T extends z.ZodType>(schema: T, url: URL): z.output<T> {
    const raw: Record<string, string> = {};
    for (const [k, v] of url.searchParams) if (!(k in raw)) raw[k] = v;
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    const errors = toFieldErrors(parsed.error);
    throw new ApiError("invalid_parameter", {
        detail: errors.map((e) => `${e.field}: ${e.message}`).join("; "),
        hint: "Check parameter names and types against /openapi.json.",
        errors,
    });
}

export const MAX_COMPARE_IDS = 20;

export function parseCompareIds(input: unknown): string[] {
    const parsed = CompareBodySchema.safeParse(input);
    if (!parsed.success) {
        const errors = toFieldErrors(parsed.error);
        throw new ApiError("validation_failed", {
            detail: errors.map((e) => `${e.field}: ${e.message}`).join("; "),
            hint: `Send {"ids": ["id-1", "id-2"]} with 1 to ${MAX_COMPARE_IDS} ids.`,
            errors,
        });
    }
    return [...new Set(parsed.data.ids)];
}
