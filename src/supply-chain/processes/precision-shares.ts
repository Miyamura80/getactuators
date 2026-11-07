import type { Shares } from "../concentration";
import type { Sourced } from "../sourced";

// Country shares for the four precision sub-chains. No public source splits
// these markets by country, so each is modeled from company shares (the
// company's headquarters country stands in for where it makes the part) or
// taken from one capacity estimate. Method notes say how; treat them as
// rough, not as measured output.

// Harmonic Drive Systems (JP), Leaderdrive (CN) and Nidec-Shimpo (JP) hold
// about 93% between them; Leaderdrive says about 15%.
export const STRAIN_WAVE_GEARS_2024: Sourced<Shares> = {
    value: { JP: 0.78, CN: 0.15, other: 0.07 },
    unit: "fraction",
    sources: ["gir-harmonic-drive-2024", "gasgoo-leaderdrive-ipo-2026"],
    asOf: "2024",
    confidence: "modeled",
    note: "Modeled: the top three makers' ~93% of revenue less Leaderdrive's own ~15% claim is given to Japan (Harmonic Drive Systems, Nidec-Shimpo). Another report credits the top two with only ~63%, so Japan may be as low as ~48%.",
};

// The top five roller screw makers held about 58% of 2024 revenue; the
// report lists Schaeffler (Ewellix), Bosch Rexroth, GSA, Rollvis and Nook
// first. Their shares are not split, so each is drawn at one fifth.
export const ROLLER_SCREWS_2024: Sourced<Shares> = {
    value: { DE: 0.23, CH: 0.23, US: 0.12, other: 0.42 },
    unit: "fraction",
    sources: ["qyr-roller-screws-2025"],
    asOf: "2024",
    confidence: "modeled",
    note: "Modeled: the top five's ~57.7% of revenue split evenly across the first five makers the report names (two German, two Swiss, one US). Chinese makers entering in 2025 and 2026 are in other.",
};

// Six makers supply about 60% of the world's ball bearings: SKF (SE),
// Schaeffler (DE), Timken (US), NSK, NTN and JTEKT (JP).
export const ROLLING_BEARINGS: Sourced<Shares> = {
    value: { JP: 0.3, SE: 0.1, DE: 0.1, US: 0.1, other: 0.4 },
    unit: "fraction",
    sources: ["morningstar-skf-profile"],
    asOf: "2025",
    confidence: "modeled",
    note: "Modeled: the six largest ball bearing makers' ~60% split evenly by headquarters. All ball bearings, not only precision grades; robot-grade crossed-roller and thin-section bearings lean further to Japan.",
};

// Encoder and position sensor capacity for humanoids.
export const ENCODERS_2025: Sourced<Shares> = {
    value: { CN: 0.4, JP: 0.3, DE: 0.15, other: 0.15 },
    unit: "fraction",
    sources: ["mckinsey-humanoid-edge-2025"],
    asOf: "2025",
    confidence: "estimated",
    note: "Share of production capacity for encoders and position sensors, from one chart; not sales.",
};
