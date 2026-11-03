import type { CountryCode } from "../countries";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// The company record and the four industry segments, shared by every file
// under companies/.

export const SEGMENTS = [
    "ree-mining-refining",
    "magnets-motors",
    "gears-screws-bearings",
    "robot-actuator-oem",
] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_LABEL: Record<Segment, string> = {
    "ree-mining-refining": "Rare earth mining & refining",
    "magnets-motors": "Magnets & motors",
    "gears-screws-bearings": "Gears, screws & bearings",
    "robot-actuator-oem": "Robot & actuator makers",
};

export interface Company {
    id: string;
    name: string;
    localName?: string;
    hqCountry: CountryCode;
    stages: Stage[];
    segment: Segment;
    ownership?: {
        kind: "listed" | "private" | "state" | "subsidiary";
        ticker?: string;
        parent?: string;
    };
    // USD, latest fiscal year
    revenue?: Sourced<number>;
    // fraction 0..1
    grossMargin?: Sourced<number>;
    products?: string[];
    url: string;
    // Citations for profile facts (ownership, products, headquarters).
    sources?: SourceId[];
}
