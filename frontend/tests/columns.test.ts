// Smoke tests for the COLUMN_MAP lookup that applyFilters sorts through: a
// numeric column's value() reads the right field and display() formats it, and
// missing values render the en-dash placeholder rather than throwing.
import { describe, expect, test } from "bun:test";
import { COLUMN_MAP } from "../src/lib/columns";
import { makeActuator } from "./fixtures";

describe("COLUMN_MAP numeric columns", () => {
    test("torque density value() returns the raw number and display() rounds to 1 dp", () => {
        const col = COLUMN_MAP.torque_density_nm_per_kg;
        const a = makeActuator({ torque_density_nm_per_kg: 12.34 });
        expect(col.value(a)).toBe(12.34);
        expect(col.display(a)).toBe("12.3");
        expect(col.numeric).toBe(true);
    });

    test("price column value() reads price_usd and display() renders a dollar amount", () => {
        const col = COLUMN_MAP.price_usd;
        const a = makeActuator({ price_usd: 1499 });
        expect(col.value(a)).toBe(1499);
        expect(col.display(a)).toBe("$1,499");
    });

    test("a missing numeric value() returns null and display() shows a placeholder", () => {
        const col = COLUMN_MAP.peak_torque_nm;
        const a = makeActuator({ peak_torque_nm: null });
        expect(col.value(a)).toBeNull();
        // num() returns the en-dash placeholder for null, never an em dash.
        expect(col.display(a)).toBe("–");
    });

    test("every column key round-trips through the map", () => {
        for (const [key, col] of Object.entries(COLUMN_MAP)) {
            expect(col.key).toBe(key);
        }
    });
});
