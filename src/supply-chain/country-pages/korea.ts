import type { CountryContent } from "./types";

// /korea: stage shares and the named clusters the map zooms to. Cluster
// boxes are plain geography ([minLat, minLon, maxLat, maxLon]).

export const KOREA_PAGE: CountryContent = {
    code: "KR",
    name: "South Korea",
    lede: "South Korea mines no rare earths and makes few magnets, but it is a top-four robot market whose conglomerates now buy rare earths abroad and back humanoid makers at home and in the US.",
    // Issue #81 sets Korea's gate below the pilot's: 30 companies, 50 sites
    // and 20 links, at least 10 of them supply.
    gate: { companies: 30, sites: 50, links: 20, supplyLinks: 10 },
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
                note: "USGS lists no rare earth mine production in South Korea.",
            },
        },
        {
            stage: "separation",
            of: "world rare earth separation",
            gap: {
                text: "POSCO International buys separated oxides from ReElement in the US and is building a joint separation and magnet venture there; no source gives Korea's separation share.",
                sources: [
                    "metaltechnews-reelement-posco-2025",
                    "nasdaq-reelement-posco-jv-2026",
                ],
            },
        },
        {
            stage: "metal-alloy",
            of: "world rare earth metal and alloy output",
            gap: {
                text: "ASM's Korean Metals Plant at Ochang makes NdPr metal and about 1,300 t a year of NdFeB alloy; no source gives Korea's share.",
                sources: ["placera-energy-fuels-asm-2026"],
            },
        },
        {
            stage: "magnet",
            of: "world NdFeB magnet output",
            gap: {
                text: "Star Group Industrial is described as Korea's only maker of rare earth permanent magnets; no source gives Korea's share.",
                sources: ["kedglobal-posco-magnets-2024"],
            },
        },
        {
            stage: "gearing",
            of: "world robot reducer market",
            gap: {
                text: "SPG and SBB Tech make robot reducers in Korea and are scaling up for humanoids; no source gives Korea's share.",
                sources: ["asiae-spg-rainbow-2026", "asiae-sbb-ipo-2022"],
            },
        },
        {
            stage: "robot",
            of: "world industrial robot installations",
            share: {
                value: 0.056,
                unit: "fraction",
                sources: ["ifr-world-robotics-2025"],
                asOf: "2024",
                confidence: "modeled",
                note: "Computed as Korea's 30,600 installations over the world's 542,076 in 2024, both from IFR World Robotics 2025; Korea ranked fourth.",
            },
        },
    ],
    clusters: [
        {
            id: "daejeon-sejong",
            label: "Daejeon and Sejong",
            bbox: [36.25, 127.1, 36.65, 127.5],
            blurb: "Rainbow Robotics' Daejeon home and new Sejong plant, near Samsung Electro-Mechanics' Sejong works.",
        },
        {
            id: "changwon-machinery",
            label: "Changwon machinery cluster",
            bbox: [35.15, 128.55, 35.32, 128.78],
            blurb: "Servo motors, actuators, reducers and bearings: HIGEN RNM, Samhyun, Woorim PTS, NSK, Schaeffler and LG's actuator line.",
        },
        {
            id: "daegu-motion",
            label: "Daegu motion-parts belt",
            bbox: [35.6, 128.35, 36.05, 129.0],
            blurb: "HD Hyundai Robotics' robot factory, Samick THK's linear guide plants and Star Group's magnet works around Daegu and Yeongcheon.",
        },
        {
            id: "ulsan-automotive",
            label: "Ulsan industrial coast",
            bbox: [35.35, 129.15, 35.65, 129.45],
            blurb: "Hyundai Motor's main car plant and Korea Zinc's Onsan smelter.",
        },
        {
            id: "seoul-gyeonggi-hq",
            label: "Seoul and Gyeonggi HQ cluster",
            bbox: [37.2, 126.6, 37.75, 127.2],
            blurb: "Head offices and labs from Incheon to Pangyo and Suwon: Samsung, LG, Hyundai, Doosan, Naver and the cobot makers.",
        },
    ],
};
