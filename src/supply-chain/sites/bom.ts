import { type Site, hq } from "./types";

// Headquarters of the companies /bom adds (companies/bom.ts). City centres.

export const BOM_SITES: Site[] = [
    hq("renishaw-wotton", {
        companyId: "renishaw",
        name: "Renishaw headquarters, Wotton-under-Edge",
        country: "GB",
        admin1: "Gloucestershire",
        lat: 51.64,
        lon: -2.35,
        sources: ["renishaw-fy2025"],
    }),
    hq("cmsemicon-shenzhen", {
        companyId: "cmsemicon",
        name: "Cmsemicon headquarters, Shenzhen",
        country: "CN",
        admin1: "Guangdong",
        lat: 22.54,
        lon: 114.06,
        sources: ["dealroom-cmsemicon"],
    }),
];
