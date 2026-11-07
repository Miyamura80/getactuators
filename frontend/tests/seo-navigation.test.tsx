import "./happydom";
import { afterEach, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render, act } from "@testing-library/react";
import { Link, navigate, useLocationKey } from "../src/lib/router";

// happy-dom does not load a new document for native navigation. Observe the
// browser boundary, rather than pretending a history.pushState updates its head.
afterEach(cleanup);

test("programmatic pathname changes load server documents instead of stale SPA heads", () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("https://actuatorlist.com/");
    const assign = spyOn(window.location, "assign").mockImplementation(() => {});
    const push = spyOn(window.history, "pushState");
    try {
        for (const path of ["/all", "/actuators", "/robots", "/agents", "/actuators/robstride-04"]) {
            navigate(path);
            expect(assign).toHaveBeenLastCalledWith(path);
        }
        expect(push).not.toHaveBeenCalled();
    } finally {
        assign.mockRestore();
        push.mockRestore();
    }
});

test("cross-page Link clicks retain native anchor navigation and browser history", () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("https://actuatorlist.com/");
    const { getByRole } = render(<Link to="/actuators/robstride-04">Product</Link>);
    const assign = spyOn(window.location, "assign").mockImplementation(() => {});
    let intercepted: boolean | undefined;
    const observe = (event: Event) => {
        intercepted = event.defaultPrevented;
        event.preventDefault(); // Stop happy-dom's simulated navigation after observing React.
    };
    document.addEventListener("click", observe);
    try {
        fireEvent.click(getByRole("link"));
        expect(intercepted).toBe(false);
        expect(assign).not.toHaveBeenCalled();
        expect(getByRole("link").getAttribute("href")).toBe("/actuators/robstride-04");
    } finally {
        document.removeEventListener("click", observe);
        assign.mockRestore();
    }
});

function LocationProbe() {
    return <output>{useLocationKey()}</output>;
}

test("same-page query and hash history still notify mounted subscribers", () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("https://actuatorlist.com/all");
    const { container } = render(<LocationProbe />);
    const assign = spyOn(window.location, "assign").mockImplementation(() => {});
    try {
        act(() => navigate("/all?q=robstride&sel=robstride-04#filters"));
        expect(container.textContent).toBe("https://actuatorlist.com/all?q=robstride&sel=robstride-04#filters");
        expect(assign).not.toHaveBeenCalled();
        // happy-dom does not implement real document traversal; simulate the
        // same-page URL/popstate that the browser delivers on back/forward.
        act(() => {
            window.history.replaceState({}, "", "/all");
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        expect(container.textContent).toBe("https://actuatorlist.com/all");
        act(() => {
            window.history.replaceState({}, "", "/all?q=robstride");
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        expect(container.textContent).toBe("https://actuatorlist.com/all?q=robstride");
    } finally {
        assign.mockRestore();
    }
});
