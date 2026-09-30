import "./happydom";
import { afterEach, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { DetailPanel } from "../src/components/DetailPanel";
import { Leaderboard } from "../src/components/Leaderboard";
import { ACTUATORS } from "../src/lib/data";
import { ActuatorsGallery } from "../src/pages/ActuatorsGallery";

afterEach(cleanup);

test("every gallery card is an anchor to its encoded product path", () => {
    const { container } = render(<ActuatorsGallery />);
    const cards = Array.from(container.querySelectorAll("a.bento-card"));
    expect(cards).toHaveLength(ACTUATORS.length);
    for (const a of ACTUATORS) {
        const card = cards.find((link) => link.getAttribute("href") === `/actuators/${encodeURIComponent(a.id)}`);
        expect(card?.textContent).toContain(a.name);
        expect(card?.querySelector(".bento-thumb")).not.toBeNull();
    }
});

test("table product names are native links while compare and row preview still work", () => {
    let selected = "";
    let compared = "";
    const { container, getByLabelText } = render(<Leaderboard
        rows={ACTUATORS} sortKey="peak_torque_nm" sortDir="desc" maxes={{}}
        compare={new Set()} onSort={() => {}}
        onToggleCompare={(id) => { compared = id; }}
        onSelect={(a) => { selected = a.id; }}
    />);
    const names = Array.from(container.querySelectorAll(".col-name a.name"));
    expect(names).toHaveLength(ACTUATORS.length);
    for (const a of ACTUATORS) {
        expect(names.some((link) => link.getAttribute("href") === `/actuators/${encodeURIComponent(a.id)}` && link.textContent?.includes(a.name))).toBe(true);
    }
    const a = ACTUATORS[0];
    expect(fireEvent.click(names[0])).toBe(true); // Native default was not canceled.
    expect(selected).toBe("");
    fireEvent.click(getByLabelText(`Compare ${a.name}`));
    expect(compared).toBe(a.id);
    expect(selected).toBe("");
    fireEvent.click(container.querySelector("tbody .col-cat")!);
    expect(selected).toBe(a.id);
});

test("drawer copies the dedicated canonical product path instead of list selection", async () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("https://actuatorlist.com/all?sel=old#filters");
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
        for (const a of [ACTUATORS[0], { ...ACTUATORS[0], id: "motor /?#" }]) {
            const { getByLabelText, unmount } = render(<DetailPanel actuator={a} onClose={() => {}} />);
            fireEvent.click(getByLabelText(`Copy link to ${a.name}`));
            await waitFor(() => expect(copy).toHaveBeenLastCalledWith(`https://actuatorlist.com/actuators/${encodeURIComponent(a.id)}`));
            unmount();
        }
    } finally {
        copy.mockRestore();
    }
});
