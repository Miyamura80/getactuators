import "./happydom";
import { expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ACTUATORS } from "../src/lib/data";
import { ComparisonHub } from "../src/components/ComparisonHub";

test("production React directory reuses immutable generation across mounts", () => {
    const record = ACTUATORS.find(a => a.id === "cubemars-ak60-6")!;
    const descriptor = Object.getOwnPropertyDescriptor(record, "category")!;
    let reads = 0;
    Object.defineProperty(record, "category", { configurable: true, get: () => { reads++; return descriptor.value; } });
    try {
        render(<ComparisonHub />); cleanup(); render(<ComparisonHub />);
        expect(reads).toBe(0);
    } finally { cleanup(); Object.defineProperty(record, "category", descriptor); }
});
