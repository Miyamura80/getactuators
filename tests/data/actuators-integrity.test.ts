import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import actuators from "../../frontend/src/data/actuators.json";
import robots from "../../frontend/src/data/robots.json";

// Valid category slugs mirror the CategorySlug union in frontend/src/types.ts.
// Keep this list in sync if a new category is introduced there.
const VALID_CATEGORIES = new Set([
    "qdd_proprioceptive",
    "integrated_joint",
    "smart_servo",
    "harmonic_precision",
    "frameless_driver",
    "cycloidal_premium",
]);

// Fields typed as `number | null` in frontend/src/types.ts. Each must be either
// null or a finite number (never a string, NaN or Infinity).
const NUMERIC_FIELDS = [
    "price_usd",
    "peak_torque_nm",
    "rated_torque_nm",
    "max_speed_rpm",
    "weight_g",
    "torque_density_nm_per_kg",
    "backlash_arcmin",
    "repeatability_arcmin",
    "peak_current_a",
    "power_w",
    "kt_nm_per_a",
    "price_per_nm",
];

// Relative tolerance for derived-value checks. The build script rounds derived
// fields (torque density to 1 dp, price per Nm to 2 dp), so tiny rounding drift
// is expected; a wrong formula (e.g. rated instead of peak torque) is off by
// tens of percent, well outside this band.
const DERIVED_TOLERANCE = 0.05;

interface ActuatorRow {
    id: string;
    name: string;
    brand: string;
    category: string;
    use_cases: unknown;
    image_url?: string | null;
    verified: boolean;
    sources: unknown;
    data_source: string;
    voltage_v: string | number | null;
    peak_torque_nm: number | null;
    weight_g: number | null;
    price_usd: number | null;
    torque_density_nm_per_kg: number | null;
    price_per_nm: number | null;
    [key: string]: unknown;
}

const rows = actuators as unknown as ActuatorRow[];
const PUBLIC_DIR = join(import.meta.dir, "..", "..", "frontend", "public");

