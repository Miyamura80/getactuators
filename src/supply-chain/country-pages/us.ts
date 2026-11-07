import type { Shares } from "../concentration";
import { REE_MINING_2025 } from "../metals/stage-shares";
import type { Sourced } from "../sourced";
import type { CountryContent } from "./types";
import { US_HUBS, US_REGIONS } from "./us-regions";

// /us: stage shares and the named clusters the map zooms to. The mining
// share reuses the /metals source; later stages have no public US split, so
// they are gaps in words. Cluster boxes are plain geography
// ([minLat, minLon, maxLat, maxLon]).

// The US share of a /metals stage: US over the sum of the map, to two places.
// Computed here, so modeled whatever the inputs' confidence.
const usShare = (s: Sourced<Shares>, note: string): Sourced<number> => {
    const total = Object.values(s.value).reduce((a, b) => a + (b ?? 0), 0);
    return {
        value: Math.round(((s.value.US ?? 0) / total) * 100) / 100,
        unit: "fraction",
        sources: s.sources,
        asOf: s.asOf,
        confidence: "modeled",
        note,
    };
};

export const US_PAGE: CountryContent = {
    code: "US",
    name: "United States",
    lede: "The US mines about an eighth of the world's rare earths and is rebuilding separation and magnet plants with federal money, while most leading humanoid makers build their robots here.",
    stages: [
        {
            stage: "mining",
            of: "world rare earth mine output",
            share: usShare(
                REE_MINING_2025,
                "Computed as 51,000 t of a 390,000 t world total (rare earth oxide), nearly all from Mountain Pass.",
            ),
        },
        {
            stage: "separation",
            of: "world refined rare earth output",
            gap: {
                text: "MP Materials separates NdPr at Mountain Pass and Energy Fuels at the White Mesa Mill, which began heavy rare earth output in 2026; no source gives the US share of world refining.",
                sources: ["mp-10k-2025", "ycharts-ef-heavy-ree-2026"],
            },
        },
        {
            stage: "magnet",
            of: "world sintered permanent magnet output",
            gap: {
                text: "MP Materials, Noveon, e-VAC and USA Rare Earth now make sintered magnets in the US; the IEA puts everyone outside China at about 6% of world output and does not split out the US.",
                sources: ["iea-rare-earths-2025", "usar-10q-q1-2026"],
            },
        },
        {
            stage: "robot",
            of: "world humanoid robot output",
            gap: {
                text: "Tesla, Figure, Agility, Apptronik, 1X and Boston Dynamics build humanoids in the US, with announced lines from 10,000 to a million robots a year; none publishes output that would give a US share.",
                sources: ["robotreport-botq-2025", "notateslaapp-optimus-2026"],
            },
        },
    ],
    clusters: [
        {
            id: "texas-corridor",
            label: "Texas magnets and humanoids",
            bbox: [29.6, -98.2, 33.3, -96.8],
            blurb: "MP Materials' Fort Worth and Northlake magnet plants, Noveon in San Marcos, and Tesla's Optimus factory and Apptronik in Austin.",
        },
        {
            id: "bay-area-humanoids",
            label: "Bay Area humanoids",
            bbox: [37.2, -122.6, 38.1, -121.7],
            blurb: "Figure's BotQ, Tesla's Fremont Optimus line, 1X in Hayward and Intuitive in Sunnyvale, with motor start-ups and Omron nearby.",
        },
        {
            id: "boston-robotics",
            label: "Boston robotics",
            bbox: [42.2, -71.4, 43.1, -70.8],
            blurb: "Boston Dynamics, Harmonic Drive LLC, Teradyne, Toyota Research Institute and Phoenix Tailings' rare earth metal plants.",
        },
        {
            id: "detroit-robotics",
            label: "Detroit robot belt",
            bbox: [42.2, -83.8, 42.8, -82.9],
            blurb: "The North American bases of FANUC, ABB, KUKA, Kawasaki, Nabtesco and NSK, and Universal Robots' new Wixom hub.",
        },
        {
            id: "carolinas-magnets",
            label: "Carolinas magnets",
            bbox: [33.6, -82.4, 36.1, -78.4],
            blurb: "e-VAC's Sumter magnet plant, Vulcan's Benson factory, Schaeffler and Kaydon bearing plants and BMW Spartanburg.",
        },
        {
            id: "southwest-ree",
            label: "Southwest rare earths",
            bbox: [33.0, -116.0, 38.0, -109.0],
            blurb: "The Mountain Pass mine and separation plant, the White Mesa Mill in Utah and Cyclic Materials' recycling plant in Mesa.",
        },
    ],
    regions: US_REGIONS,
    hubs: US_HUBS,
};
