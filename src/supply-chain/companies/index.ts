import type { CountryCode } from "../countries";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// Companies along the actuator supply chain, ore to robot. Seed set: enough
// to exercise the shared kits across four segments and four countries; the
// page datasets (metals, BOM, country pages) grow it.

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

export const COMPANIES: Company[] = [
    // Rare earth mining and refining
    {
        id: "mp-materials",
        name: "MP Materials",
        hqCountry: "US",
        stages: ["mining", "separation", "metal-alloy", "magnet"],
        segment: "ree-mining-refining",
        ownership: { kind: "listed", ticker: "NYSE: MP" },
        revenue: {
            value: 224.4e6,
            unit: "USD",
            sources: ["mp-results-fy2025"],
            asOf: "2025",
            confidence: "reported",
        },
        products: [
            "Rare earth concentrate",
            "NdPr oxide",
            "NdPr metal",
            "NdFeB magnets",
        ],
        url: "https://mpmaterials.com/",
    },
    {
        id: "china-northern-rare-earth",
        name: "China Northern Rare Earth",
        localName: "北方稀土",
        hqCountry: "CN",
        stages: ["separation", "metal-alloy"],
        segment: "ree-mining-refining",
        ownership: { kind: "listed", ticker: "SHA: 600111", parent: "Baotou Steel" },
        revenue: {
            value: 5.9e9,
            unit: "USD",
            range: [5.8e9, 6.0e9],
            sources: ["smm-northern-re-2025"],
            asOf: "2025",
            confidence: "estimated",
            note: "Converted from CNY 42.563 bn operating revenue at roughly 7.1 to 7.3 CNY per USD.",
        },
        products: ["Rare earth oxides", "Rare earth metals", "Magnetic materials"],
        url: "https://www.reht.com/",
    },
    {
        id: "china-rare-earth-group",
        name: "China Rare Earth Group",
        localName: "中国稀土集团",
        hqCountry: "CN",
        stages: ["mining", "separation", "metal-alloy"],
        segment: "ree-mining-refining",
        ownership: { kind: "state", parent: "SASAC" },
        products: ["Heavy rare earth oxides", "Rare earth metals"],
        url: "https://en.wikipedia.org/wiki/China_Rare_Earth_Group",
    },
    {
        id: "shenghe-resources",
        name: "Shenghe Resources",
        localName: "盛和资源",
        hqCountry: "CN",
        stages: ["mining", "separation", "metal-alloy"],
        segment: "ree-mining-refining",
        ownership: { kind: "listed", ticker: "SHA: 600392" },
        products: ["Rare earth concentrate processing", "Rare earth oxides and metals"],
        url: "https://en.wikipedia.org/wiki/Shenghe_Resources",
    },
    // Magnets and motors
    {
        id: "shin-etsu-chemical",
        name: "Shin-Etsu Chemical",
        localName: "信越化学工業",
        hqCountry: "JP",
        stages: ["separation", "metal-alloy", "magnet"],
        segment: "magnets-motors",
        ownership: { kind: "listed", ticker: "TYO: 4063" },
        products: ["Sintered NdFeB magnets", "Rare earth smelting"],
        url: "https://www.shinetsu.co.jp/en/",
    },
    {
        id: "jl-mag",
        name: "JL MAG Rare-Earth",
        localName: "金力永磁",
        hqCountry: "CN",
        stages: ["magnet"],
        segment: "magnets-motors",
        ownership: { kind: "listed", ticker: "SZSE: 300748; HKEX: 6680" },
        products: ["High-performance NdFeB magnets", "Magnet recycling"],
        url: "https://www.jlmag.com.cn/en/",
    },
    {
        id: "nidec",
        name: "Nidec",
        localName: "ニデック",
        hqCountry: "JP",
        stages: ["motor", "gearing"],
        segment: "magnets-motors",
        ownership: { kind: "listed", ticker: "TYO: 6594" },
        products: ["Precision motors", "Traction motors", "Reducers"],
        url: "https://www.nidec.com/en/",
    },
    // Gears, screws and bearings
    {
        id: "harmonic-drive-systems",
        name: "Harmonic Drive Systems",
        localName: "ハーモニック・ドライブ・システムズ",
        hqCountry: "JP",
        stages: ["gearing", "actuator"],
        segment: "gears-screws-bearings",
        ownership: { kind: "listed", ticker: "TYO: 6324" },
        revenue: {
            value: 365e6,
            unit: "USD",
            range: [355e6, 375e6],
            sources: ["filingreader-hds-fy2025"],
            asOf: "2025-03",
            confidence: "estimated",
            note: "Converted from JPY 55,645 m net sales (year to March 2025) at roughly 148 to 157 JPY per USD.",
        },
        products: ["Strain wave gears", "Planetary reducers", "Servo actuators"],
        url: "https://www.hds.co.jp/english/",
    },
    {
        id: "nabtesco",
        name: "Nabtesco",
        localName: "ナブテスコ",
        hqCountry: "JP",
        stages: ["gearing"],
        segment: "gears-screws-bearings",
        ownership: { kind: "listed", ticker: "TYO: 6268" },
        products: ["RV precision reduction gears"],
        url: "https://www.nabtesco.com/en/",
        sources: ["nabtesco-site"],
    },
    {
        id: "leaderdrive",
        name: "Leaderdrive",
        localName: "绿的谐波",
        hqCountry: "CN",
        stages: ["gearing", "actuator"],
        segment: "gears-screws-bearings",
        ownership: { kind: "listed", ticker: "SHA: 688017" },
        products: ["Harmonic reducers", "Mechatronic actuators"],
        url: "https://star.sse.com.cn/star/en/marketdata/snapshot/c/5545073.shtml",
    },
    {
        id: "timken",
        name: "Timken",
        hqCountry: "US",
        stages: ["bearing", "gearing"],
        segment: "gears-screws-bearings",
        ownership: { kind: "listed", ticker: "NYSE: TKR" },
        products: ["Tapered roller bearings", "Precision drives"],
        url: "https://www.timken.com/",
    },
    // Robot and actuator makers
    {
        id: "tesla",
        name: "Tesla",
        hqCountry: "US",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "NASDAQ: TSLA" },
        products: ["Optimus humanoid"],
        url: "https://www.tesla.com/",
    },
    {
        id: "boston-dynamics",
        name: "Boston Dynamics",
        hqCountry: "US",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "subsidiary", parent: "Hyundai Motor Group" },
        products: ["Atlas humanoid", "Spot quadruped", "Stretch"],
        url: "https://bostondynamics.com/",
    },
    {
        id: "hyundai-mobis",
        name: "Hyundai Mobis",
        localName: "현대모비스",
        hqCountry: "KR",
        stages: ["actuator"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "KRX: 012330" },
        products: ["Robot actuators", "Automotive modules"],
        url: "https://www.mobis.com/",
    },
    {
        id: "rainbow-robotics",
        name: "Rainbow Robotics",
        localName: "레인보우로보틱스",
        hqCountry: "KR",
        stages: ["actuator", "robot"],
        segment: "robot-actuator-oem",
        ownership: {
            kind: "subsidiary",
            ticker: "KOSDAQ: 277810",
            parent: "Samsung Electronics",
        },
        products: ["Collaborative arms", "Bimanual mobile robots"],
        url: "https://www.rainbow-robotics.com/",
        sources: ["samsung-rainbow-2024"],
    },
    {
        id: "fanuc",
        name: "FANUC",
        localName: "ファナック",
        hqCountry: "JP",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "TYO: 6954" },
        products: ["Industrial robots", "CNC systems"],
        url: "https://www.fanuc.co.jp/en/",
    },
    {
        id: "yaskawa",
        name: "Yaskawa Electric",
        localName: "安川電機",
        hqCountry: "JP",
        stages: ["motor", "robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "TYO: 6506" },
        products: ["Motoman robots", "Servo motors"],
        url: "https://www.yaskawa-global.com/",
    },
    {
        id: "unitree",
        name: "Unitree Robotics",
        localName: "宇树科技",
        hqCountry: "CN",
        stages: ["motor", "actuator", "robot"],
        segment: "robot-actuator-oem",
        products: ["Quadrupeds", "Humanoids", "Joint motors"],
        url: "https://www.unitree.com/",
    },
    {
        id: "ubtech",
        name: "UBTech Robotics",
        localName: "优必选",
        hqCountry: "CN",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "HKEX: 9880" },
        products: ["Walker humanoids"],
        url: "https://www.ubtrobot.com/",
    },
    {
        id: "agibot",
        name: "AgiBot",
        localName: "智元机器人",
        hqCountry: "CN",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        products: ["Humanoids"],
        url: "https://www.agibot.com/",
    },
    {
        id: "tuopu-group",
        name: "Ningbo Tuopu Group",
        localName: "拓普集团",
        hqCountry: "CN",
        stages: ["actuator"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "SHA: 601689" },
        products: ["Automotive chassis parts", "Robot actuators"],
        url: "https://www.tuopu.com/",
    },
];
