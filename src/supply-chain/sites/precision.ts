import { type Site, hq } from "./types";

// Headquarters of the precision chain makers added for
// /manufacturing?chain=precision, pinned to their home city. Rollvis's and
// GSA's towns are not confirmed by a cited source, so both are pinned to
// Switzerland as a region.

export const PRECISION_SITES: Site[] = [
    {
        id: "rollvis-switzerland",
        companyId: "rollvis",
        kind: "hq",
        name: "Rollvis headquarters",
        country: "CH",
        lat: 46.8,
        lon: 8.2,
        precision: "region",
        stages: [],
        status: "operating",
        sources: ["med-technews-rollvis"],
    },
    {
        id: "gsa-switzerland",
        companyId: "gsa",
        kind: "hq",
        name: "GSA headquarters",
        country: "CH",
        lat: 46.8,
        lon: 8.2,
        precision: "region",
        stages: [],
        status: "operating",
        sources: ["gsa-roller-screw-catalog"],
    },
    hq("ewellix-gothenburg", {
        companyId: "ewellix",
        name: "Ewellix headquarters",
        country: "SE",
        admin1: "Västra Götaland",
        lat: 57.71,
        lon: 11.97,
        sources: ["schaeffler-ewellix-purchase"],
    }),
    hq("skf-gothenburg", {
        companyId: "skf",
        name: "SKF headquarters",
        country: "SE",
        admin1: "Västra Götaland",
        lat: 57.72,
        lon: 11.94,
        sources: ["morningstar-skf-profile"],
    }),
    hq("renishaw-wotton", {
        companyId: "renishaw",
        name: "Renishaw headquarters",
        country: "GB",
        admin1: "Gloucestershire",
        lat: 51.64,
        lon: -2.35,
        sources: ["renishaw-resa30"],
    }),
    hq("rls-komenda", {
        companyId: "rls",
        name: "RLS headquarters",
        country: "SI",
        lat: 46.2,
        lon: 14.54,
        sources: ["rls-aksim-2"],
    }),
    hq("heidenhain-traunreut", {
        companyId: "heidenhain",
        name: "HEIDENHAIN headquarters",
        country: "DE",
        admin1: "Bavaria",
        lat: 47.96,
        lon: 12.59,
        sources: ["heidenhain-general-catalog"],
    }),
    hq("ichaus-bodenheim", {
        companyId: "ic-haus",
        name: "iC-Haus headquarters",
        country: "DE",
        admin1: "Rhineland-Palatinate",
        lat: 49.93,
        lon: 8.32,
        sources: ["ichaus-tw8"],
    }),
];
