import type { SourceReuse } from "../reuse";

// Sources behind the legged-robot makers batch (./legged and the product
// lines added to Boston Dynamics, Rainbow Robotics, Deep Robotics, Xiaomi
// and Kawasaki). The pages could not be opened when the batch was built
// (fetches were blocked), so the facts come from search result summaries
// and no source carries an `accessed` date. All are copyrighted pages we
// take single facts from.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind = "press" | "company-site" | "reference";

interface LeggedSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: SourceReuse;
}

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "press",
): LeggedSource {
    return { id, publisher, title, url, kind, reuse: "facts" };
}

export const LEGGED_SOURCES: LeggedSource[] = [
    // Ghost Robotics and LIG Nex1
    src(
        "trr-lig-ghost-2024",
        "The Robot Report",
        "LIG Nex1 takes controlling shares of Ghost Robotics for $240M",
        "https://www.therobotreport.com/lig-nex1-takes-controlling-shares-of-ghost-robotics-for-240m/",
    ),
    src(
        "prn-ghost-lig-close-2024",
        "PR Newswire",
        "Ghost Robotics Corporation and LIG Nex1 announce close of acquisition",
        "https://www.prnewswire.com/news-releases/ghost-robotics-corporation-and-lig-nex1-announce-close-of-acquisition-302208083.html",
    ),
    src(
        "trr-ghost-arm-2025",
        "The Robot Report",
        "Ghost Robotics releases manipulator arm for Vision 60 quadruped",
        "https://www.therobotreport.com/ghost-robotics-releases-manipulator-arm-for-vision-60-quadruped/",
    ),
    src(
        "wiki-lig-nex1",
        "Wikipedia",
        "LIG Nex1",
        "https://en.wikipedia.org/wiki/LIG_Nex1",
        "reference",
    ),
    // ANYbotics
    src(
        "siliconcanals-anybotics",
        "Silicon Canals",
        "Zurich-based ANYbotics bags EUR 57.1M to develop autonomous robots for industrial inspections",
        "https://siliconcanals.com/swiss-based-anybotics-bags-e57-1m/",
    ),
    src(
        "venturelab-anybotics-2025",
        "Venturelab",
        "EUR 127 million for ANYbotics four-legged robot workforce",
        "https://www.venturelab.swiss/EUR-127-million-for-ANYbotics-fourlegged-robot-workforce",
    ),
    // Product lines of makers already in the registry
    src(
        "deeprobotics-site",
        "DEEP Robotics",
        "DEEP Robotics (quadrupeds, humanoids and joint modules)",
        "https://www.deeprobotics.cn/en",
        "company-site",
    ),
    src(
        "deeprobotics-x30-2023",
        "DEEP Robotics",
        "DEEP Robotics showcases new X30 quadruped robot at GITEX GLOBAL 2023",
        "https://deeprobotics.cn/en/index/article/id/36.html",
        "company-site",
    ),
    src(
        "engadget-cyberone-2022",
        "Engadget",
        "Xiaomi's CyberOne humanoid robot",
        "https://www.engadget.com/xiaomi-cyberone-robot-143545207.html",
    ),
    src(
        "techxplore-bex-2022",
        "TechXplore",
        "Kawasaki's Bex quadruped robot can carry a person",
        "https://techxplore.com/news/2022-03-bex-quadruped-robot-person.html",
    ),
    src(
        "prn-rainbow-rby1-2024",
        "PR Newswire (via GuruFocus)",
        "Rainbow Robotics begins preorders of bimanual mobile manipulator RB-Y1",
        "https://m.gurufocus.com/news/2431350/rainbow-robotics-begins-preorders-of-bimanual-mobile-manipulator-rby1-the-worlds-first-research-platform-for-ai-experts-for-80000-usd",
    ),
    src(
        "prn-rainbow-icra-2024",
        "PR Newswire (via GuruFocus)",
        "Rainbow Robotics at ICRA 2024: RB-Y1 debuts overseas, with the RBQ-10 quadruped",
        "https://m.gurufocus.com/news/2429087/rainbow-robotics-participates-in-icra-2024-in-yokohama-japan-bimanual-mobile-manipulator-rby1-debuts-overseas",
    ),
];
