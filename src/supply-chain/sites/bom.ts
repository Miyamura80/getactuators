import { type Site, hq } from "./types";

// Headquarters of the companies /bom adds (companies/bom.ts). City centres.
// Renishaw's is in ./precision.

export const BOM_SITES: Site[] = [
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
