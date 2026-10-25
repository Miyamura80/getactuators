// Company and brand identity for logos: one entry per company the site names,
// keyed to its primary web domain (the logo provider's lookup key). A `null`
// domain is deliberate: the company has no verified site, so the UI draws a
// monogram instead of guessing. Shared by the browser (CompanyLogo) and tests.
//
// Verification (Oct 2026): domains were checked by web search; these were also
// confirmed as the company's own domain by Logo.dev brand search: robstride.com,
// allient.com, iflight.com, nidec.com, hiwonder.com, menlo.ai, menlovc.com,
// unitzero.ai, i2rt.com, mindrobotics.com, proception.ai, minervahumanoids.com,
// theker.ai, pollen-robotics.com. Every domain returns a Logo.dev logo except lkmotor.cn (LKMTech),
// which renders as a monogram.

import { canonicalBrand } from "../catalog/brands";
import { STARTUPS } from "../startups";
import selfHosted from "./self-hosted.json";

export interface BrandEntry {
    id: string;
    name: string;
    // Primary web domain, or null when unverified.
    domain: string | null;
    // Other spellings the datasets use, matched after normalisation.
    aliases?: string[];
    // Self-hosted logo under frontend/public; wins over the logo provider.
    logo?: string;
    // "light" for a dark mark that disappears on the black HUD: drawn on a
    // pale tile with the provider's light-theme variant.
    tile?: "light";
}

type Row = [id: string, name: string, domain: string | null, aliases?: string[]];

// Actuator, motor and gearbox makers (frontend/src/data/actuators.json).
const MAKERS: Row[] = [
    ["cubemars", "CubeMars", "cubemars.com", ["T-Motor"]],
    ["unitree", "Unitree", "unitree.com", ["Unitree Robotics"]],
    ["robotis", "Robotis", "robotis.com", ["Dynamixel"]],
    ["myactuator", "MyActuator", "myactuator.com"],
    ["robstride", "RobStride", "robstride.com"],
    ["steadywin", "Steadywin", "steadywin-motor.com", ["SteadyWin"]],
    ["waveshare", "Waveshare", "waveshare.com"],
    ["feetech", "Feetech", "feetechrc.com"],
    ["harmonic-drive", "Harmonic Drive", "harmonicdrive.net", ["Harmonic Drive LLC"]],
    ["mjbots", "mjbots", "mjbots.com"],
    ["odrive", "ODrive", "odriverobotics.com", ["ODrive Robotics"]],
    ["leaderdrive", "Leaderdrive", "leaderdrive.com"],
    ["damiao", "DAMIAO", "damiaokeji.com", ["DMBots"]],
    ["nidec", "Nidec", "nidec.com", ["Nidec Drive Technology"]],
    ["xiaomi", "Xiaomi", "mi.com"],
    ["hiwonder", "Hiwonder", "hiwonder.com", ["LewanSoul"]],
    ["innfos", "INNFOS", "innfos.com"],
    ["ipower", "iPower", "iflight.com", ["iPower Motor"]],
    ["nabtesco", "Nabtesco", "nabtesco.com"],
    ["spinea", "Spinea", "spinea.com"],
    ["maxon", "maxon", "maxongroup.com"],
    ["tq-systems", "TQ-Systems", "tq-group.com"],
    [
        "allied-motion",
        "Allied Motion",
        "allient.com",
        ["Allied Motion / Allient", "Allient"],
    ],
    ["vesc", "VESC / Trampa", "trampa.co.uk", ["Trampa / VESC Project", "Trampa"]],
    ["trinamic", "Trinamic", "analog.com", ["Analog Devices"]],
    ["lkmtech", "LKMTech", "lkmotor.cn", ["LK Motor"]],
    // Asimov 1 joint motors (#100); no verified domain yet, so a monogram.
    ["encos", "ENCOS", null],
    ["atar", "ATAR", "atarrobot.com", ["ATAR Robot"]],
];

