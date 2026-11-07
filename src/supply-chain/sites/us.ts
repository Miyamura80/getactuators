import { type Site, hq } from "./types";

// Headquarters, offices and R&D sites of the /us companies, pinned to their
// city ("city" means the city centre, not the gate). Plants, mines and
// refineries are in ./us-plants.

type City = [admin1: string, lat: number, lon: number];

const head = (
    id: string,
    companyId: string,
    name: string,
    [admin1, lat, lon]: City,
    sources: string[],
    extra: Partial<Site> = {},
): Site => ({
    ...hq(id, { companyId, name, country: "US", admin1, lat, lon, sources }),
    ...extra,
});

// An R&D or training site, operating unless `extra` says otherwise.
const lab = (
    id: string,
    companyId: string,
    name: string,
    [admin1, lat, lon]: City,
    sources: string[],
    extra: Partial<Site> = {},
): Site => ({
    id,
    companyId,
    kind: "rnd",
    name,
    country: "US",
    admin1,
    lat,
    lon,
    precision: "city",
    stages: ["robot"],
    status: "operating",
    sources,
    ...extra,
});

const LAKEWOOD: City = ["Colorado", 39.705, -105.081];
const FISHERS: City = ["Indiana", 39.956, -86.014];
const SIERRA_BLANCA: City = ["Texas", 31.174, -105.357];
const DURHAM: City = ["North Carolina", 35.994, -78.899];
const ROCHESTER_NY: City = ["New York", 43.157, -77.615];
const MILWAUKEE: City = ["Wisconsin", 43.039, -87.906];
const AMHERST_NY: City = ["New York", 42.978, -78.8];
const DETROIT: City = ["Michigan", 42.331, -83.046];
const ST_LOUIS: City = ["Missouri", 38.627, -90.199];
const SOUTH_SF: City = ["California", 37.654, -122.408];
const LONG_BEACH: City = ["California", 33.77, -118.194];
const OXFORD_CT: City = ["Connecticut", 41.434, -73.117];
const EAST_AURORA: City = ["New York", 42.768, -78.613];
export const FORT_MILL: City = ["South Carolina", 35.007, -80.945];
const SAN_JOSE: City = ["California", 37.338, -121.886];
const AUSTIN: City = ["Texas", 30.267, -97.743];
const HOUSTON: City = ["Texas", 29.76, -95.37];
const SAN_FRANCISCO: City = ["California", 37.775, -122.419];
const MARTINEZ: City = ["California", 38.019, -122.134];
const SALT_LAKE_CITY: City = ["Utah", 40.761, -111.891];
const NORTH_READING: City = ["Massachusetts", 42.575, -71.079];
const ROCHESTER_HILLS: City = ["Michigan", 42.658, -83.15];
const WAUKEGAN: City = ["Illinois", 42.364, -87.845];
const SHELBY_TWP: City = ["Michigan", 42.671, -83.033];
export const WIXOM: City = ["Michigan", 42.525, -83.536];
const FARMINGTON_HILLS: City = ["Michigan", 42.485, -83.377];
const ANN_ARBOR: City = ["Michigan", 42.281, -83.743];
const SCHAUMBURG: City = ["Illinois", 42.033, -88.083];
const CARSON: City = ["California", 33.831, -118.282];
const PLEASANTON: City = ["California", 37.662, -121.875];
const LOS_ALTOS: City = ["California", 37.385, -122.114];
const CAMBRIDGE_MA: City = ["Massachusetts", 42.373, -71.11];
export const ELLABELL: City = ["Georgia", 32.13, -81.47];
export const RADFORD: City = ["Virginia", 37.132, -80.576];

