import type { SourceId } from "../sourced";

// How a magnet-metal price is made, left to right. Most rare earths have no
// deep futures market: producers and buyers settle private contracts and
// price reporting agencies publish assessments of them.

export interface PriceStep {
    id: string;
    label: string;
    detail: string;
    sources: SourceId[];
}

export const PRICE_CHAIN: PriceStep[] = [
    {
        id: "quotas",
        label: "State quotas",
        detail: "China's industry ministry sets yearly mining and smelting quotas.",
        sources: ["usgs-mcs-2021-ree", "asianmetal-ree-quota-2024-2"],
    },
    {
        id: "producers",
        label: "Two state groups",
        detail: "China Rare Earth Group and China Northern Rare Earth run China's sector.",
        sources: ["nus-eai-rare-earths-2025"],
    },
    {
        id: "contracts",
        label: "Private contracts",
        detail: "Buyer and seller settle the price; the public sees it only approximately.",
        sources: ["arnold-dysprosium-2015"],
    },
    {
        id: "reporters",
        label: "Price reporters",
        detail: "SMM, Asian Metal, Argus and Fastmarkets publish assessments, mostly paywalled.",
        sources: [
            "rem-nd-price-2026",
            "usgs-mcs-2026-ree-heavy",
            "fastmarkets-ree-quota-2024-1",
        ],
    },
    {
        id: "buyers",
        label: "Two prices",
        detail: "Magnet makers in China pay the domestic price; buyers abroad pay FOB China, more.",
        sources: ["rem-tb-price-2026"],
    },
    {
        id: "floors",
        label: "Floors",
        detail: "Governments set floors and stockpile: the US floor under MP's NdPr.",
        sources: ["mp-dod-partnership-2025"],
    },
];