// Robot makers and the people behind the robot data (robots.json).
const ROBOT_MAKERS: Row[] = [
    ["menlo-research", "Menlo Research", "menlo.ai"],
    ["1x", "1X Technologies", "1x.tech", ["1X"]],
    ["booster", "Booster Robotics", "booster.tech", ["Booster"]],
    ["i2rt", "i2RT Robotics", "i2rt.com", ["i2RT"]],
    ["unitzero", "UnitZero", "unitzero.ai"],
    ["pollen", "Pollen Robotics", "pollen-robotics.com", ["Pollen"]],
    // Domains from the robots.json sources for #104's new robots.
    ["fourier", "Fourier", "fftai.com", ["Fourier Intelligence"]],
    ["agility", "Agility Robotics", "agilityrobotics.com", ["Agility"]],
    ["agilex", "AgileX Robotics", "agilex.ai", ["AgileX"]],
    ["therobotstudio", "TheRobotStudio", "therobotstudio.com"],
    ["hello-robot", "Hello Robot", "hello-robot.com"],
    ["franka", "Franka Robotics", "franka.de", ["Franka"]],
    // Domain from its own product page (yor.manmaruai.co.jp) in robots.json.
    ["manmaru", "ManmaruAI", "manmaruai.co.jp", ["Manmaru"]],
    // The Asimov 1 bill of materials, not a company: always a monogram.
    ["asimov-bom", "Asimov BOM", null],
];

// Companies behind the /investors deals (src/investors.ts COMPANIES).
const PORTFOLIO: Row[] = [
    ["salient", "Salient Motion", "salientmotion.com"],
    ["clearmotion", "ClearMotion", "clearmotion.com"],
    ["mind", "Mind Robotics", "mindrobotics.com"],
    ["robco", "RobCo", "robco.de"],
    ["anybotics", "ANYbotics", "anybotics.com"],
    ["proception", "Proception", "proception.ai"],
    ["robotiq", "Robotiq", "robotiq.com"],
    ["minerva", "Minerva Humanoids", "minervahumanoids.com"],
    ["standardbots", "Standard Bots", "standardbots.com"],
    ["cobot", "Collaborative Robotics", "co.bot"],
    ["sunday", "Sunday Robotics", "sunday.ai"],
    ["botco", "The Bot Company", "bot.co"],
    ["theker", "THEKER", "theker.ai"],
    ["dyna", "Dyna Robotics", "dyna.co"],
    ["genesis", "Genesis AI", "genesis.ai"],
    ["rhoda", "Rhoda AI", "rhoda.ai"],
    ["thirdwave", "Third Wave Automation", "thirdwave.ai"],
    ["icon", "ICON", "iconbuild.com"],
];

// Venture funds (src/investors.ts FUNDS) and startup lead investors.
const INVESTORS: Row[] = [
    ["a16z", "a16z", "a16z.com", ["Andreessen Horowitz"]],
    ["founders-fund", "Founders Fund", "foundersfund.com"],
    ["lux", "Lux", "luxcapital.com", ["Lux Capital"]],
    ["menlo-ventures", "Menlo", "menlovc.com", ["Menlo Ventures"]],
    ["nea", "NEA", "nea.com"],
    ["lightspeed", "Lightspeed", "lsvp.com"],
    ["sequoia", "Sequoia", "sequoiacap.com", ["Sequoia Capital"]],
    ["bessemer", "Bessemer", "bvp.com", ["Bessemer Venture Partners"]],
    ["first-round", "First Round", "firstround.com", ["First Round Capital"]],
    ["battery", "Battery", "battery.com", ["Battery Ventures"]],
    ["kleiner-perkins", "Kleiner Perkins", "kleinerperkins.com"],
    ["accel", "Accel", "accel.com"],
    ["redpoint", "Redpoint", "redpoint.com"],
    ["bain-capital-ventures", "Bain Capital Ventures", "baincapitalventures.com"],
    ["general-catalyst", "General Catalyst", "generalcatalyst.com"],
    ["benchmark", "Benchmark", "benchmark.com"],
    ["coatue", "Coatue", "coatue.com"],
    ["greenoaks", "Greenoaks", "greenoaks.com"],
    ["spark", "Spark", "sparkcapital.com", ["Spark Capital"]],
    ["crv", "CRV", "crv.com"],
    ["khosla", "Khosla", "khoslaventures.com", ["Khosla Ventures"]],
    ["norwest", "Norwest", "norwest.com", ["Norwest Venture Partners"]],
    ["thrive", "Thrive", "thrivecap.com", ["Thrive Capital"]],
    ["usv", "USV", "usv.com", ["Union Square Ventures"]],
    ["ribbit", "Ribbit", "ribbitcap.com", ["Ribbit Capital"]],
    ["index", "Index", "indexventures.com", ["Index Ventures"]],
    ["greylock", "Greylock", "greylock.com"],
    ["8vc", "8VC", "8vc.com"],
    ["ivp", "IVP", "ivp.com"],
    ["greycroft", "Greycroft", "greycroft.com"],
];

