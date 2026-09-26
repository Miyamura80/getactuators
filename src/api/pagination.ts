import { ApiError } from "./problem";

// Opaque cursor pagination. The cursor carries the offset plus a fingerprint of
// the filters it was issued for, so reusing it with different filters fails
// loudly instead of silently skipping rows. The catalog order is deterministic
// (see queryActuators), which keeps offsets stable between requests.

interface CursorState {
    o: number;
    f: string;
}

export function fingerprint(filters: Record<string, unknown>): string {
    const stable = Object.keys(filters)
        .sort()
        .map((k) => [k, filters[k]]);
    return Bun.hash(JSON.stringify(stable)).toString(36);
}

function encode(state: CursorState): string {
    return Buffer.from(JSON.stringify(state)).toString("base64url");
}

function decode(cursor: string): CursorState | null {
    try {
        const v = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (Number.isInteger(v?.o) && v.o >= 0 && typeof v.f === "string") return v;
    } catch {
        // Fall through: malformed base64 or JSON is reported as invalid below.
    }
    return null;
}

export interface Page<T> {
    data: T[];
    pagination: { next_cursor: string | null; has_more: boolean; total: number };
}

export function paginate<T>(
    items: readonly T[],
    limit: number,
    cursor: string | undefined,
    filters: Record<string, unknown>,
): Page<T> {
    const f = fingerprint(filters);
    let offset = 0;
    if (cursor !== undefined) {
        const state = decode(cursor);
        if (!state || state.f !== f) {
            throw new ApiError("invalid_cursor", {
                detail: state
                    ? "This cursor was issued for different filters or sort."
                    : "The cursor could not be decoded.",
                hint: "Repeat the original query parameters with the returned next_cursor, or drop `cursor` to start over.",
            });
        }
        offset = state.o;
    }
    const data = items.slice(offset, offset + limit);
    const next = offset + limit;
    const hasMore = next < items.length;
    return {
        data,
        pagination: {
            next_cursor: hasMore ? encode({ o: next, f }) : null,
            has_more: hasMore,
            total: items.length,
        },
    };
}
