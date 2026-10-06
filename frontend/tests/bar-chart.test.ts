// Rotated bar names hang left of their bar, so long names on the first bars
// used to run past the SVG's left edge and get clipped. These pin the layout.
import { describe, expect, test } from "bun:test";
import { barLabel, barLayout } from "../src/components/BarChart";

describe("BarChart label layout", () => {
    test("short names keep the minimum padding", () => {
        expect(barLayout(["A", "B", "C"]).padL).toBe(8);
    });

    test("a long first name widens the left padding", () => {
        const short = barLayout(["RS04", "RS03"]);
        const long = barLayout(["RV-42N (RV-N cycloidal reducer)", "RS03"]);
        expect(long.padL).toBeGreaterThan(short.padL);
        expect(long.labelH).toBeGreaterThan(short.labelH);
    });

    test("long names are truncated with an ellipsis", () => {
        const label = barLabel("LPA-20 (Low Profile Rotary Actuator)");
        expect(label.length).toBeLessThanOrEqual(24);
        expect(label.endsWith("…")).toBe(true);
        expect(barLabel("RobStride 04")).toBe("RobStride 04");
    });
});
