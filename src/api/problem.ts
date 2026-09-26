import { absoluteUrl } from "@/server/site";
import type { ApiProblem } from "./schemas";

// RFC 9457 problem details. Every non-2xx answer under /api uses this shape so
// agents can branch on `code` instead of parsing prose.

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

export const ERROR_CODES = {
    invalid_parameter: { status: 400, title: "Invalid query parameter" },
    invalid_cursor: { status: 400, title: "Invalid pagination cursor" },
    invalid_json: { status: 400, title: "Request body is not valid JSON" },
    not_found: { status: 404, title: "Resource not found" },
    unknown_endpoint: { status: 404, title: "Unknown API endpoint" },
    method_not_allowed: { status: 405, title: "Method not allowed" },
    unsupported_media_type: { status: 415, title: "Unsupported media type" },
    validation_failed: { status: 422, title: "Request body failed validation" },
    rate_limited: { status: 429, title: "Too many requests" },
    internal_error: { status: 500, title: "Internal server error" },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface ProblemInit {
    detail: string;
    hint?: string;
    errors?: { field: string; message: string }[];
}

// Thrown by handlers; the endpoint wrapper turns it into a problem response.
export class ApiError extends Error {
    readonly code: ErrorCode;
    readonly init: ProblemInit;
    readonly headers: Record<string, string>;

    constructor(
        code: ErrorCode,
        init: ProblemInit,
        headers: Record<string, string> = {},
    ) {
        super(init.detail);
        this.code = code;
        this.init = init;
        this.headers = headers;
    }
}

export function errorDocsUrl(code: ErrorCode): string {
    return absoluteUrl(`/docs/api#error-${code.replaceAll("_", "-")}`);
}

export function problemBody(
    code: ErrorCode,
    init: ProblemInit,
    path: string,
): ApiProblem {
    const { status, title } = ERROR_CODES[code];
    return {
        type: errorDocsUrl(code),
        title,
        status,
        detail: init.detail,
        code,
        ...(init.hint ? { hint: init.hint } : {}),
        instance: path,
        docs: absoluteUrl("/docs/api#errors"),
        ...(init.errors ? { errors: init.errors } : {}),
    };
}

export function problemResponse(error: ApiError, path: string): Response {
    const body = problemBody(error.code, error.init, path);
    return new Response(JSON.stringify(body), {
        status: body.status,
        headers: { "Content-Type": PROBLEM_CONTENT_TYPE, ...error.headers },
    });
}
