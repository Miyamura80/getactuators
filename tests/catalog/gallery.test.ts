import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { galleryCards } from "@/catalog/gallery";

// Characterization of the pre-existing bento rhythm, now shared by HTML and SPA.
test("gallery ranking preserves the existing sizes and stable catalog tie order", () => {
    const before: { id: string; size: "lg" | "wide" | "sm" }[] = ACTUATORS.map(
        (a): { id: string; size: "lg" | "wide" | "sm" } => {
            const density = ACTUATORS.filter((x) => x.torque_density_nm_per_kg != null)
                .slice()
                .sort(
                    (x, y) =>
                        (y.torque_density_nm_per_kg ?? 0) -
                        (x.torque_density_nm_per_kg ?? 0),
                );
            const torque = ACTUATORS.filter((x) => x.peak_torque_nm != null)
                .slice()
                .sort((x, y) => (y.peak_torque_nm ?? 0) - (x.peak_torque_nm ?? 0));
            const dRank = density.findIndex((x) => x.id === a.id);
            const tRank = torque.findIndex((x) => x.id === a.id);
            return {
                id: a.id,
                size:
                    dRank >= 0 && dRank < 4
                        ? "lg"
                        : tRank >= 0 && tRank < 10
                          ? "wide"
                          : "sm",
            };
        },
    ).sort(
        (a, b) =>
            ["lg", "wide", "sm"].indexOf(a.size) - ["lg", "wide", "sm"].indexOf(b.size),
    );
    expect(galleryCards(ACTUATORS).map(({ a, size }) => ({ id: a.id, size }))).toEqual(
        before,
    );
    expect(galleryCards([])).toEqual([]);
});

test("gallery helper ranks changed input without mutating the catalog or losing null-valued cards", () => {
    const input = Array.from({ length: 15 }, (_, i) => ({
        id: `a${i}`,
        peak_torque_nm: i,
        torque_density_nm_per_kg: i < 5 ? null : i,
        image_url: `/a${i}.webp`,
    }));
    const copy = structuredClone(input);
    const cards = galleryCards(input);
    expect(cards.map(({ a }) => a.id)).toEqual([
        "a11",
        "a12",
        "a13",
        "a14",
        "a5",
        "a6",
        "a7",
        "a8",
        "a9",
        "a10",
        "a0",
        "a1",
        "a2",
        "a3",
        "a4",
    ]);
    expect(cards[0]?.a.image_url).toBe("/a11.webp");
    expect(input).toEqual(copy);
});
