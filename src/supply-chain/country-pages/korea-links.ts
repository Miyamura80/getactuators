import type { Confidence } from "../sourced";

// Supply links that touch Korean companies: rare earths and magnets bought
// abroad, motor cores and reducers sold to robot and car makers, and the
// stakes Korean groups hold in robot makers. Structural copy of SupplyLink:
// importing it from ../links would make an import cycle, since ../links
// spreads this list.

interface KoreaLink {
    from: string;
    to: string;
    what: string;
    sources: string[];
    confidence: Confidence;
    note?: string;
    kind?: "investment" | "partnership";
}

export const KOREA_LINKS: KoreaLink[] = [
    // Rare earths and magnets into Korean groups
    {
        from: "reelement",
        to: "posco-international",
        what: "Separated rare earth oxides (NdPr, Dy, Tb, Y) under a long-term offtake",
        sources: ["metaltechnews-reelement-posco-2025"],
        confidence: "reported",
        note: "Signed September 2025 with POSCO International America; volumes are planned to pass 3,000 t a year by 2030.",
    },
    {
        from: "posco-international",
        to: "reelement",
        what: "Majority stake in a US$200 m rare earth and magnet joint venture",
        kind: "investment",
        sources: ["nasdaq-reelement-posco-jv-2026"],
        confidence: "reported",
        note: "Signed May 2026; POSCO leads the venture and ReElement supplies the separation technology. Site not yet chosen.",
    },
    {
        from: "star-group",
        to: "posco-international",
        what: "NdFeB magnets for POSCO International's carmaker supply contracts",
        sources: ["kedglobal-posco-magnets-2024", "kedglobal-posco-star-2023"],
        confidence: "reported",
        note: "Star Group makes the magnets and POSCO International sells them, under about 1.16 trillion won of deals signed in 2024 with a North American and a European carmaker.",
    },
    {
        from: "arafura",
        to: "hyundai-motor",
        what: "NdPr oxide or metal from Nolans (binding offtake with Hyundai and Kia)",
        sources: ["kitco-arafura-hyundai-2022"],
        confidence: "reported",
        note: "Seven-year deal signed November 2022, 600 t in year one rising to 1,500 t; deliveries wait on Nolans production.",
    },
    {
        from: "lynas",
        to: "ls-eco-energy",
        what: "Rare earth oxides for LS Eco Energy's metal plant in Vietnam",
        sources: ["miningweekly-lynas-ls-2026"],
        confidence: "estimated",
        note: "Framework agreement of March 2026; definitive contracts are still to be negotiated.",
    },
    {
        from: "asm",
        to: "noveon-magnetics",
        what: "NdFeB alloy from the Korean Metals Plant (100 t agreement)",
        sources: ["miningweekly-asm-noveon-2023"],
        confidence: "reported",
    },
    {
        from: "komir",
        to: "arafura",
        what: "Cooperation on rare earth supply to Korea",
        kind: "partnership",
        sources: ["gmr-arafura-komir-2022"],
        confidence: "reported",
    },
    {
        from: "komir",
        to: "asm",
        what: "Cooperation on rare earth and critical metal use in Korea",
        kind: "partnership",
        sources: ["metalpowder-asm-komir"],
        confidence: "reported",
    },
    // Motors, cores and electronics
    {
        from: "posco-international",
        to: "hyundai-motor",
        what: "EV drive motor cores for Hyundai and Kia",
        sources: ["kedglobal-posco-cores-hyundai-2024", "posco-newsroom-motor-cores"],
        confidence: "reported",
        note: "Orders include 1.68 m cores for the group's European EVs and 2.72 m for Metaplant America.",
    },
    {
        from: "snt-motiv",
        to: "hyundai-motor",
        what: "Hybrid and EV traction motors",
        sources: ["marklines-snt-motiv"],
        confidence: "reported",
    },
    {
        from: "lg-innotek",
        to: "boston-dynamics",
        what: "Vision sensing and camera modules for the Atlas humanoid",
        sources: ["bd-lg-innotek-2025", "daum-lg-innotek-robots-2026"],
        confidence: "estimated",
        note: "The two agreed in 2025 to co-develop Atlas's vision module; a March 2026 press report says shipments have started, which neither company has confirmed.",
    },
    // Gears and reducers
    {
        from: "spg",
        to: "rainbow-robotics",
        what: "Precision reducers for Rainbow's cobot, dual-arm and quadruped robots",
        sources: ["asiae-spg-rainbow-2026"],
        confidence: "reported",
        note: "One report calls SPG the exclusive reducer supplier; no second source confirms exclusivity.",
    },
    {
        from: "woorim-pts",
        to: "boston-dynamics",
        what: "Precision robot reducers",
        sources: ["asiae-woorim-pts-2025"],
        confidence: "estimated",
        note: "Reported by one market column; neither company has confirmed it.",
    },
    // Stakes in robot makers
    {
        from: "hyundai-motor",
        to: "boston-dynamics",
        what: "Controlling stake of about 80%, held across Hyundai Motor Group",
        kind: "investment",
        sources: ["softbank-bd-2021"],
        confidence: "reported",
        note: "Closed June 2021; SoftBank kept about 20%.",
    },
    {
        from: "boston-dynamics",
        to: "hyundai-motor",
        what: "Atlas training centre inside Metaplant America ahead of deployment",
        kind: "partnership",
        sources: ["cbtnews-bd-training-center-2026", "ajc-metaplant-atlas-2026"],
        confidence: "reported",
        note: "Hyundai plans to deploy Atlas at Metaplant from 2028.",
    },
    {
        from: "samsung-electronics",
        to: "rainbow-robotics",
        what: "Largest shareholding",
        kind: "investment",
        sources: ["samsung-rainbow-2024"],
        confidence: "reported",
    },
    {
        from: "lg-electronics",
        to: "bear-robotics",
        what: "51% controlling stake",
        kind: "investment",
        sources: ["lg-bear-robotics-2025"],
        confidence: "reported",
        note: "Raised from 21% to 51% in January 2025.",
    },
    {
        from: "doosan-robotics",
        to: "onexia",
        what: "89.59% stake in the US robot integrator",
        kind: "investment",
        sources: ["koreaherald-doosan-onexia-2025"],
        confidence: "reported",
    },
    {
        from: "thk",
        to: "samick-thk",
        what: "Equity-method stake (33.34% in 2007)",
        kind: "investment",
        sources: ["thk-annual-report-2007"],
        confidence: "reported",
        note: "The latest share THK has published that we found; it may have changed.",
    },
];
