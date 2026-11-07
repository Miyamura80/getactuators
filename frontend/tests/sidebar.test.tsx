import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { PublicHeader } from "../src/components/PublicHeader";

afterEach(cleanup);

test("shared header indicates alpha without the old dataset disclaimer", () => {
    const { container } = render(<PublicHeader path="/" />);
    expect(container.querySelector(".site-brand .alpha-tag")?.textContent).toBe("alpha");
    expect(container.querySelector(".side-note")).toBeNull();
    expect(container.textContent).not.toContain("v1 dataset");
    expect(container.textContent).not.toContain("Verify against datasheets before design use.");
});
