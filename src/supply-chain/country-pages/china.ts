import type { CountryContent } from "./types";

// /china: stage shares and the named clusters the map zooms to. Shares reuse
// the /metals sources; cluster boxes are plain geography
// ([minLat, minLon, maxLat, maxLon]).

export const CHINA_PAGE: CountryContent = {
    code: "CN",
    name: "China",
    lede: "China mines most of the world's rare earths, refines and magnetises nearly all of them, and is building its own reducers, roller screws and humanoids.",
    stages: [
        {
            stage: "mining",
            of: "world rare earth mine output",
            share: {
                value: 0.69,
                unit: "fraction",
                sources: ["usgs-mcs-2026-ree"],
                asOf: "2025",
                confidence: "estimated",
                note: "Computed as 270,000 t of a 390,000 t world total (rare earth oxide).",
            },
        },
        {
            stage: "separation",
            of: "world refined rare earth output",
            share: {
                value: 0.91,
                unit: "fraction",
                sources: ["iea-rare-earths-2025"],
                asOf: "2024",
                confidence: "estimated",
                note: "IEA estimate of China's share of refined rare earth output.",
            },
        },
        {
            stage: "metal-alloy",
            of: "world rare earth metal and alloy output",
            share: {
                value: 0.9,
                unit: "fraction",
                sources: ["reuters-goldman-ndpr-2023"],
                asOf: "2023",
                confidence: "estimated",
                note: "Goldman Sachs puts China above 90% of metal and magnet output; 90% is a floor.",
            },
        },
        {
            stage: "magnet",
            of: "world sintered permanent magnet output",
            share: {
                value: 0.94,
                unit: "fraction",
                sources: ["iea-rare-earths-2025"],
                asOf: "2024",
                confidence: "estimated",
                note: "IEA estimate of China's share of sintered permanent magnet output.",
            },
        },
        {
            stage: "gearing",
            of: "world robot reducer market",
            gap: {
                text: "Leaderdrive and Laifual held about 27.5% and 21.4% of China's robot harmonic reducer shipments in 2025; those are shares of the Chinese market, and no source gives China's share of world reducer output.",
                sources: ["ipox-laifual-2026"],
            },
        },
    ],
    clusters: [
        {
            id: "baotou-ree",
            label: "Baotou rare earth hub",
            bbox: [40.4, 109.5, 42.0, 110.5],
            blurb: "The Bayan Obo mine, Northern Rare Earth's separation plants and a ring of new magnet plants around Baotou.",
        },
        {
            id: "ganzhou-ree",
            label: "Ganzhou heavy rare earth base",
            bbox: [25.5, 114.6, 26.1, 115.3],
            blurb: "Home of China Rare Earth Group and JL MAG: ionic-clay heavy rare earths and magnet plants in southern Jiangxi.",
        },
        {
            id: "ningbo-magnets",
            label: "Ningbo magnet and parts cluster",
            bbox: [29.6, 121.1, 30.4, 122.0],
            blurb: "Magnet plants (Yunsheng, JL MAG, San Huan), reducers in Cixi and Tesla's actuator suppliers Tuopu and Joyson.",
        },
        {
            id: "yangtze-delta",
            label: "Yangtze River Delta robotics belt",
            bbox: [30.0, 119.8, 32.2, 122.0],
            blurb: "Reducers, roller screws, motors and humanoid makers from Suzhou and Wuxi through Shanghai to Hangzhou.",
        },
        {
            id: "pearl-river-delta",
            label: "Shenzhen and Pearl River Delta robotics",
            bbox: [22.4, 112.9, 23.3, 114.3],
            blurb: "Servo and micro-drive makers, joint-module start-ups and humanoid makers in Shenzhen, Guangzhou and Foshan.",
        },
    ],
};
