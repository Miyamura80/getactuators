import type { CountryContent } from "./types";

// /japan: stage shares and the named clusters the map zooms to. Cluster
// boxes are plain geography ([minLat, minLon, maxLat, maxLon]).

export const JAPAN_PAGE: CountryContent = {
    code: "JP",
    name: "Japan",
    lede: "Japan mines no rare earths, makes a small share of the world's magnets and most of its precision robot gears.",
    stages: [
        {
            stage: "mining",
            of: "world rare earth mine output",
            share: {
                value: 0,
                unit: "fraction",
                sources: ["usgs-mcs-2026-ree"],
                asOf: "2025",
                confidence: "modeled",
                note: "USGS lists no rare earth mine production in Japan.",
            },
        },
        {
            stage: "separation",
            of: "world rare earth separation",
            gap: {
                text: "Shin-Etsu separates rare earths at Echizen and plans a heavy rare earth refinery in Fukui; no source gives Japan's share.",
                sources: ["nippon-shinetsu-2026"],
            },
        },
        {
            stage: "magnet",
            of: "world NdFeB magnet output",
            share: {
                value: 0.05,
                unit: "fraction",
                sources: ["rem-shin-etsu-2026"],
                asOf: "2024",
                confidence: "estimated",
                note: "Second after China, about 5% of world sintered magnet output, citing IEA figures.",
            },
        },
        {
            stage: "gearing",
            of: "world robot reducer market",
            gap: {
                text: "Nabtesco alone held an estimated 58% of the world robot reducer market in 2019, and Harmonic Drive Systems and other Japanese makers add more; that is a company share, and no source gives Japan's combined share.",
                sources: ["researchandmarkets-reducers-2020"],
            },
        },
        {
            stage: "robot",
            of: "world industrial robot production",
            share: {
                value: 0.38,
                unit: "fraction",
                sources: ["ifr-japan-2024"],
                asOf: "2023",
                confidence: "reported",
            },
        },
    ],
    clusters: [
        {
            id: "nagano-precision",
            label: "Nagano precision belt",
            bbox: [35.4, 137.7, 36.6, 138.55],
            blurb: "Strain wave gears, servo motors, encoders and SCARA robots in the valleys from Azumino and Suwa to Ueda and Iida.",
        },
        {
            id: "kitakyushu-robotics",
            label: "Kitakyushu robotics base",
            bbox: [33.6, 130.7, 34.0, 131.1],
            blurb: "Yaskawa's home: robot and servo motor plants around Kitakyushu.",
        },
        {
            id: "chubu-automotive",
            label: "Chubu automotive belt",
            bbox: [34.6, 136.4, 35.6, 137.9],
            blurb: "Toyota's home region, from Mie to Hamamatsu: magnets, bearings, reducers and robot makers.",
        },
        {
            id: "kanto-hq",
            label: "Kanto HQ cluster",
            bbox: [35.3, 139.3, 36.5, 140.2],
            blurb: "Head offices in Tokyo plus magnet, bearing, pneumatics and robot plants across the plain.",
        },
    ],
};
