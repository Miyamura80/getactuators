// Dependency-neutral gallery ordering: the browser and server must select the
// same leading card. Preserve catalog order for ties within each tile size.
interface GalleryActuator {
    id: string;
    torque_density_nm_per_kg: number | null;
    peak_torque_nm: number | null;
    image_url?: string | null;
}

export type GallerySize = "lg" | "wide" | "sm";

export function galleryCards<T extends GalleryActuator>(actuators: readonly T[]) {
    const byDensity = [...actuators]
        .filter((a) => a.torque_density_nm_per_kg != null)
        .sort(
            (a, b) =>
                (b.torque_density_nm_per_kg ?? 0) - (a.torque_density_nm_per_kg ?? 0),
        )
        .map((a) => a.id);
    const byTorque = [...actuators]
        .filter((a) => a.peak_torque_nm != null)
        .sort((a, b) => (b.peak_torque_nm ?? 0) - (a.peak_torque_nm ?? 0))
        .map((a) => a.id);
    const dRank = new Map(byDensity.map((id, i) => [id, i]));
    const tRank = new Map(byTorque.map((id, i) => [id, i]));
    const order: Record<GallerySize, number> = { lg: 0, wide: 1, sm: 2 };
    return actuators
        .map((a) => {
            const size: GallerySize =
                (dRank.get(a.id) ?? 999) < 4
                    ? "lg"
                    : (tRank.get(a.id) ?? 999) < 10
                      ? "wide"
                      : "sm";
            return { a, size };
        })
        .sort((x, y) => order[x.size] - order[y.size]);
}
