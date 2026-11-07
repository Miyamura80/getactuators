import { BOM_MARGINS } from "./bom";
import type { Company } from "./types";

// Makers of the precision parts on /manufacturing?chain=precision that the
// registry did not have yet: European roller screw and bearing makers and
// the encoder specialists. Japanese and Chinese gear, screw and bearing
// makers already in the registry (Harmonic Drive Systems, Nidec, THK, NSK,
// Nippon Thompson, Leaderdrive, Beite, ZWZ and others) are reused, as is
// Schaeffler from ./korea.

const GEAR: Company["segment"] = "gears-screws-bearings";
// Encoders sit with motors, as Tamagawa Seiki does.
const MOTOR: Company["segment"] = "magnets-motors";

export const PRECISION_COMPANIES: Company[] = [
    {
        id: "rollvis",
        name: "Rollvis",
        hqCountry: "CH",
        stages: ["screw"],
        segment: GEAR,
        ownership: { kind: "private" },
        products: [
            "Satellite (planetary) roller screws",
            "Recirculating roller screws",
        ],
        url: "https://www.rollvis.com/",
        sources: ["med-technews-rollvis"],
    },
    {
        id: "gsa",
        name: "GSA",
        hqCountry: "CH",
        stages: ["screw"],
        segment: GEAR,
        ownership: { kind: "private" },
        products: ["Planetary roller screws"],
        // Its own domain is unverified; this is its trade-fair listing.
        url: "https://espositori.mecspe.com/portal/en/gsa-ag/catalogs/roller-screw",
        sources: ["gsa-roller-screw-catalog"],
    },
    {
        id: "ewellix",
        name: "Ewellix",
        hqCountry: "SE",
        stages: ["screw", "actuator"],
        segment: GEAR,
        ownership: { kind: "subsidiary", parent: "Schaeffler" },
        products: ["Planetary roller screws", "Ball screws", "Linear actuators"],
        url: "https://www.ewellix.com/",
        sources: ["schaeffler-ewellix-purchase"],
    },
    {
        id: "renishaw",
        name: "Renishaw",
        hqCountry: "GB",
        stages: ["electronics"],
        segment: MOTOR,
        ownership: { kind: "listed", ticker: "LSE: RSW" },
        grossMargin: BOM_MARGINS.renishaw,
        products: ["Optical linear and rotary encoders", "Metrology probes"],
        url: "https://www.renishaw.com/",
        sources: ["renishaw-resa30"],
    },
    {
        id: "rls",
        name: "RLS",
        hqCountry: "SI",
        stages: ["electronics"],
        segment: MOTOR,
        // Ownership left out: Renishaw is reported to hold a stake, but no
        // cited source states RLS's ownership.
        products: ["Magnetic rotary and linear encoders", "Magnetic rings"],
        url: "https://www.rls.si/",
        sources: ["rls-aksim-2"],
    },
    {
        id: "heidenhain",
        name: "HEIDENHAIN",
        hqCountry: "DE",
        stages: ["electronics"],
        segment: MOTOR,
        ownership: { kind: "private" },
        products: [
            "Angle encoders",
            "Rotary encoders",
            "Linear encoders",
            "CNC controls",
        ],
        url: "https://www.heidenhain.com/",
        sources: ["heidenhain-general-catalog"],
    },
    {
        id: "ic-haus",
        name: "iC-Haus",
        hqCountry: "DE",
        stages: ["electronics"],
        segment: MOTOR,
        ownership: { kind: "private" },
        products: ["Encoder interpolation ICs", "Optical and magnetic encoder ICs"],
        url: "https://www.ichaus.de/",
        sources: ["ichaus-tw8"],
    },
];
