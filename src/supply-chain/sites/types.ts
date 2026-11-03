import type { CountryCode } from "../countries";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// Physical places: headquarters, plants, mines and refineries. `precision`
// says how exact the pin is; "city" means the city centre, not the gate.
// The record type and builders, shared by every file under sites/.

export const SITE_KINDS = ["hq", "plant", "mine", "refinery", "rnd"] as const;
export const SITE_STATUSES = [
    "operating",
    "construction",
    "announced",
    "closed",
] as const;

export interface Site {
    id: string;
    companyId: string;
    kind: (typeof SITE_KINDS)[number];
    name: string;
    country: CountryCode;
    admin1?: string;
    lat: number;
    lon: number;
    precision: "site" | "city" | "region";
    makes?: string[];
    stages: Stage[];
    capacity?: Sourced<number>;
    opened?: Sourced<number>;
    status?: (typeof SITE_STATUSES)[number];
    sources: SourceId[];
}

type Hq = Pick<Site, "companyId" | "name" | "country" | "admin1" | "lat" | "lon"> & {
    sources: SourceId[];
};

// A headquarters pinned to its city.
export function hq(id: string, h: Hq): Site {
    return { id, kind: "hq", precision: "city", stages: [], status: "operating", ...h };
}

type Plant = Omit<Site, "id" | "kind" | "status"> &
    Partial<Pick<Site, "kind" | "status">>;

// A plant (or another kind given in `p`), operating unless `p` says otherwise.
export function plant(id: string, p: Plant): Site {
    return { id, kind: "plant", status: "operating", ...p };
}
