import type { ChinaLink } from "./china-more-links";

// Links for the third /china batch (#80): contract builds and factory
// deployments of Chinese humanoids, Tuopu's actuator customers, corporate
// stakes in Unitree and Galbot, and SKF and Minth teaming up with
// Leaderdrive. Spread into CHINA_LINKS (./china-links). Trials and
// framework agreements are partnerships, not supply.

const TUOPU_RESULTS = ["gasgoo-tuopu-2025-results"];
const TIER1 = ["gasgoo-tier1-robotics-2026"];

// A customer named once, in Gasgoo's summary of Tuopu's 2025 annual report.
const tuopu = (to: string): ChinaLink => ({
    from: "tuopu-group",
    to,
    what: "Robot actuators and structural parts",
    sources: TUOPU_RESULTS,
    confidence: "estimated",
    note: "Named in March 2026 as one of more than a dozen robot makers whose supply chain Tuopu has entered; one source, no volumes.",
});

export const CHINA_EXTRA_LINKS: ChinaLink[] = [
    // Robots built for or used by others
    {
        from: "ly-itech",
        to: "agibot",
        what: "Contract manufacturing and final assembly of humanoid robots",
        sources: ["gasgoo-lyitech-agibot-2026"],
        confidence: "reported",
        note: "Strategic deal in 2023, ODM framework in 2024 and a joint venture in 2025, when LY iTech delivered over 5,000 robots and parts to AgiBot.",
    },
    {
        from: "galbot",
        to: "catl",
        what: "Galbot S1 humanoids on module and battery pack lines",
        sources: ["gasgoo-galbot-catl-2026", "cnevpost-catl-galbot-2026"],
        confidence: "reported",
        note: "Working at the Ningde HX base since March 2026; a wider partnership was signed that June.",
    },
    {
        from: "ubtech",
        to: "faw-volkswagen",
        what: "Humanoid robots for logistics and smart manufacturing",
        kind: "partnership",
        sources: ["gasgoo-ubtech-fawvw-2026", "ran-ubtech-walker-s2-2025"],
        confidence: "reported",
        note: "Strategic partnership signed in October 2026; UBTech had named FAW-Volkswagen Qingdao as a partner in November 2025.",
    },
    tuopu("xpeng"),
    tuopu("ubtech"),
    // Equity
    {
        from: "geely",
        to: "unitree",
        what: "Equity stake",
        kind: "investment",
        sources: ["gasgoo-unitree-ipo-2026"],
        confidence: "reported",
        note: "Listed among Unitree's corporate shareholders in its 2026 IPO prospectus; the size of the stake is not given.",
    },
    {
        from: "catl",
        to: "galbot",
        what: "Equity stake (lead investor in a 1.1 billion yuan round)",
        kind: "investment",
        sources: ["36kr-galbot-catl-2025", "cnevpost-catl-galbot-2026"],
        confidence: "reported",
        note: "CATL co-led the June 2025 round with its own fund; Galbot is the only embodied-AI company CATL has invested in.",
    },
    {
        from: "skf",
        to: "leaderdrive",
        what: "Joint venture for robot joint transmission parts (SKF 60%)",
        kind: "investment",
        sources: ["gasgoo-skf-leaderdrive-2026"],
        confidence: "reported",
        note: "Signed on 2 July 2026; the venture is to be based in China and start operating by the end of 2026.",
    },
    {
        from: "minth",
        to: "leaderdrive",
        what: "Planned joint venture for humanoid joint modules in North America",
        kind: "partnership",
        sources: TIER1,
        confidence: "reported",
        note: "Reported as a plan in March 2026; one source.",
    },
    {
        from: "minth",
        to: "agibot",
        what: "Exterior parts, wireless charging, joint assemblies and flexible manufacturing",
        kind: "partnership",
        sources: ["minth-annual-report-2025", ...TIER1],
        confidence: "reported",
        note: "Strategic cooperation agreement, named in Minth's 2025 annual report.",
    },
];
