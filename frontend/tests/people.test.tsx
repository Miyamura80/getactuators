import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { People } from "../src/pages/people/People";
import { DIRECTORY } from "../../src/people";

afterEach(cleanup);

test("the app routes /people to the people directory", async () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost:1/people");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root")!;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        expect(root.querySelector("h1")?.textContent).toBe("Who shapes actuators and the magnet supply chain");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("every person gets a card with an initials placeholder or licensed photo, and the domain filter narrows the grid", () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost:1/people");
    const view = render(<People />);
    const cards = () => [...view.container.querySelectorAll("article.pc")];
    expect(cards()).toHaveLength(DIRECTORY.length);
    for (const c of cards()) expect(c.querySelector(".pc-face img, .pc-monogram")).not.toBeNull();
    const magnets = [...view.container.querySelectorAll(".pp-filter button")].find((b) => b.textContent?.includes("REE and magnets"))!;
    fireEvent.click(magnets);
    expect(cards()).toHaveLength(DIRECTORY.filter((p) => p.domain === "magnets").length);
    expect(magnets.getAttribute("aria-pressed")).toBe("true");
});

test("network links each person node to their card and the page names its criteria", () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost:1/people");
    const view = render(<People />);
    const nodes = view.container.querySelectorAll(".pp-net a.pp-node");
    expect(nodes).toHaveLength(DIRECTORY.length);
    expect(nodes[0]?.getAttribute("href")).toBe(`#${DIRECTORY[0]!.id}`);
    expect(view.container.querySelector(`#${DIRECTORY[0]!.id}`)).not.toBeNull();
    expect(view.container.querySelector(".pp-criteria")?.textContent).toContain("Suggest someone");
});