const host = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

// /startups rows carry their own site and a self-hosted logo.
const STARTUP_ENTRIES: BrandEntry[] = STARTUPS.map((s) => ({
    id: s.id,
    name: s.name,
    domain: host(s.url),
    logo: s.logo,
}));

// Official marks served from frontend/public/logos/brands, each with the page
// it came from (company site, its GitHub org, Wikimedia or simple-icons). They
// win over the logo provider, so these render without a provider token.
const SELF_HOSTED = new Map(
    (selfHosted as { id: string; logo: string; tile?: "light" }[]).map((r) => [
        r.id,
        r,
    ]),
);

// Dark logos that need a pale tile to read on black (checked by eye).
const LIGHT_TILE = new Set(["ivp", "benchmark"]);

const fromRow = ([id, name, domain, aliases]: Row): BrandEntry => {
    const own = SELF_HOSTED.get(id);
    return {
        id,
        name,
        domain,
        ...(aliases ? { aliases } : {}),
        ...(own ? { logo: own.logo } : {}),
        ...(LIGHT_TILE.has(id) || own?.tile === "light"
            ? { tile: "light" as const }
            : {}),
    };
};

export const BRANDS: BrandEntry[] = [
    ...STARTUP_ENTRIES,
    ...[...MAKERS, ...ROBOT_MAKERS, ...PORTFOLIO, ...INVESTORS].map(fromRow),
];

// Lowercase, drop a parenthetical ("Robotis (Dynamixel)"), collapse punctuation.
export function normalizeBrand(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

const INDEX = new Map<string, BrandEntry>();
for (const b of BRANDS) {
    for (const key of [b.id, b.name, ...(b.aliases ?? [])]) {
        const k = normalizeBrand(key);
        if (!INDEX.has(k)) INDEX.set(k, b);
    }
}

// Resolve an id or any dataset spelling to its entry: exact id or name first,
// then the catalog's canonical maker name ("CubeMars (T-Motor)" -> CubeMars).
export function resolveBrand(nameOrId: string): BrandEntry | undefined {
    return (
        INDEX.get(normalizeBrand(nameOrId)) ??
        INDEX.get(normalizeBrand(canonicalBrand(nameOrId)))
    );
}

// Up to two initials for the monogram fallback ("Harmonic Drive" -> "HD").
export function brandInitials(name: string): string {
    const words = name
        .replace(/\s*\(.*?\)\s*/g, " ")
        .split(/[\s/-]+/)
        .filter(Boolean);
    const first = words[0] ?? "";
    const letters =
        words.length > 1 ? words.map((w) => w[0]).join("") : first.slice(0, 2);
    return letters.slice(0, 2).toUpperCase();
}

const TOKEN = /^pk_[A-Za-z0-9_-]{4,128}$/;
const DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/;

export type LogoTheme = "dark" | "light";

// The one place that knows the logo provider: Logo.dev's image CDN, hotlinked
// (never downloaded or committed). `retina` serves 2x pixels for HiDPI, and
// `fallback=404` makes a missing logo an error so the caller draws a monogram.
// The token is Logo.dev's publishable key (pk_...), public by design.
export function logoUrl(
    domain: string,
    size: number,
    token: string,
    theme: LogoTheme = "dark",
): string | null {
    if (!TOKEN.test(token) || !DOMAIN.test(domain)) return null;
    const q = new URLSearchParams({
        token,
        size: String(Math.round(size)),
        format: "png",
        theme,
        retina: "true",
        fallback: "404",
    });
    return `https://img.logo.dev/${domain}?${q}`;
}
