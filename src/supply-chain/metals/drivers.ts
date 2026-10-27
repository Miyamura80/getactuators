import type { SourceId } from "../sourced";

// What moves magnet-metal prices: one card per driver with the direction it
// pushes and a cited example. "up" raises prices, "down" lowers them,
// "floor" puts a minimum under them.

export type DriverDirection = "up" | "down" | "floor";

export interface PriceDriver {
    id: string;
    title: string;
    direction: DriverDirection;
    example: string;
    sources: SourceId[];
    // Where substitution is covered, once that page exists.
    link?: string;
}

export const PRICE_DRIVERS: PriceDriver[] = [
    {
        id: "quotas",
        title: "Mining quotas",
        direction: "up",
        example:
            "China's ministry sets yearly mining and smelting quotas: 140,000 t REO for 2020, of which 19,150 t from ion-adsorption clays.",
        sources: ["usgs-mcs-2021-ree"],
    },
    {
        id: "export-controls",
        title: "Export controls",
        direction: "up",
        example:
            "Licences for Dy, Tb and Sm from April 2025 cut magnet exports by over 70%, disrupting car and defence plants.",
        sources: ["nus-eai-rare-earths-2025", "usgs-mcs-2026-ree"],
    },
    {
        id: "ev",
        title: "EV traction motors",
        direction: "up",
        example:
            "About 1.5 kg of NdFeB per electric car on average, up to 4 kg in some models.",
        sources: ["thundersaid-ev-magnets"],
    },
    {
        id: "wind",
        title: "Wind turbines",
        direction: "up",
        example: "Direct-drive offshore turbines use about 500 kg of NdFeB per MW.",
        sources: ["arnold-dysprosium-2015"],
    },
    {
        id: "robots",
        title: "Robots (projected)",
        direction: "up",
        example:
            "2 to 4.5 kg of NdFeB per humanoid; UBS projects 86 million humanoids by 2050, about $7 billion a year of extra rare earth demand.",
        sources: ["fai-robot-magnets", "nus-eai-rare-earths-2025"],
    },
    {
        id: "myanmar",
        title: "Myanmar supply",
        direction: "up",
        example:
            "Myanmar's output, all processed in China, fell from 27,000 t to 22,000 t REO between 2024 and 2025.",
        sources: ["usgs-mcs-2026-ree", "nus-eai-rare-earths-2025"],
    },
    {
        id: "floors",
        title: "Stockpiles and price floors",
        direction: "floor",
        example:
            "A $110/kg US floor under MP Materials' NdPr from July 2025; the US stockpile planned to buy 300 t of NdPr oxide and 450 t of NdFeB block in FY 2025.",
        sources: ["mp-dod-partnership-2025", "usgs-mcs-2026-ree"],
    },
    {
        id: "recycling",
        title: "Recycling and less Dy",
        direction: "down",
        example:
            "Grain boundary diffusion cut Dy in SH magnets from over 4% to about 2%, and in the hottest grades from 8 to 11% to 4 to 5%.",
        sources: ["arnold-dysprosium-2015"],
        link: "/alts",
    },
];
