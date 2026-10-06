import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { HighlightCards } from "../src/components/HighlightCards";
import { ACTUATORS } from "../src/lib/data";

afterEach(cleanup);

test("highlight charts rank verified entries only", () => {
    const unverified = ACTUATORS.filter((a) => !a.verified);
    expect(unverified.length).toBeGreaterThan(0);
    const { container } = render(<HighlightCards actuators={ACTUATORS} onSelect={() => {}} />);
    const text = container.textContent ?? "";
    for (const a of unverified) expect(text).not.toContain(a.name);
    expect(text).toContain(ACTUATORS.find((a) => a.verified && a.torque_density_nm_per_kg != null)?.name ?? "?");
});