function isNonEmptyString(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function isNumberOrNull(value: unknown): boolean {
    return value === null || (typeof value === "number" && Number.isFinite(value));
}

// Mirrors `string[] | null` in frontend/src/types.ts: null (not documented) or
// an array whose every element is a string. Anything else is a contract break.
function isStringArrayOrNull(value: unknown): boolean {
    if (value === null) return true;
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

describe("actuators dataset integrity", () => {
    test("dataset is a non-empty array", () => {
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length).toBeGreaterThan(0);
    });

    test("every id is unique and non-empty", () => {
        const seen = new Set<string>();
        for (const row of rows) {
            expect(isNonEmptyString(row.id)).toBe(true);
            expect(seen.has(row.id)).toBe(false);
            seen.add(row.id);
        }
    });

    test("every name and brand is a non-empty string", () => {
        for (const row of rows) {
            expect(isNonEmptyString(row.name)).toBe(true);
            expect(isNonEmptyString(row.brand)).toBe(true);
        }
    });

    test("every category is a valid slug", () => {
        for (const row of rows) {
            expect(VALID_CATEGORIES.has(row.category)).toBe(true);
        }
    });

    test("use_cases is an array on every row", () => {
        for (const row of rows) {
            expect(Array.isArray(row.use_cases)).toBe(true);
        }
    });

    test("data_source is a non-empty string on every row", () => {
        for (const row of rows) {
            expect(isNonEmptyString(row.data_source)).toBe(true);
        }
    });

    test("verified is a boolean on every row", () => {
        for (const row of rows) {
            expect(typeof row.verified).toBe("boolean");
        }
    });

    test("sources is an array on every row and non-empty when verified", () => {
        for (const row of rows) {
            expect(Array.isArray(row.sources)).toBe(true);
            if (row.verified === true) {
                expect((row.sources as unknown[]).length).toBeGreaterThan(0);
            }
        }
    });

    test("numeric fields are number-or-null with no NaN or Infinity", () => {
        for (const row of rows) {
            for (const field of NUMERIC_FIELDS) {
                expect(isNumberOrNull(row[field])).toBe(true);
            }
        }
    });

    test("comm and control_modes are each a string array or null", () => {
        for (const row of rows) {
            expect(isStringArrayOrNull(row.comm)).toBe(true);
            expect(isStringArrayOrNull(row.control_modes)).toBe(true);
        }
    });

    test("voltage_v is a string, number or null", () => {
        for (const row of rows) {
            const v = row.voltage_v;
            const ok =
                v === null ||
                typeof v === "string" ||
                (typeof v === "number" && Number.isFinite(v));
            expect(ok).toBe(true);
        }
    });

    test("local image_url files exist on disk", () => {
        for (const row of rows) {
            const url = row.image_url;
            if (typeof url === "string" && url.startsWith("/actuator-images/")) {
                const filePath = join(PUBLIC_DIR, url.replace(/^\//, ""));
                expect(existsSync(filePath)).toBe(true);
            }
        }
    });

    test("torque density matches peak torque over weight when all present", () => {
        for (const row of rows) {
            const { torque_density_nm_per_kg: td, peak_torque_nm: peak } = row;
            const weight = row.weight_g;
            if (
                typeof td === "number" &&
                typeof peak === "number" &&
                typeof weight === "number" &&
                weight > 0
            ) {
                const expected = peak / (weight / 1000);
                const relDiff = Math.abs(expected - td) / td;
                expect(relDiff).toBeLessThanOrEqual(DERIVED_TOLERANCE);
            }
        }
    });

    // The catalog JSON is edited by hand, so nothing else derives these.
    test("torque density and price per Nm are filled whenever their inputs are", () => {
        const positive = (v: unknown): v is number => typeof v === "number" && v > 0;
        for (const row of rows) {
            if (typeof row.peak_torque_nm === "number" && positive(row.weight_g))
                expect([row.id, row.torque_density_nm_per_kg]).toEqual([
                    row.id,
                    expect.any(Number),
                ]);
            const priced =
                typeof row.price_usd === "number" && positive(row.peak_torque_nm);
            expect([row.id, row.price_per_nm !== null]).toEqual([row.id, priced]);
        }
    });

    test("data_source follows verified", () => {
        for (const row of rows) {
            expect([row.id, row.data_source]).toEqual([
                row.id,
                row.verified ? "spot_checked" : "web_search",
            ]);
        }
    });

    test("price per Nm matches price over peak torque when all present", () => {
        for (const row of rows) {
            const { price_per_nm: ppn, price_usd: price, peak_torque_nm: peak } = row;
            if (
                typeof ppn === "number" &&
                typeof price === "number" &&
                typeof peak === "number" &&
                peak > 0
            ) {
                const expected = price / peak;
                const relDiff = Math.abs(expected - ppn) / ppn;
                expect(relDiff).toBeLessThanOrEqual(DERIVED_TOLERANCE);
            }
        }
    });
});

interface RobotMotorRow {
    actuator_id: string | null;
}

interface RobotJointRow {
    motor: string;
}

interface RobotRow {
    id: string;
    joints: RobotJointRow[];
    sources: unknown;
}

interface RobotDataShape {
    motors: Record<string, RobotMotorRow>;
    robots: RobotRow[];
}

const robotData = robots as unknown as RobotDataShape;

describe("robots dataset integrity", () => {
    test("robots is a non-empty array with unique ids", () => {
        expect(Array.isArray(robotData.robots)).toBe(true);
        expect(robotData.robots.length).toBeGreaterThan(0);
        const seen = new Set<string>();
        for (const robot of robotData.robots) {
            expect(isNonEmptyString(robot.id)).toBe(true);
            expect(seen.has(robot.id)).toBe(false);
            seen.add(robot.id);
        }
    });

    test("motor.actuator_id references resolve to an actuator or are null", () => {
        const actuatorIds = new Set(rows.map((row) => row.id));
        for (const motor of Object.values(robotData.motors)) {
            if (motor.actuator_id !== null) {
                expect(actuatorIds.has(motor.actuator_id)).toBe(true);
            }
        }
    });

    test("every robot joint references a known motor", () => {
        const motorKeys = new Set(Object.keys(robotData.motors));
        for (const robot of robotData.robots) {
            for (const joint of robot.joints) {
                expect(motorKeys.has(joint.motor)).toBe(true);
            }
        }
    });

    test("sources is an array on every robot", () => {
        for (const robot of robotData.robots) {
            expect(Array.isArray(robot.sources)).toBe(true);
        }
    });
});
