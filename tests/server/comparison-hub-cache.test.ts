import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { comparisonHub } from "@/server/agent/comparison-hub";

test("production hub reuses category grouping instead of re-running peer generation", () => {
    const record = ACTUATORS.find((a) => a.id === "cubemars-ak60-6");
    if (!record) throw new Error("Missing model");
    const descriptor = Object.getOwnPropertyDescriptor(record, "category");
    if (!descriptor) throw new Error("Missing category descriptor");
    let reads = 0;
    Object.defineProperty(record, "category", {
        configurable: true,
        get: () => {
            reads++;
            return descriptor.value;
        },
    });
    try {
        const html = comparisonHub("html");
        comparisonHub("md");
        expect(html).toContain("compare-smart_servo");
        expect(reads).toBe(0);
    } finally {
        Object.defineProperty(record, "category", descriptor);
    }
});