export const US_SITES: Site[] = [
    // Rare earth mining and refining
    head(
        "energy-fuels-lakewood",
        "energy-fuels",
        "Energy Fuels headquarters",
        LAKEWOOD,
        ["people-northernminer-energy-fuels-ree"],
    ),
    head(
        "reelement-fishers",
        "reelement",
        "ReElement Technologies headquarters",
        FISHERS,
        ["ibj-reelement-marion"],
    ),
    head(
        "tmrc-sierra-blanca",
        "texas-mineral-resources",
        "Texas Mineral Resources headquarters",
        SIERRA_BLANCA,
        ["barchart-tmrc-round-top-2022"],
    ),
    // Magnets and motors
    head("vulcan-durham", "vulcan-elements", "Vulcan Elements headquarters", DURHAM, [
        "axios-vulcan-2025",
    ]),
    head(
        "arnold-rochester",
        "arnold-magnetic",
        "Arnold headquarters and SmCo works",
        ROCHESTER_NY,
        ["arnold-smco-usa", "arnold-about"],
        { makes: ["Samarium cobalt magnets", "Magnet assemblies"], stages: ["magnet"] },
    ),
    head("regal-milwaukee", "regal-rexnord", "Regal Rexnord headquarters", MILWAUKEE, [
        "rrx-hq-2023",
    ]),
    head(
        "allient-amherst",
        "allient",
        "Allient headquarters and plant",
        AMHERST_NY,
        ["allient-10k-2025"],
        { makes: ["Motion control products"], stages: ["motor"] },
    ),
    head(
        "gm-detroit",
        "general-motors",
        "General Motors headquarters (Hudson's Detroit)",
        DETROIT,
        ["gm-hq-2024"],
    ),
    head(
        "nidec-motor-st-louis",
        "nidec",
        "Nidec Motor Corporation headquarters",
        ST_LOUIS,
        ["nidec-motor-outline"],
    ),
    head("westmag-ssf", "westmag", "Westmag headquarters", SOUTH_SF, [
        "bw-westmag-2026",
    ]),
    head(
        "atlas-motion-long-beach",
        "atlas-motion",
        "Atlas Motion headquarters",
        LONG_BEACH,
        ["finsmes-atlas-motion-2026"],
    ),
    // Gears, screws and bearings
    head("rbc-oxford", "rbc-bearings", "RBC Bearings headquarters", OXFORD_CT, [
        "rbc-10k-fy2026",
    ]),
    head("moog-east-aurora", "moog", "Moog headquarters", EAST_AURORA, [
        "moog-annual-2025",
    ]),
    head(
        "schaeffler-fort-mill",
        "schaeffler",
        "Schaeffler Group USA headquarters",
        FORT_MILL,
        ["areadev-schaeffler-sc-2015"],
    ),
    head(
        "nabtesco-farmington-hills",
        "nabtesco",
        "Nabtesco Motion Control (North America)",
        FARMINGTON_HILLS,
        ["designnews-nabtesco-mc"],
    ),
    head("nsk-ann-arbor", "nsk", "NSK Americas headquarters", ANN_ARBOR, [
        "nsk-americas-capabilities",
    ]),
    head("thk-schaumburg", "thk", "THK America headquarters", SCHAUMBURG, [
        "designnews-thk-america",
    ]),
    head(
        "thomson-radford",
        "regal-rexnord",
        "Thomson Industries headquarters",
        RADFORD,
        ["designnews-thomson"],
    ),
    // Robot and actuator makers
    head(
        "figure-botq",
        "figure",
        "Figure BotQ factory",
        SAN_JOSE,
        ["robotreport-botq-2025", "people-wiki-figure-ai"],
        {
            kind: "plant",
            makes: ["Humanoid robots"],
            stages: ["robot"],
            capacity: {
                value: 12000,
                unit: "robots/yr",
                sources: ["robotreport-botq-2025"],
                asOf: "2025-03",
                confidence: "reported",
                note: "Design capacity of BotQ's first line, as announced.",
            },
        },
    ),
    head("apptronik-austin", "apptronik", "Apptronik headquarters", AUSTIN, [
        "people-dallas-innovates-apptronik-2026",
    ]),
    head("persona-houston", "persona-ai", "Persona AI headquarters", HOUSTON, [
        "kyodo-persona-2025",
    ]),
    head("foundation-sf", "foundation", "Foundation headquarters", SAN_FRANCISCO, [
        "ie-foundation-2025",
    ]),
    head(
        "hello-robot-martinez",
        "hello-robot",
        "Hello Robot headquarters and assembly",
        MARTINEZ,
        ["techcrunch-hello-robot-2026"],
        { makes: ["Stretch robots"], stages: ["robot"] },
    ),
    head("palladyne-slc", "palladyne-ai", "Palladyne AI headquarters", SALT_LAKE_CITY, [
        "palladyne-contact",
    ]),
    head("teradyne-north-reading", "teradyne", "Teradyne headquarters", NORTH_READING, [
        "globaldata-teradyne",
    ]),
    head(
        "rockwell-milwaukee",
        "rockwell",
        "Rockwell Automation headquarters",
        MILWAUKEE,
        ["rok-10k-2024"],
    ),
    head(
        "fanuc-rochester-hills",
        "fanuc",
        "FANUC America headquarters",
        ROCHESTER_HILLS,
        ["controlcom-fanuc-yaskawa-2025"],
    ),
    head("yaskawa-waukegan", "yaskawa", "Yaskawa America headquarters", WAUKEGAN, [
        "mfgdive-yaskawa-franklin-2025",
    ]),
    head(
        "kuka-shelby",
        "kuka",
        "KUKA Robotics North American headquarters",
        SHELBY_TWP,
        ["bw-kuka-shelby-2011"],
        {
            opened: {
                value: 2011,
                unit: "year",
                sources: ["bw-kuka-shelby-2011"],
                asOf: "2011",
                confidence: "reported",
            },
        },
    ),
    head(
        "kawasaki-wixom",
        "kawasaki-heavy",
        "Kawasaki Robotics (USA) headquarters",
        WIXOM,
        ["kawasaki-kri"],
    ),
    head("epson-carson", "seiko-epson", "Epson Robots (US)", CARSON, [
        "machinetools-epson-robots",
    ]),
    head(
        "omron-pleasanton",
        "omron",
        "Omron robotics and safety headquarters",
        PLEASANTON,
        ["automationmag-omron-pleasanton-2020"],
        {
            opened: {
                value: 2020,
                unit: "year",
                sources: ["automationmag-omron-pleasanton-2020"],
                asOf: "2020",
                confidence: "reported",
            },
        },
    ),
    lab(
        "tri-los-altos",
        "toyota-motor",
        "Toyota Research Institute, Los Altos",
        LOS_ALTOS,
        ["tri-bd-partnership-2024"],
    ),
    lab(
        "tri-cambridge",
        "toyota-motor",
        "Toyota Research Institute, Cambridge",
        CAMBRIDGE_MA,
        ["tri-bd-partnership-2024"],
    ),
    lab(
        "bd-metaplant-center",
        "boston-dynamics",
        "Robotics Metaplant Application Center",
        ELLABELL,
        ["justauto-bd-metaplant-2026"],
        {
            opened: {
                value: 2026,
                unit: "year",
                sources: ["justauto-bd-metaplant-2026"],
                asOf: "2026-09",
                confidence: "reported",
            },
        },
    ),
];

