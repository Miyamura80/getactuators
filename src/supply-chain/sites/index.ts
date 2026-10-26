import type { CountryCode } from "../countries";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// Physical places: headquarters, plants, mines and refineries. `precision`
// says how exact the pin is; "city" means the city centre, not the gate.

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
function hq(id: string, h: Hq): Site {
    return { id, kind: "hq", precision: "city", stages: [], status: "operating", ...h };
}

export const SITES: Site[] = [
    // MP Materials
    {
        id: "mp-mountain-pass",
        companyId: "mp-materials",
        kind: "mine",
        name: "Mountain Pass mine and separation plant",
        country: "US",
        admin1: "California",
        lat: 35.4786,
        lon: -115.5326,
        precision: "site",
        makes: ["Rare earth concentrate", "NdPr oxide"],
        stages: ["mining", "separation"],
        status: "operating",
        sources: ["mp-10k-2025", "usgs-mcs-2026-ree"],
    },
    {
        id: "mp-independence",
        companyId: "mp-materials",
        kind: "plant",
        name: "Independence magnet plant",
        country: "US",
        admin1: "Texas",
        lat: 32.7555,
        lon: -97.3308,
        precision: "city",
        makes: ["NdPr metal", "NdFeB magnets"],
        stages: ["metal-alloy", "magnet"],
        status: "operating",
        sources: ["mp-10k-2025"],
    },
    hq("mp-las-vegas", {
        companyId: "mp-materials",
        name: "MP Materials headquarters",
        country: "US",
        admin1: "Nevada",
        lat: 36.17,
        lon: -115.14,
        sources: ["mp-10k-2025"],
    }),
    // Chinese rare earth groups
    hq("northern-baotou", {
        companyId: "china-northern-rare-earth",
        name: "China Northern Rare Earth headquarters",
        country: "CN",
        admin1: "Inner Mongolia",
        lat: 40.66,
        lon: 109.84,
        sources: ["reht-site"],
    }),
    hq("crg-ganzhou", {
        companyId: "china-rare-earth-group",
        name: "China Rare Earth Group headquarters",
        country: "CN",
        admin1: "Jiangxi",
        lat: 25.83,
        lon: 114.93,
        sources: ["chinadaily-crg-2021"],
    }),
    hq("shenghe-chengdu", {
        companyId: "shenghe-resources",
        name: "Shenghe Resources headquarters",
        country: "CN",
        admin1: "Sichuan",
        lat: 30.66,
        lon: 104.07,
        sources: ["wikipedia-shenghe"],
    }),
    // Shin-Etsu
    hq("shinetsu-tokyo", {
        companyId: "shin-etsu-chemical",
        name: "Shin-Etsu Chemical headquarters",
        country: "JP",
        admin1: "Tokyo",
        lat: 35.686,
        lon: 139.766,
        sources: ["shinetsu-site"],
    }),
    {
        id: "shinetsu-echizen",
        companyId: "shin-etsu-chemical",
        kind: "plant",
        name: "Echizen rare earth and magnet plant",
        country: "JP",
        admin1: "Fukui",
        lat: 35.9,
        lon: 136.17,
        precision: "city",
        makes: ["Rare earth metals", "Sintered NdFeB magnets"],
        stages: ["separation", "metal-alloy", "magnet"],
        status: "operating",
        sources: ["nippon-shinetsu-2026"],
    },
    // JL MAG
    {
        id: "jlmag-ganzhou",
        companyId: "jl-mag",
        kind: "plant",
        name: "Ganzhou headquarters and magnet plant",
        country: "CN",
        admin1: "Jiangxi",
        lat: 25.83,
        lon: 114.93,
        precision: "city",
        makes: ["NdFeB magnets"],
        stages: ["magnet"],
        status: "operating",
        sources: ["jlmag-about", "asianmetal-jlmag-2025"],
    },
    {
        id: "jlmag-baotou",
        companyId: "jl-mag",
        kind: "plant",
        name: "Baotou magnet plant",
        country: "CN",
        admin1: "Inner Mongolia",
        lat: 40.65,
        lon: 109.84,
        precision: "city",
        makes: ["NdFeB magnets"],
        stages: ["magnet"],
        status: "operating",
        sources: ["jlmag-about", "asianmetal-jlmag-2025"],
    },
    {
        id: "jlmag-baotou-expansion",
        companyId: "jl-mag",
        kind: "plant",
        name: "Baotou 20,000 t magnet project",
        country: "CN",
        admin1: "Inner Mongolia",
        lat: 40.65,
        lon: 109.84,
        precision: "city",
        makes: ["NdFeB magnets"],
        stages: ["magnet"],
        capacity: {
            value: 20000,
            unit: "t/yr",
            sources: ["yicai-jlmag-baotou-2025"],
            asOf: "2025-01",
            confidence: "reported",
        },
        status: "construction",
        sources: ["yicai-jlmag-baotou-2025"],
    },
    {
        id: "jlmag-ningbo",
        companyId: "jl-mag",
        kind: "plant",
        name: "Ningbo magnet plant",
        country: "CN",
        admin1: "Zhejiang",
        lat: 29.87,
        lon: 121.54,
        precision: "city",
        makes: ["NdFeB magnets"],
        stages: ["magnet"],
        status: "operating",
        sources: ["jlmag-about", "asianmetal-jlmag-2025"],
    },
    hq("nidec-kyoto", {
        companyId: "nidec",
        name: "Nidec headquarters",
        country: "JP",
        admin1: "Kyoto",
        lat: 34.99,
        lon: 135.76,
        sources: ["nidec-site"],
    }),
    // Gears, screws and bearings
    hq("hds-tokyo", {
        companyId: "harmonic-drive-systems",
        name: "Harmonic Drive Systems headquarters",
        country: "JP",
        admin1: "Tokyo",
        lat: 35.61,
        lon: 139.73,
        sources: ["hds-site"],
    }),
    {
        id: "hds-hotaka",
        companyId: "harmonic-drive-systems",
        kind: "plant",
        name: "Hotaka plant",
        country: "JP",
        admin1: "Nagano",
        lat: 36.34,
        lon: 137.89,
        precision: "city",
        makes: ["Strain wave gears"],
        stages: ["gearing"],
        status: "operating",
        sources: ["jaxa-hds-hotaka"],
    },
    {
        id: "nabtesco-tsu",
        companyId: "nabtesco",
        kind: "plant",
        name: "Tsu precision reduction gear plant",
        country: "JP",
        admin1: "Mie",
        lat: 34.72,
        lon: 136.51,
        precision: "city",
        makes: ["RV reducers"],
        stages: ["gearing"],
        status: "operating",
        sources: ["researchandmarkets-reducers-2020"],
    },
    {
        id: "nabtesco-changzhou",
        companyId: "nabtesco",
        kind: "plant",
        name: "Changzhou precision reduction gear plant",
        country: "CN",
        admin1: "Jiangsu",
        lat: 31.81,
        lon: 119.97,
        precision: "city",
        makes: ["RV reducers"],
        stages: ["gearing"],
        status: "operating",
        sources: ["researchandmarkets-reducers-2020"],
    },
    {
        id: "leaderdrive-suzhou",
        companyId: "leaderdrive",
        kind: "plant",
        name: "Suzhou headquarters and plant",
        country: "CN",
        admin1: "Jiangsu",
        lat: 31.27,
        lon: 120.63,
        precision: "city",
        makes: ["Harmonic reducers"],
        stages: ["gearing"],
        status: "operating",
        sources: ["sse-leaderdrive"],
    },
    hq("timken-north-canton", {
        companyId: "timken",
        name: "Timken headquarters",
        country: "US",
        admin1: "Ohio",
        lat: 40.88,
        lon: -81.4,
        sources: ["timken-site"],
    }),
    // Robot and actuator makers
    hq("tesla-austin", {
        companyId: "tesla",
        name: "Tesla headquarters, Gigafactory Texas",
        country: "US",
        admin1: "Texas",
        lat: 30.22,
        lon: -97.62,
        sources: ["tesla-site"],
    }),
    hq("bd-waltham", {
        companyId: "boston-dynamics",
        name: "Boston Dynamics headquarters",
        country: "US",
        admin1: "Massachusetts",
        lat: 42.38,
        lon: -71.24,
        sources: ["bostondynamics-site"],
    }),
    hq("mobis-seoul", {
        companyId: "hyundai-mobis",
        name: "Hyundai Mobis headquarters",
        country: "KR",
        admin1: "Seoul",
        lat: 37.51,
        lon: 127.04,
        sources: ["mobis-site"],
    }),
    hq("rainbow-daejeon", {
        companyId: "rainbow-robotics",
        name: "Rainbow Robotics headquarters",
        country: "KR",
        admin1: "Daejeon",
        lat: 36.35,
        lon: 127.38,
        sources: ["rainbow-site"],
    }),
    hq("fanuc-oshino", {
        companyId: "fanuc",
        name: "FANUC headquarters",
        country: "JP",
        admin1: "Yamanashi",
        lat: 35.46,
        lon: 138.86,
        sources: ["fanuc-site"],
    }),
    hq("yaskawa-kitakyushu", {
        companyId: "yaskawa",
        name: "Yaskawa Electric headquarters",
        country: "JP",
        admin1: "Fukuoka",
        lat: 33.88,
        lon: 130.88,
        sources: ["yaskawa-site"],
    }),
    hq("unitree-hangzhou", {
        companyId: "unitree",
        name: "Unitree headquarters",
        country: "CN",
        admin1: "Zhejiang",
        lat: 30.21,
        lon: 120.21,
        sources: ["wikipedia-unitree"],
    }),
    hq("ubtech-shenzhen", {
        companyId: "ubtech",
        name: "UBTech headquarters",
        country: "CN",
        admin1: "Guangdong",
        lat: 22.54,
        lon: 114.06,
        sources: ["ubtech-site"],
    }),
    hq("agibot-shanghai", {
        companyId: "agibot",
        name: "AgiBot headquarters",
        country: "CN",
        admin1: "Shanghai",
        lat: 31.23,
        lon: 121.47,
        sources: ["agibot-site"],
    }),
    hq("tuopu-ningbo", {
        companyId: "tuopu-group",
        name: "Tuopu Group headquarters",
        country: "CN",
        admin1: "Zhejiang",
        lat: 29.9,
        lon: 121.84,
        sources: ["tuopu-annual-report-2024"],
    }),
];
