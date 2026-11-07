import type { Company } from "./types";

// The third /china batch (#80): companies that only appear as the other end
// of a new link or plant. A contract manufacturer that builds AgiBot's
// robots, a carmaker trialling UBTech's, a battery maker that backs and uses
// Galbot's, and a Taiwanese auto parts maker moving into joint modules.
// Spread into CHINA_COMPANIES (./china).

const OEM: Company["segment"] = "robot-actuator-oem";

const cn = (
    id: string,
    name: string,
    rest: Omit<Company, "id" | "name" | "segment" | "hqCountry">,
): Company => ({ id, name, segment: OEM, hqCountry: "CN", ...rest });

export const CHINA_EXTRA_COMPANIES: Company[] = [
    cn("ly-itech", "LY iTech", {
        stages: ["actuator", "robot"],
        products: [
            "Contract assembly of humanoid robots",
            "Dexterous hands, joint modules and limb assemblies",
            "Automotive and battery parts",
        ],
        url: "https://autonews.gasgoo.com/articles/news/partnering-with-agibot-ly-itech-rolls-off-200-general-purpose-humanoid-robots-for-delivery-2058923574767915009",
        sources: ["gasgoo-lyitech-agibot-2026"],
    }),
    // Group headquarters in Taipei; its Asia-Pacific headquarters is in Jiaxing.
    {
        ...cn("minth", "Minth Group", {
            stages: ["actuator"],
            ownership: { kind: "listed", ticker: "HKEX: 425" },
            products: [
                "Integrated joint modules",
                "Robot exterior parts",
                "Car body parts",
            ],
            url: "https://www.minthgroup.com/ENG/upload/files/2026/4/e_00425ar-20260429.pdf",
            sources: ["minth-annual-report-2025", "gasgoo-tier1-robotics-2026"],
        }),
        hqCountry: "TW",
    },
    cn("catl", "CATL", {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "HKEX: 3750" },
        products: [
            "Power and storage batteries",
            "Investor in and user of Galbot robots",
        ],
        url: "https://cnevpost.com/2026/06/24/catl-galbot-scale-humanoid-robots-battery-factories/",
        sources: ["cnevpost-catl-galbot-2026", "36kr-galbot-catl-2025"],
    }),
    cn("faw-volkswagen", "FAW-Volkswagen", {
        stages: ["robot"],
        products: [
            "Volkswagen, Audi and Jetta vehicles",
            "Partner for UBTech humanoids",
        ],
        url: "https://autonews.gasgoo.com/articles/news/ubtech-faw-volkswagen-partner-on-humanoid-robots-for-logistics-and-smart-manufacturing-2108068987505434624",
        sources: ["gasgoo-ubtech-fawvw-2026"],
    }),
];
