import type { Confidence } from "../sourced";
import { CHINA_EXTRA_LINKS } from "./china-extra-links";
import { CHINA_MORE_LINKS } from "./china-more-links";

// Links that touch the /china companies: ore to separator, magnets to
// carmakers and appliance makers, reported Optimus parts, and the equity
// behind China's robot joint ventures. Structural copy of SupplyLink:
// importing it from ../links would make an import cycle, since ../links
// spreads this list.

interface ChinaLink {
    from: string;
    to: string;
    what: string;
    sources: string[];
    confidence: Confidence;
    note?: string;
    kind?: "investment" | "partnership";
}

// Optimus parts named by one analyst report; Tesla has confirmed none.
const optimus = (from: string, what: string): ChinaLink => ({
    from,
    to: "tesla",
    what,
    sources: ["counterpoint-optimus-2026"],
    confidence: "estimated",
    note: "Named by Counterpoint Research as an Optimus supplier; Tesla has not confirmed it.",
});

// JL MAG's named downstream customers in its 2021 results.
const jlMag = (to: string, what: string): ChinaLink => ({
    from: "jl-mag",
    to,
    what,
    sources: ["jlmag-results-2021"],
    confidence: "reported",
});

export const CHINA_LINKS: ChinaLink[] = [
    // Ore and magnets
    {
        from: "baotou-steel",
        to: "china-northern-rare-earth",
        what: "Bayan Obo rare earth concentrate (related-party contract)",
        sources: ["asianmetal-baotou-steel-concentrate", "yicai-baotou-northern-price"],
        confidence: "reported",
        note: "Both are controlled by Baotou Iron and Steel Group; the price is reset under a related-party mechanism.",
    },
    {
        ...jlMag("tesla", "NdFeB magnets"),
        sources: ["jlmag-results-2021", "yicai-jlmag-tesla"],
    },
    jlMag("midea", "NdFeB magnets for inverter air conditioners"),
    jlMag("mitsubishi-electric", "NdFeB magnets for inverter air conditioners"),
    // Robot parts
    {
        from: "shuanghuan-driveline",
        to: "efort",
        what: "Robot joint reducers (10,000-set order)",
        sources: ["yicai-shuanghuan-efort"],
        confidence: "reported",
        note: "Order announced in 2019; no later volume is public.",
    },
    {
        from: "inspire-robots",
        to: "unitree",
        what: "Dexterous hands fitted to the H2 humanoid",
        sources: ["robotshop-inspire-h2"],
        confidence: "estimated",
        note: "Inferred from Inspire hands sold as replacement parts made for the Unitree H2.",
    },
    optimus("sanhua", "Finished actuator modules"),
    optimus("zhaowei", "Planetary gearboxes for the hand's coreless motors"),
    optimus("moons", "Coreless motors"),
    optimus("leaderdrive", "Harmonic reducers for rotary actuators"),
    optimus("shuanghuan-driveline", "RV reducers for rotary actuators"),
    {
        from: "joyson",
        to: "tesla",
        what: "Optimus parts after supplier audits",
        sources: ["cnevpost-optimus-audits-2026"],
        confidence: "estimated",
        note: "Supplier audits reported by Chinese media; Tesla has not confirmed.",
    },
    // Ownership and joint ventures
    {
        from: "proterial",
        to: "zhong-ke-san-huan",
        what: "Nantong NdFeB magnet joint venture (Hitachi Metals 51%, San Huan 49%)",
        kind: "investment",
        sources: ["smm-zksh-hitachi-jv"],
        confidence: "reported",
    },
    {
        from: "china-rare-earth-group",
        to: "zhong-ke-san-huan",
        what: "Ganzhou magnet joint venture (San Huan 66%, Southern Rare Earth 34%)",
        kind: "investment",
        sources: ["smm-zksh-southern-jv"],
        confidence: "estimated",
        note: "The partner was China Southern Rare Earth, since folded into China Rare Earth Group.",
    },
    {
        from: "midea",
        to: "kuka",
        what: "Ownership of KUKA",
        kind: "investment",
        sources: ["robohub-midea-kuka"],
        confidence: "reported",
    },
    {
        from: "midea",
        to: "yaskawa",
        what: "Industrial and service robot joint ventures in Guangdong (2015)",
        kind: "partnership",
        sources: ["therobotreport-yaskawa-midea"],
        confidence: "reported",
        note: "Yaskawa holds 51% of the industrial robot venture, Midea 60.1% of the service robot one.",
    },
    {
        from: "shanghai-electric",
        to: "fanuc",
        what: "50% of the Shanghai Fanuc robot joint venture",
        kind: "investment",
        sources: ["yicai-shanghai-electric-fanuc"],
        confidence: "reported",
        note: "Announced in 2024 for CNY 3.08 billion; sources differ on the resulting ownership split.",
    },
    {
        from: "wolong-electric",
        to: "agibot",
        what: "Strategic equity stake",
        kind: "investment",
        sources: ["smm-wolong-robots-2026"],
        confidence: "estimated",
        note: "Reported as a strategic investment; the size of the stake is not public.",
    },
    ...CHINA_MORE_LINKS,
    ...CHINA_EXTRA_LINKS,
];
