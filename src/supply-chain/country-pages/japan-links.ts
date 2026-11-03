import type { Confidence } from "../sourced";

// Supply links that touch Japanese companies: rare earth offtake and
// funding, magnet supply, gears for robot makers and robot arms for
// integrators. Structural copy of SupplyLink: importing it from ../links
// would make an import cycle, since ../links spreads this list.

interface JapanLink {
    from: string;
    to: string;
    what: string;
    sources: string[];
    confidence: Confidence;
    note?: string;
    kind?: "investment" | "partnership";
}

const LYNAS_2026 = ["miningweekly-lynas-japan-2026", "smm-lynas-jare-2026"];
const LYNAS_2023 = ["argus-lynas-japan-2023"];

// JARE buys for Japan's magnet makers, per one market analysis.
const viaJare = (to: string): JapanLink => ({
    from: "jare",
    to,
    what: "Lynas rare earth oxides bought on its behalf",
    sources: ["smm-lynas-jare-2026"],
    confidence: "estimated",
    note: "SMM describes JARE as the buying agent for Shin-Etsu, Proterial and TDK; the companies have not confirmed volumes.",
});

// Robot makers whose arms run on MujinController.
const mujinArm = (from: string, sources: string[]): JapanLink => ({
    from,
    to: "mujin",
    what: "Robot arms driven by MujinController in Mujin systems",
    kind: "partnership",
    sources,
    confidence: "reported",
});

// Nabtesco's main robot customers as named by the trade press.
const rvGears = (to: string): JapanLink => ({
    from: "nabtesco",
    to,
    what: "RV precision reduction gears",
    sources: ["technews-nabtesco-2018"],
    confidence: "reported",
});

export const JAPAN_LINKS: JapanLink[] = [
    // Rare earths into Japan
    {
        from: "lynas",
        to: "jare",
        what: "NdPr oxide (firm 5,000 t a year) and heavy rare earth oxides",
        sources: LYNAS_2026,
        confidence: "reported",
        note: "Agreement to 2038: up to 75% of Lynas heavy rare earth output is offered to Japan, with a US$110/kg NdPr floor.",
    },
    {
        from: "jare",
        to: "lynas",
        what: "Equity and loans",
        kind: "investment",
        sources: LYNAS_2023,
        confidence: "reported",
        note: "About A$200 million added in 2023 for heavy rare earth supply.",
    },
    {
        from: "jogmec",
        to: "jare",
        what: "Equity and loans (co-owner with Sojitz)",
        kind: "investment",
        sources: LYNAS_2023,
        confidence: "reported",
    },
    {
        from: "sojitz",
        to: "jare",
        what: "Equity and loans (co-owner with JOGMEC)",
        kind: "investment",
        sources: LYNAS_2023,
        confidence: "reported",
    },
    {
        from: "lynas",
        to: "sojitz",
        what: "Light and heavy rare earths sold in Japan",
        sources: ["kitco-sojitz-hree-2025", "miningweekly-lynas-japan-2026"],
        confidence: "reported",
        note: "Sojitz has distributed Lynas light rare earths in Japan since 2011 and began importing its heavy rare earths in October 2025.",
    },
    viaJare("shin-etsu-chemical"),
    viaJare("proterial"),
    viaJare("tdk"),
    {
        from: "caremag",
        to: "iwatani",
        what: "Dysprosium and terbium oxides (about half of output)",
        sources: ["argus-caremag-2025"],
        confidence: "reported",
        note: "Long-term offtake; deliveries expected from 2027.",
    },
    {
        from: "jogmec",
        to: "caremag",
        what: "Equity through Japan France Rare Earths",
        kind: "investment",
        sources: ["meti-caremag-2025", "argus-caremag-2025"],
        confidence: "reported",
    },
    {
        from: "iwatani",
        to: "caremag",
        what: "Equity through Japan France Rare Earths",
        kind: "investment",
        sources: ["argus-caremag-2025"],
        confidence: "reported",
    },
    {
        from: "irel",
        to: "toyota-tsusho",
        what: "Rare earth feed for Toyotsu Rare Earths India",
        sources: ["kitco-irel-japan-2025"],
        confidence: "reported",
        note: "Under a 2012 India-Japan agreement; India asked IREL to halt exports to Japan in June 2025.",
    },
    // Magnet materials and magnets
    {
        from: "resonac",
        to: "tdk",
        what: "Rare earth magnet alloys",
        sources: ["magneticsmag-tdk-showa"],
        confidence: "estimated",
        note: "TDK took over Showa Denko's magnet alloy R&D while Showa Denko (now Resonac) kept producing the alloys at Chichibu.",
    },
    {
        from: "neo-performance",
        to: "daido-steel",
        what: "Magnequench powder for hot-deformed NdFeB magnets",
        sources: ["techxplore-honda-magnet-2016", "mobilityeng-honda-magnet-2016"],
        confidence: "reported",
    },
    {
        from: "daido-steel",
        to: "honda",
        what: "Hot-deformed NdFeB magnets free of heavy rare earths, for hybrid motors",
        sources: ["justauto-honda-daido-2016"],
        confidence: "reported",
        note: "Made by Daido Electronics at Nakatsugawa since 2016.",
    },
    {
        from: "noveon-magnetics",
        to: "nidec",
        what: "Sintered NdFeB magnets made in the US (five-year offtake)",
        sources: ["noveon-nidec-2025"],
        confidence: "reported",
        note: "Signed in February 2025 with Nidec Motor Corporation; potential volume above 1,000 t.",
    },
    // Joints and robots
    {
        from: "tamagawa-seiki",
        to: "toyota-motor",
        what: "Torque servo modules for the T-HR3 humanoid (co-developed)",
        sources: ["toyota-thr3-2017"],
        confidence: "reported",
    },
    {
        from: "nidec",
        to: "toyota-motor",
        what: "Torque servo modules for the T-HR3 humanoid (Nidec Copal Electronics, co-developed)",
        sources: ["toyota-thr3-2017"],
        confidence: "reported",
    },
    rvGears("kawasaki-heavy"),
    rvGears("kuka"),
    rvGears("abb"),
    {
        from: "techman-robot",
        to: "omron",
        what: "TM-series collaborative robot arms sold under the OMRON brand",
        sources: ["omron-techman-2021"],
        confidence: "reported",
        note: "Alliance since 2018; OMRON agreed to take about 10% of Techman in 2021.",
    },
    {
        from: "toyota-motor",
        to: "boston-dynamics",
        what: "Large behaviour models for Atlas (Toyota Research Institute)",
        kind: "partnership",
        sources: ["toyota-tri-atlas-2025"],
        confidence: "reported",
        note: "A joint research partnership since October 2024, not a parts supply.",
    },
    mujinArm("yaskawa", ["mujin-prize-2020", "techcrunch-mujin-2023"]),
    mujinArm("fanuc", ["techcrunch-mujin-2023"]),
    mujinArm("kawasaki-heavy", ["mujin-prize-2020"]),
    mujinArm("mitsubishi-electric", ["mujin-prize-2020"]),
    mujinArm("nachi-fujikoshi", ["mujin-prize-2020"]),
];
