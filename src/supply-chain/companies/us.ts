import type { SourceId, Sourced } from "../sourced";
import type { Company } from "./types";

// Companies for /us: US-headquartered firms along the actuator chain, foreign
// firms with plants in the US (VAC's e-VAC, SKF's Kaydon, Ucore, Cyclic
// Materials, Aclara), and the foreign buyers, partners and investors that
// /us links reach. Records already in the registry (MP Materials, Timken,
// Tesla, Boston Dynamics, Noveon, Niron, Lynas, the Japanese drive and robot
// makers, BMW, Toyota, Yamaha, and from /korea ReElement, ASM, POSCO
// International, Hyundai Motor and Schaeffler) are reused, not repeated. Revenue is the latest fiscal year from results releases or
// filings, in USD as reported.

// A reported USD figure for one fiscal year.
function usd(
    value: number,
    asOf: string,
    sources: SourceId[],
    note?: string,
): Sourced<number> {
    return {
        value,
        unit: "USD",
        sources,
        asOf,
        confidence: "reported",
        ...(note ? { note } : {}),
    };
}

type Seg = Company["segment"];

// A company with the fields every record here shares.
function co(
    id: string,
    name: string,
    hqCountry: Company["hqCountry"],
    segment: Seg,
    rest: Omit<Company, "id" | "name" | "segment" | "hqCountry">,
): Company {
    return { id, name, hqCountry, segment, ...rest };
}

const REE: Seg = "ree-mining-refining";
const MAG: Seg = "magnets-motors";
const GEAR: Seg = "gears-screws-bearings";
const OEM: Seg = "robot-actuator-oem";