// Headquarters of the partners abroad that /us links reach and that have no
// other site in the registry, so their arcs can be drawn, plus two US
// headquarters of partners. Sources are the profile or registry entry that
// names the city.
const abroad = (
    companyId: string,
    name: string,
    country: Site["country"],
    admin1: string,
    lat: number,
    lon: number,
    sources: string[],
): Site =>
    hq(`${companyId}-hq`, {
        companyId,
        name: `${name} headquarters`,
        country,
        admin1,
        lat,
        lon,
        sources,
    });

export const US_PARTNER_SITES: Site[] = [
    head(
        "jabil-st-petersburg",
        "jabil",
        "Jabil headquarters",
        ["Florida", 27.768, -82.64],
        ["wikipedia-jabil"],
    ),
    head(
        "allison-indianapolis",
        "allison-transmission",
        "Allison Transmission headquarters",
        ["Indiana", 39.768, -86.158],
        ["purdue-allison"],
    ),
    abroad("magna", "Magna International", "CA", "Ontario", 44.007, -79.45, [
        "cbinsights-allison-magna",
    ]),
    abroad("less-common-metals", "Less Common Metals", "GB", "Cheshire", 53.28, -2.9, [
        "companies-house-lcm",
    ]),
    abroad("solvay", "Solvay", "BE", "Brussels", 50.85, 4.35, ["solvay-hq-brussels"]),
    abroad("maaden", "Maaden", "SA", "Riyadh", 24.71, 46.68, ["wikipedia-maaden"]),
    abroad(
        "meteoric-resources",
        "Meteoric Resources",
        "AU",
        "Western Australia",
        -31.948,
        115.842,
        ["marketscreener-meteoric-office"],
    ),
    abroad("sumitomo-corp", "Sumitomo Corporation", "JP", "Tokyo", 35.687, 139.766, [
        "sumitomocorp-profile",
    ]),
    abroad(
        "posco-international",
        "POSCO International",
        "KR",
        "Incheon",
        37.456,
        126.705,
        ["cbinsights-posco-international"],
    ),
    abroad("hd-hyundai", "HD Hyundai", "KR", "Gyeonggi", 37.4, 127.11, [
        "koreatimes-hd-hyundai-hq-2023",
    ]),
    abroad(
        "mercedes-benz",
        "Mercedes-Benz Group",
        "DE",
        "Baden-Wurttemberg",
        48.78,
        9.18,
        ["komo-mercedes-benz"],
    ),
    abroad("stellantis", "Stellantis", "NL", "North Holland", 52.3, 4.69, [
        "wikiwand-stellantis",
    ]),
];
