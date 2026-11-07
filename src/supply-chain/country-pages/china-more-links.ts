import type { Confidence } from "../sourced";

// Links for the second /china batch (#80): cobots and humanoids sold to or
// trialled at carmakers, carmaker and Xiaomi stakes in robot firms,
// Schaeffler's Chinese robot partners and Shenghe's purchase of Neo's
// separation units. Spread into CHINA_LINKS (./china-links). Trials and
// framework agreements are partnerships, not supply.

// Structural copy of SupplyLink, as in ./china-links (import cycle).
interface ChinaLink {
    from: string;
    to: string;
    what: string;
    sources: string[];
    confidence: Confidence;
    note?: string;
    kind?: "investment" | "partnership";
}

const UBTECH_FACTORIES = ["chinadaily-ubtech-factories-2025"];

export const CHINA_MORE_LINKS: ChinaLink[] = [
    // Robots to carmakers
    {
        from: "aubo",
        to: "byd",
        what: "Collaborative robots (renewed order for 7,500 units)",
        sources: ["chinadaily-aubo-zibo-2023"],
        confidence: "reported",
        note: "Order renewed in January 2023; deliveries are not reported.",
    },
    {
        from: "ubtech",
        to: "dongfeng-liuzhou",
        what: "Walker S humanoids (planned purchase of 20 units)",
        sources: UBTECH_FACTORIES,
        confidence: "reported",
        note: "Announced in March 2025 with delivery planned for the first half of that year.",
    },
    {
        from: "ubtech",
        to: "byd",
        what: "Walker S1 humanoid training on EV assembly lines",
        kind: "partnership",
        sources: UBTECH_FACTORIES,
        confidence: "reported",
    },
    {
        from: "ubtech",
        to: "geely",
        what: "Walker S humanoid trials at Geely and Zeekr factories",
        kind: "partnership",
        sources: ["cnevpost-zeekr-ubtech-2024", ...UBTECH_FACTORIES],
        confidence: "reported",
    },
    {
        from: "jaka",
        to: "toyota-motor",
        what: "Collaborative robots",
        sources: ["jaka-cobots-2026"],
        confidence: "estimated",
        note: "JAKA names Toyota as a customer on its own site; Toyota has not said so.",
    },
    // Robot parts and robots to their users
    {
        from: "guohua",
        to: "xiaomi",
        what: "Upper-body, rotary and linear joint modules for Xiaomi's humanoid project",
        sources: ["36kr-guohua-2025"],
        confidence: "reported",
    },
    {
        from: "rokae",
        to: "schaeffler",
        what: "Light industrial robots",
        sources: ["yicai-rokae-2021"],
        confidence: "reported",
        note: "Schaeffler was named as a ROKAE client in 2021.",
    },
    {
        from: "rokae",
        to: "xiaomi",
        what: "Light industrial robots",
        sources: ["yicai-rokae-2021"],
        confidence: "reported",
        note: "Xiaomi was named as a ROKAE client in 2021.",
    },
    {
        from: "schaeffler",
        to: "rokae",
        what: "Co-development and supply of humanoid joint modules",
        kind: "partnership",
        sources: ["gasgoo-schaeffler-rokae-2026"],
        confidence: "reported",
        note: "Strategic cooperation agreement signed in April 2026.",
    },
    {
        from: "schaeffler",
        to: "leju",
        what: "Humanoid deployment, data training and component supply",
        kind: "partnership",
        sources: ["gasgoo-schaeffler-leju-2026"],
        confidence: "reported",
        note: "Signed in March 2026; Leju is Schaeffler's first embodied-AI partner in China.",
    },
    // Rare earths
    {
        from: "shenghe-resources",
        to: "neo-performance",
        what: "Heavy rare earth products from JAMR (Neo distributes them outside China)",
        sources: ["magneticsmag-neo-shenghe-2025"],
        confidence: "reported",
        note: "Exclusive distribution agreement with an initial term of five years.",
    },
    {
        from: "shenghe-resources",
        to: "neo-performance",
        what: "Purchase of 86% of JAMR and 88% of ZAMR, Neo's China separation units",
        kind: "investment",
        sources: ["magneticsmag-neo-shenghe-2025"],
        confidence: "reported",
        note: "Bought by a Shenghe affiliate in 2025; Neo kept 9% of JAMR and 10% of ZAMR.",
    },
    // Equity
    {
        from: "byd",
        to: "agibot",
        what: "Equity stake",
        kind: "investment",
        sources: ["gasgoo-schaeffler-leju-2026"],
        confidence: "reported",
        note: "Reported in passing; the size and date of the stake are not given.",
    },
    {
        from: "xiaomi",
        to: "guohua",
        what: "Equity stake (Xiaomi Industry Investment)",
        kind: "investment",
        sources: ["36kr-guohua-2025"],
        confidence: "reported",
        note: "Part of a round worth tens of millions of yuan in 2025.",
    },
    {
        from: "xpeng",
        to: "engineai",
        what: "Pre-A++ round led by XPeng-backed Rockets Capital",
        kind: "investment",
        sources: ["prn-engineai-2025"],
        confidence: "estimated",
        note: "The lead was a fund XPeng backs, not XPeng itself.",
    },
];
