import type { Confidence } from "../sourced";

// Links that touch the /us companies: oxides to magnet makers, magnets to
// carmakers, humanoids to the factories that run them, and the equity and
// joint ventures behind the new US plants. Many are memoranda or early
// agreements; `confidence` and the note say so. Structural copy of
// SupplyLink: importing it from ../links would make an import cycle, since
// ../links spreads this list.

interface UsLink {
    from: string;
    to: string;
    what: string;
    sources: string[];
    confidence: Confidence;
    note?: string;
    ended?: string;
    kind?: "investment" | "partnership";
}

const supply = (
    from: string,
    to: string,
    what: string,
    sources: string[],
    note?: string,
    confidence: Confidence = "reported",
): UsLink => ({ from, to, what, sources, confidence, ...(note ? { note } : {}) });

const tie = (
    kind: "investment" | "partnership",
    from: string,
    to: string,
    what: string,
    sources: string[],
    note?: string,
): UsLink => ({
    from,
    to,
    what,
    sources,
    confidence: "reported",
    kind,
    ...(note ? { note } : {}),
});

export const US_LINKS: UsLink[] = [
    // Ore, oxides and metals
    supply(
        "reelement",
        "vulcan-elements",
        "Separated rare earth oxides (long-term supply agreement)",
        ["nasdaq-reelement-vulcan-2025", "dow-osc-vulcan-2025"],
    ),
    supply(
        "energy-fuels",
        "posco-international",
        "NdPr oxide for traction motor magnet qualification",
        ["ef-posco-2025"],
        "Binding only for the sample shipment and testing; a long-term supply deal awaits definitive agreements.",
    ),
    supply(
        "asm",
        "usa-rare-earth",
        "NdFeB alloy for Stillwater (five-year framework, about 60% of demand)",
        ["amr-asm-usar-2025"],
    ),
    supply(
        "less-common-metals",
        "arnold-magnetic",
        "Rare earth metals and samarium (multi-year agreement)",
        ["fastmarkets-arnold-lcm-2025"],
    ),
    supply("solvay", "arnold-magnetic", "Samarium oxide (multi-year agreement)", [
        "fastmarkets-arnold-lcm-2025",
    ]),
    supply(
        "meteoric-resources",
        "ucore",
        "Mixed rare earth carbonate from Caldeira, Brazil (MOU)",
        ["newsfile-ucore-meteoric-2024"],
        "Non-binding memorandum; Caldeira is not yet in production.",
        "estimated",
    ),
    // Magnets
    supply(
        "mp-materials",
        "general-motors",
        "NdFeB alloy and magnets for EV motors (long-term agreement)",
        ["mp-gm-2021", "mp-10k-2025"],
    ),
    supply(
        "arnold-magnetic",
        "usa-rare-earth",
        "Processed NdFeB feedstock and finished magnets (mutual sales and distribution agreement)",
        ["barchart-usar-arnold-2026"],
        "Two-way: USA Rare Earth also resells Arnold's SmCo and NdFeB magnets.",
    ),
    {
        ...supply(
            "vac",
            "general-motors",
            "NdFeB magnets for EV motors from Sumter (long-term agreement)",
            ["electrive-gm-vac-2026"],
            "GM terminated the agreement on 1 July 2026; the termination is in arbitration.",
        ),
        ended: "2026-07",
    },
    // Robots to the factories that run them
    supply(
        "figure",
        "bmw-group",
        "Figure 02 humanoids on the X3 line at Plant Spartanburg",
        ["bmw-figure-2024", "iiot-figure-bmw-2026"],
        "Figure reports an 11-month deployment; it has begun retiring Figure 02 for Figure 03.",
    ),
    supply(
        "agility",
        "schaeffler",
        "Digit humanoids for Schaeffler plants (robots as a service)",
        ["agility-schaeffler-2024"],
    ),
    supply(
        "agility",
        "toyota-motor",
        "Digit humanoids at Toyota Motor Manufacturing Canada (robots as a service)",
        ["agility-toyota-2026"],
    ),
    supply("jabil", "apptronik", "Contract manufacturing of Apollo humanoids", [
        "bw-apptronik-jabil-2025",
    ]),
    supply(
        "apptronik",
        "mercedes-benz",
        "Apollo humanoids for factory trials in Berlin and Kecskemet",
        ["autocar-mercedes-apptronik"],
    ),
    // Equity
    tie(
        "investment",
        "energy-fuels",
        "vac",
        "Agreed acquisition of VAC for about $1.9 bn in cash and shares",
        ["ef-10q-q3-2026", "engnews-ef-vac-2026"],
        "Signed June 2026, amended October 2026; closing expected in early 2027.",
    ),
    tie(
        "investment",
        "energy-fuels",
        "asm",
        "Agreed acquisition of Australian Strategic Materials",
        ["engnews-ef-vac-2026"],
        "Announced with the VAC deal; pending.",
    ),
    tie(
        "investment",
        "usa-rare-earth",
        "less-common-metals",
        "Acquisition of Less Common Metals (November 2025)",
        ["fastmarkets-arnold-lcm-2025"],
    ),
    tie(
        "investment",
        "bmw-group",
        "phoenix-tailings",
        "Series B equity (BMW i Ventures)",
        ["miningcom-phoenix-bmw-2024"],
    ),
    tie(
        "investment",
        "yamaha-motor",
        "phoenix-tailings",
        "Series B equity (Yamaha Motor Ventures)",
        ["miningcom-phoenix-bmw-2024"],
    ),
    tie(
        "investment",
        "bmw-group",
        "cyclic-materials",
        "Series A lead and Series B equity (BMW i Ventures)",
        ["electrive-cyclic-2024"],
    ),
    tie(
        "investment",
        "stellantis",
        "niron-magnetics",
        "Equity and commercial partnership on rare-earth-free magnets",
        ["people-businesswire-niron-sartell-2025"],
    ),
    tie(
        "investment",
        "magna",
        "niron-magnetics",
        "Equity and commercial partnership",
        ["people-businesswire-niron-sartell-2025"],
        "Named among Niron's investors and commercial partners at the Sartell groundbreaking.",
    ),
    tie(
        "investment",
        "allison-transmission",
        "niron-magnetics",
        "Equity and commercial partnership",
        ["people-businesswire-niron-sartell-2025"],
        "Named among Niron's investors and commercial partners at the Sartell groundbreaking.",
    ),
    tie("investment", "schaeffler", "agility", "Minority equity stake", [
        "agility-schaeffler-2024",
    ]),
    tie("investment", "mercedes-benz", "apptronik", "Series A equity", [
        "sc247-apptronik-2025",
    ]),
    // Joint ventures and partnerships
    tie(
        "partnership",
        "lynas",
        "noveon-magnetics",
        "Oxides to magnets collaboration (MOU)",
        ["noveon-lynas-2025"],
        "Non-binding; the parties aim for a definitive agreement.",
    ),
    tie(
        "partnership",
        "aclara-resources",
        "vac",
        "Planned supply of Dy and Tb oxides to e-VAC's Sumter plant",
        ["chemeng-aclara-2025"],
    ),
    tie(
        "partnership",
        "mp-materials",
        "maaden",
        "Saudi rare earth refinery joint venture (with the US Department of War)",
        ["mp-maaden-2025"],
        "MP and the Department of War target 49%, Maaden at least 51%; definitive agreements pending.",
    ),
    tie(
        "partnership",
        "sumitomo-corp",
        "ucore",
        "Feedstock sourcing and offtake framework for the Louisiana complex",
        ["miningcom-ucore-sumitomo-2026"],
        "Strategic cooperation framework signed June 2026; not an offtake contract.",
    ),
    tie(
        "partnership",
        "persona-ai",
        "hd-hyundai",
        "Humanoid welding robots for shipyards",
        ["adnkronos-hdhyundai-persona-2025"],
    ),
];
