import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Sidebar } from "../src/components/Sidebar";

afterEach(cleanup);

test("sidebar indicates alpha without the old dataset disclaimer", () => {
    const { container } = render(<Sidebar items={[]} active="" onSelect={() => {}} />);
    expect(container.querySelector(".side-brand .alpha-tag")?.textContent).toBe("alpha");
    expect(container.querySelector(".side-note")).toBeNull();
    expect(container.textContent).not.toContain("v1 dataset");
    expect(container.textContent).not.toContain("Verify against datasheets before design use.");
});
