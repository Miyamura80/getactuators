import { type Site, hq } from "./types";

// Headquarters of the legged-robot makers in companies/legged, pinned to the
// city centre.

export const LEGGED_SITES: Site[] = [
    hq("ghost-robotics-philadelphia", {
        companyId: "ghost-robotics",
        name: "Ghost Robotics headquarters",
        country: "US",
        admin1: "Pennsylvania",
        lat: 39.952,
        lon: -75.165,
        sources: ["prn-ghost-lig-close-2024"],
    }),
    hq("anybotics-zurich", {
        companyId: "anybotics",
        name: "ANYbotics headquarters",
        country: "CH",
        admin1: "Zurich",
        lat: 47.377,
        lon: 8.54,
        sources: ["siliconcanals-anybotics"],
    }),
    hq("lig-nex1-yongin", {
        companyId: "lig-nex1",
        name: "LIG Nex1 headquarters",
        country: "KR",
        admin1: "Gyeonggi",
        lat: 37.241,
        lon: 127.178,
        sources: ["wiki-lig-nex1"],
    }),
];