export const US_COMPANIES: Company[] = [
    // Rare earth mining and refining
    co("energy-fuels", "Energy Fuels", "US", REE, {
        stages: ["separation", "metal-alloy"],
        ownership: { kind: "listed", ticker: "NYSE American: UUUU" },
        revenue: usd(
            65.9e6,
            "2025",
            ["finviz-ef-results-2025"],
            "Mostly uranium and heavy mineral sands; no rare earth revenue in 2025.",
        ),
        products: ["Separated NdPr oxide", "Dysprosium and terbium oxides", "Uranium"],
        url: "https://www.energyfuels.com/",
        sources: ["people-northernminer-energy-fuels-ree", "ycharts-ef-heavy-ree-2026"],
    }),
    co("phoenix-tailings", "Phoenix Tailings", "US", REE, {
        stages: ["separation", "metal-alloy"],
        ownership: { kind: "private" },
        products: ["NdPr metal", "Dysprosium-iron alloy"],
        url: "https://www.businesswire.com/news/home/20251023800456/en/Phoenix-Tailings-Opens-Cutting-Edge-U.S.-Rare-Earth-Metallization-Facility-Entirely-Independent-From-China",
        sources: ["bw-phoenix-exeter-2025", "nhpr-phoenix-exeter-2025"],
    }),
    co("ramaco", "Ramaco Resources", "US", REE, {
        stages: ["mining"],
        ownership: { kind: "listed", ticker: "NASDAQ: METC" },
        products: [
            "Brook Mine rare earth and critical mineral ore",
            "Metallurgical coal",
        ],
        url: "https://www.e-mj.com/news/this-month-in-coal/ramaco-hosts-ribbon-cutting-ceremony-for-the-brook-mine/",
        sources: ["emj-ramaco-brook-2025", "wikipedia-brook-mine"],
    }),
    co("niocorp", "NioCorp Developments", "US", REE, {
        stages: ["mining", "separation"],
        ownership: { kind: "listed", ticker: "NASDAQ: NB" },
        products: [
            "Niobium, scandium and titanium (planned)",
            "Rare earth oxides (planned)",
        ],
        url: "https://www.niocorp.com/",
        sources: ["niocorp-10q-q3-2026"],
    }),
    co("rare-element-resources", "Rare Element Resources", "US", REE, {
        stages: ["mining", "separation"],
        ownership: { kind: "listed", ticker: "OTCQB: REEMF" },
        products: [
            "Bear Lodge rare earth project",
            "Separated NdPr oxide (demonstration)",
        ],
        url: "https://www.rareelementresources.com/",
        sources: ["nasdaq-rer-update-2025"],
    }),
    co("texas-mineral-resources", "Texas Mineral Resources", "US", REE, {
        stages: ["mining"],
        ownership: { kind: "listed", ticker: "OTCQB: TMRC" },
        products: ["20% of the Round Top rare earth project"],
        url: "https://www.barchart.com/story/news/8634791/texas-mineral-resources-joint-venture-partner-secures-first-domestic-rare-earth-metal-and-magnet-manufacturing-facility",
        sources: ["barchart-tmrc-round-top-2022"],
    }),
    co("ucore", "Ucore Rare Metals", "CA", REE, {
        stages: ["separation"],
        ownership: { kind: "listed", ticker: "TSXV: UCU" },
        products: ["Separated rare earth oxides (RapidSX, planned)"],
        url: "https://ucore.com/",
        sources: ["ucore-smc"],
    }),
    co("aclara-resources", "Aclara Resources", "CA", REE, {
        stages: ["mining", "separation"],
        ownership: { kind: "listed", ticker: "TSX: ARA" },
        products: [
            "Ionic clay heavy rare earths (Brazil, Chile)",
            "Dy and Tb oxides (planned)",
        ],
        url: "https://www.chemengonline.com/aclara-resources-unveils-plans-for-first-heavy-rare-earths-separation-plant-in-the-u-s",
        sources: ["chemeng-aclara-2025"],
    }),
    co("american-rare-earths", "American Rare Earths", "AU", REE, {
        stages: ["mining"],
        ownership: { kind: "listed", ticker: "ASX: ARR" },
        products: ["Halleck Creek rare earth project"],
        url: "https://www.proactiveinvestors.com.au/companies/news/1096333/american-rare-earths-advances-halleck-creek-feasibility-and-pilot-plant-plans-in-pivotal-june-quarter-1096333.html",
        sources: ["proactive-arr-halleck-2026"],
    }),
    co("cyclic-materials", "Cyclic Materials", "CA", REE, {
        stages: ["separation"],
        ownership: { kind: "private" },
        products: ["Recovered rare earth magnet material (Mag-Xtract)"],
        url: "https://www.manufacturingdive.com/news/rare-earth-recycler-cyclic-materials-opens-first-us-facility-mesa-arizona/830028/",
        sources: ["mfgdive-cyclic-mesa-2026", "electrive-cyclic-2024"],
    }),
    co("less-common-metals", "Less Common Metals", "GB", REE, {
        stages: ["metal-alloy"],
        ownership: { kind: "subsidiary", parent: "USA Rare Earth" },
        products: ["Rare earth metals and alloys"],
        url: "https://www.fastmarkets.com/insights/arnold-magnetic-samarium-oxide-supply-agreement-solvay-less-common-metals/",
        sources: ["fastmarkets-arnold-lcm-2025"],
    }),
    co("solvay", "Solvay", "BE", REE, {
        stages: ["separation"],
        ownership: { kind: "listed", ticker: "Euronext: SOLB" },
        products: ["Separated rare earth oxides"],
        url: "https://www.fastmarkets.com/insights/arnold-magnetic-samarium-oxide-supply-agreement-solvay-less-common-metals/",
        sources: ["fastmarkets-arnold-lcm-2025"],
    }),
    co("maaden", "Maaden", "SA", REE, {
        stages: ["mining"],
        ownership: { kind: "listed", ticker: "Tadawul: 1211" },
        products: ["Mining", "Rare earth refinery joint venture (planned)"],
        url: "https://mpmaterials.com/news/mp-materials-and-the-u-s-department-of-war-partner-with-the-saudi-arabian-mining-company-maaden-to-develop-rare-earth-refinery-joint-venture",
        sources: ["mp-maaden-2025"],
    }),
    co("meteoric-resources", "Meteoric Resources", "AU", REE, {
        stages: ["mining"],
        ownership: { kind: "listed", ticker: "ASX: MEI" },
        products: ["Caldeira ionic clay project (Brazil)"],
        url: "https://www.newsfilecorp.com/release/220620/Ucore-Rare-Metals-and-Meteoric-Resources-Sign-MOU-for-Offtake-of-Caldeira-Project-MREC-in-Brazil-to-USA-Oxide-Production-Project",
        sources: ["newsfile-ucore-meteoric-2024"],
    }),
    co("sumitomo-corp", "Sumitomo Corporation", "JP", REE, {
        stages: ["separation"],
        ownership: { kind: "listed", ticker: "TYO: 8053" },
        products: ["Rare earth feedstock sourcing and offtake"],
        url: "https://www.mining.com/?p=1208546",
        sources: ["miningcom-ucore-sumitomo-2026"],
    }),
    // Magnets and motors
    co("magna", "Magna International", "CA", MAG, {
        stages: ["motor"],
        ownership: { kind: "listed", ticker: "NYSE: MGA" },
        products: ["Electric drive systems"],
        url: "https://www.businesswire.com/news/home/20250929097968/en/Niron-Magnetics-Changes-Game-by-Breaking-Ground-on-Rare-Earth-Free-Magnet-Facility",
        sources: ["people-businesswire-niron-sartell-2025"],
    }),
    co("usa-rare-earth", "USA Rare Earth", "US", MAG, {
        stages: ["mining", "metal-alloy", "magnet"],
        ownership: { kind: "listed", ticker: "NASDAQ: USAR" },
        products: ["Sintered NdFeB magnets", "Round Top rare earth project"],
        url: "https://www.mining.com/usa-rare-earth-commissions-new-magnet-production-line-at-oklahoma-plant/",
        sources: ["usar-10q-q1-2026", "miningcom-usar-stillwater-2026"],
    }),
    co("vulcan-elements", "Vulcan Elements", "US", MAG, {
        stages: ["magnet"],
        ownership: { kind: "private" },
        products: ["Sintered NdFeB magnets"],
        url: "https://ncnewsline.com/2025/11/18/stein-announces-1b-rare-earth-magnet-plant-in-johnston-county/",
        sources: ["ncnewsline-vulcan-benson-2025", "axios-vulcan-2025"],
    }),
    co("arnold-magnetic", "Arnold Magnetic Technologies", "US", MAG, {
        stages: ["magnet"],
        ownership: { kind: "private" },
        products: [
            "Samarium cobalt magnets (RECOMA)",
            "Magnet assemblies",
            "Flexible magnets",
        ],
        url: "https://www.arnoldmagnetics.com/",
        sources: ["arnold-about", "arnold-smco-usa"],
    }),
    co("electron-energy", "Electron Energy Corporation", "US", MAG, {
        stages: ["metal-alloy", "magnet"],
        ownership: { kind: "subsidiary", parent: "Magnetic Holdings" },
        products: ["Samarium cobalt magnets", "SmCo alloys"],
        url: "https://www.electronenergy.com/",
        sources: ["eec-smco", "apex-eec-magnetic-holdings"],
    }),
    co("regal-rexnord", "Regal Rexnord", "US", MAG, {
        stages: ["motor", "screw", "bearing", "actuator"],
        ownership: { kind: "listed", ticker: "NYSE: RRX" },
        revenue: usd(5934.5e6, "2025", ["rrx-8k-q4-2025"]),
        products: [
            "Kollmorgen frameless servo motors",
            "Thomson linear actuators and ball screws",
            "Humanoid joint systems",
        ],
        url: "https://www.regalrexnord.com/",
        sources: ["kollmorgen-humanoid", "insidermonkey-rrx-q1-2025", "nook-about"],
    }),
    co("allient", "Allient", "US", MAG, {
        stages: ["motor", "actuator"],
        ownership: { kind: "listed", ticker: "NASDAQ: ALNT" },
        products: ["Precision motors and drives", "ThinGap frameless motor kits"],
        url: "https://allient.com/",
        sources: ["allient-10k-2025", "airframer-allied-thingap-2022"],
    }),
    co("general-motors", "General Motors", "US", MAG, {
        stages: ["motor"],
        ownership: { kind: "listed", ticker: "NYSE: GM" },
        products: ["EV traction motors"],
        url: "https://www.gm.com/",
        sources: ["mp-gm-2021"],
    }),
    co("westmag", "Westmag", "US", MAG, {
        stages: ["motor", "actuator"],
        ownership: { kind: "private" },
        products: ["Drone motors", "Robot actuators"],
        url: "https://www.westmag.com/",
        sources: ["bw-westmag-2026"],
    }),
    co("atlas-motion", "Atlas Motion", "US", MAG, {
        stages: ["motor"],
        ownership: { kind: "private" },
        products: ["Brushless motors"],
        url: "https://atlasmotion.com/",
        sources: ["finsmes-atlas-motion-2026"],
    }),
    co("mercedes-benz", "Mercedes-Benz", "DE", MAG, {
        stages: ["motor"],
        ownership: { kind: "listed", ticker: "XETRA: MBG" },
        products: ["Vehicles and EV motors"],
        url: "https://www.autocar.co.uk/car-news/technology/mercedes-benz-begins-using-ai-robotics-make-its-cars",
        sources: ["autocar-mercedes-apptronik"],
    }),
    co("stellantis", "Stellantis", "NL", MAG, {
        stages: ["motor"],
        ownership: { kind: "listed", ticker: "NYSE: STLA" },
        products: ["Vehicles and EV motors"],
        url: "https://www.businesswire.com/news/home/20250929097968/en/Niron-Magnetics-Changes-Game-by-Breaking-Ground-on-Rare-Earth-Free-Magnet-Facility",
        sources: ["people-businesswire-niron-sartell-2025"],
    }),
    // Gears, screws and bearings
    co("rbc-bearings", "RBC Bearings", "US", GEAR, {
        stages: ["bearing", "gearing"],
        ownership: { kind: "listed", ticker: "NYSE: RBC" },
        revenue: usd(
            1870.9e6,
            "2026-03",
            ["rbc-results-fy2026"],
            "Year to March 2026.",
        ),
        grossMargin: {
            value: 0.444,
            unit: "fraction",
            sources: ["rbc-results-fy2026"],
            asOf: "2026-03",
            confidence: "reported",
            note: "GAAP gross margin of $830.2 m on $1,870.9 m net sales, year to March 2026.",
        },
        products: ["Plain, roller and ball bearings", "Gearing"],
        url: "https://www.rbcbearings.com/",
        sources: ["rbc-10k-fy2026"],
    }),
    co("moog", "Moog", "US", GEAR, {
        stages: ["actuator", "motor"],
        ownership: { kind: "listed", ticker: "NYSE: MOG.A" },
        revenue: usd(
            3861e6,
            "2025-09",
            ["moog-annual-2025"],
            "Year to 27 September 2025.",
        ),
        products: ["Precision motion and actuation systems", "Slip rings and motors"],
        url: "https://www.moog.com/",
        sources: ["windsystems-moog-components"],
    }),
    co("curtiss-wright", "Curtiss-Wright", "US", GEAR, {
        stages: ["screw", "actuator"],
        ownership: { kind: "listed", ticker: "NYSE: CW" },
        products: ["Exlar roller screw linear actuators"],
        url: "https://directory.designnews.com/curtiss-wright-exlar-comp226777.html",
        sources: ["bw-cw-exlar-2023", "designnews-exlar"],
    }),
    co("allison-transmission", "Allison Transmission", "US", GEAR, {
        stages: ["gearing"],
        ownership: { kind: "listed", ticker: "NYSE: ALSN" },
        products: ["Transmissions", "Electric axles"],
        url: "https://www.businesswire.com/news/home/20250929097968/en/Niron-Magnetics-Changes-Game-by-Breaking-Ground-on-Rare-Earth-Free-Magnet-Facility",
        sources: ["people-businesswire-niron-sartell-2025"],
    }),
    co("skf", "SKF", "SE", GEAR, {
        stages: ["bearing"],
        ownership: { kind: "listed", ticker: "Nasdaq Stockholm: SKF B" },
        products: ["Kaydon thin-section bearings", "Rolling bearings"],
        url: "https://www.manufacturing.net/home/news/13772170/kaydon-corporation-kaydon-bearings-celebrates-75th-anniversary",
        sources: ["mfgnet-kaydon-75", "coolen-kaydon"],
    }),
    // Robot and actuator makers
    co("agility", "Agility Robotics", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "private" },
        products: ["Digit humanoid"],
        url: "https://www.agilityrobotics.com/",
        sources: ["people-osu-agility-2020", "newequipment-robofab"],
    }),
    co("apptronik", "Apptronik", "US", OEM, {
        stages: ["actuator", "robot"],
        ownership: { kind: "private" },
        products: ["Apollo humanoid"],
        url: "https://apptronik.com/",
        sources: ["people-dallas-innovates-apptronik-2026", "sc247-apptronik-2025"],
    }),
    co("1x", "1X Technologies", "NO", OEM, {
        stages: ["actuator", "robot"],
        ownership: { kind: "private" },
        products: ["NEO home humanoid"],
        url: "https://www.1x.tech/",
        sources: ["people-businesswire-1x-neo-2025", "robotreport-1x-hayward-2026"],
    }),
    co("persona-ai", "Persona AI", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "private" },
        products: ["Industrial humanoids for shipyards"],
        url: "https://www.personainc.ai/",
        sources: ["kyodo-persona-2025"],
    }),
    co("foundation", "Foundation", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "private" },
        products: ["Phantom MK-1 humanoid"],
        url: "https://interestingengineering.com/military/us-foundation-build-50000-humanoid-robots",
        sources: ["ie-foundation-2025"],
    }),
    co("hello-robot", "Hello Robot", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "private" },
        products: ["Stretch home mobile manipulator"],
        url: "https://hello-robot.com/",
        sources: ["techcrunch-hello-robot-2026"],
    }),
    co("palladyne-ai", "Palladyne AI", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "NASDAQ: PDYN" },
        products: ["AI software for industrial robots (formerly Sarcos)"],
        url: "https://www.palladyneai.com/",
        sources: ["palladyne-contact"],
    }),
    co("intuitive", "Intuitive Surgical", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "NASDAQ: ISRG" },
        revenue: usd(10.06e9, "2025", ["isrg-10k-2025"]),
        products: ["da Vinci surgical systems"],
        url: "https://investor.intuitivesurgical.com/",
        sources: ["isrg-10k-2025"],
    }),
    co("rockwell", "Rockwell Automation", "US", OEM, {
        stages: ["motor", "robot"],
        ownership: { kind: "listed", ticker: "NYSE: ROK" },
        products: ["Servo motors and drives", "Industrial automation"],
        url: "https://www.sec.gov/Archives/edgar/data/1024478/000102447824000107/rok-20240930.htm",
        sources: ["rok-10k-2024"],
    }),
    co("teradyne", "Teradyne", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "NASDAQ: TER" },
        revenue: usd(
            3.19e9,
            "2025",
            ["teradyne-results-2025"],
            "Group revenue; Robotics was $89 m of Q4.",
        ),
        products: ["Universal Robots cobots", "MiR mobile robots"],
        url: "https://investors.teradyne.com/",
        sources: ["ur-wixom-2026"],
    }),
    co("jabil", "Jabil", "US", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "NYSE: JBL" },
        products: ["Contract manufacturing", "Apollo humanoid production"],
        url: "https://www.businesswire.com/news/home/20250225753929/en/Apptronik-and-Jabil-Collaborate-to-Scale-Production-of-Apollo-Humanoid-Robots-and-Deploy-in-Manufacturing-Operations",
        sources: ["bw-apptronik-jabil-2025"],
    }),
    co("hd-hyundai", "HD Hyundai", "KR", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "KRX: 267250" },
        products: [
            "Shipbuilding",
            "Industrial and welding robots (HD Hyundai Robotics)",
        ],
        url: "https://www.adnkronos.com/immediapress/eng/hd-hyundai-and-persona-ai-sign-agreement-to-deploy-humanoid-welding-robots-for-shipbuilding-automation_1pcFbgO5KM5wmJA1eVSBCh",
        sources: ["adnkronos-hdhyundai-persona-2025"],
    }),
];

// Revenue for Timken, a seed-list record, from its 2025 results.
export const TIMKEN_REVENUE = usd(4581.8e6, "2025", ["timken-results-2025"]);
