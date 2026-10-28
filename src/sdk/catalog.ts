import { resolveBrand } from "@/brands";
import { ACTUATORS } from "@/catalog";
import type { CatalogEntry } from "./score";

// The catalog as /sdk sees it: one row per actuator with its brand id and
// whether it has a command interface (a bus listed in `comm`). Gearboxes and
// frameless motors list none, so there is no SDK to score for them.

export function sdkCatalog(): CatalogEntry[] {
    return ACTUATORS.map((a) => {
        const brand = resolveBrand(a.brand);
        return {
            id: a.id,
            brand: brand?.id ?? a.brand,
            name: brand?.name ?? a.brand,
            commandable: (a.comm ?? []).length > 0,
            pricePerNm: a.price_per_nm ?? null,
        };
    });
}
