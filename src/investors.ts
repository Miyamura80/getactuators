// Which of 29 large venture funds have put money into hardware that moves,
// shared by the /investors page and its markdown twin. Built from public
// funding announcements; a fund with no deals means none was found, not that
// none exists (paid databases were not checked).

export const INVESTORS_PATH = "/investors";
export const INVESTORS_AS_OF = "October 2026";

// Ordered strongest bet first: an actuator maker outright, a robot maker that
// builds its own actuators, then robot hardware with no confirmed actuator work.
export const KINDS = ["direct", "adj", "hw"] as const;
export type Kind = (typeof KINDS)[number];
export type Tier = Kind | "none";

export const KIND_LABEL: Record<Tier, string> = {
    direct: "Actuator maker",
    adj: "Robot maker, own actuators",
    hw: "Robot hardware only",
    none: "No actuated bet",
};

export interface Company {
    name: string;
    kind: Kind;
    what: string;
}

export const COMPANIES: Record<string, Company> = {
    westmag: {
        name: "Westmag",
        kind: "direct",
        what: "US-made drone motors and robot joint actuators",
    },
    salient: {
        name: "Salient Motion",
        kind: "direct",
        what: "Electromechanical actuation for aerospace and defense",
    },
    clearmotion: {
        name: "ClearMotion",
        kind: "direct",
        what: "Electro-hydraulic active-suspension actuators",
    },
    mind: {
        name: "Mind Robotics",
        kind: "adj",
        what: "Rivian-spinout industrial robots; hiring for in-house actuation",
    },
    robco: {
        name: "RobCo",
        kind: "adj",
        what: "Modular industrial robot arms built from its own joint modules",
    },
    anybotics: {
        name: "ANYbotics",
        kind: "adj",
        what: "ANYmal quadrupeds on in-house ANYdrive actuators",
    },
    proception: {
        name: "Proception",
        kind: "adj",
        what: "22-DoF dexterous robot hands sold as modules",
    },
    robotiq: {
        name: "Robotiq",
        kind: "adj",
        what: "Electric grippers and end-of-arm tooling",
    },
    minerva: {
        name: "Minerva Humanoids",
        kind: "hw",
        what: "Humanoids for dangerous industrial work",
    },
    standardbots: { name: "Standard Bots", kind: "hw", what: "US-built robot arms" },
    cobot: { name: "Collaborative Robotics", kind: "hw", what: "Cobot maker" },
    sunday: { name: "Sunday Robotics", kind: "hw", what: "Memo household robot" },
    botco: { name: "The Bot Company", kind: "hw", what: "Home robots from Kyle Vogt" },
    theker: { name: "THEKER", kind: "hw", what: "Reconfigurable AI industrial robots" },
    dyna: {
        name: "Dyna Robotics",
        kind: "hw",
        what: "Low-cost robots plus a foundation model",
    },
    genesis: {
        name: "Genesis AI",
        kind: "hw",
        what: "Robot model company now designing its own hands",
    },
    rhoda: {
        name: "Rhoda AI",
        kind: "hw",
        what: "Robot intelligence platform building its own hardware",
    },
    thirdwave: {
        name: "Third Wave Automation",
        kind: "hw",
        what: "Autonomous forklifts",
    },
    icon: { name: "ICON", kind: "hw", what: "3D-printing construction robots" },
};

const SRC = {
    westmag:
        "https://www.businesswire.com/news/home/20260602552448/en/Westmag-Emerges-With-$11-Million-Seed-Led-By-Andreessen-Horowitz-to-Build-Americas-Drone-Motor-and-Robot-Actuator-Industry",
    salient:
        "https://techcrunch.com/2024/10/01/palmer-luckey-tried-to-crush-aeronautics-startup-salient-motion-but-anduril-backer-a16z-invested",
    clearmotion:
        "https://globalventuring.com/clearmotion-moves-into-the-light-with-100m",
    mindA: "https://www.businesswire.com/news/home/20260311414783/en/",
    mind400:
        "https://www.roboticstomorrow.com/news/2026/05/14/mind-robotics-announces-400m-in-new-funding-to-expand-industrial-robotics-deployment/26568/",
    robco: "https://www.therobotreport.com/robco-raises-100m-scale-industrial-automation/",
    anybotics: "https://www.anybotics.com/news/anybotics-secures-50m-series-b-funding/",
    proception:
        "https://www.gunder.com/en/news-insights/client-news/proception-raises-dollar11-million-seed-financing",
    robotiq:
        "https://www.automate.org/news/robotiq-raises-31-million-in-funding-from-battery-ventures",
    minerva:
        "https://www.globenewswire.com/news-release/2026/10/06/3375277/0/en/minerva-humanoids-emerges-from-stealth-with-10m-pre-seed-round-led-by-general-catalyst-to-build-humanoid-robots-for-the-world-s-most-dangerous-jobs.html",
    standardbots: "https://valueaddvc.com/pulse/sectors/robotics-and-mobility",
    cobot: "https://www.prnewswire.com/news-releases/collaborative-robotics-raises-100-million-in-series-b-funding-302112670.html",
    sunday: "https://techcrunch.com/2026/03/12/humanoid-robotics-maker-sunday-reaches-1-15b-valuation-to-build-household-robots/",
    botco: "https://techcrunch.com/2025/03/23/former-cruise-ceo-kyle-vogts-new-robotics-startup-reportedly-raises-another-150m/",
    botcoSpark:
        "https://www.forbes.com.au/news/entrepreneurs/cruise-cofounder-raised-150m-for-household-robot-startup/",
    theker: "https://www.cathaycapital.com/theker-raises-85m-in-europes-largest-ever-robotics-series-a-led-by-crv-with-backing-from-samsung-and-lvmh/",
    dyna: "https://medium.com/crv-insights/power-to-the-bot-crv-partners-with-dyna-robotics-to-commercialize-embodied-ai-with-low-cost-af67bebf0318",
    genesis:
        "https://techcrunch.com/2026/05/06/khosla-backed-robotics-startup-genesis-ai-has-gone-full-stack-demo-shows/",
    rhoda: "https://theaiinsider.tech/2026/03/10/rhoda-ai-exits-stealth-with-450-million-series-a-to-scale-platform-for-real-world-robitics-intelligence/",
};

export interface Deal {
    co: string;
    lead: boolean;
    round: string;
    // null when the announcement gives no year (an "earlier round").
    year: number | null;
    source: string | null;
}

export interface Fund {
    name: string;
    deals: Deal[];
}

const d = (
    co: string,
    lead: boolean,
    round: string,
    year: number | null,
    source: string | null,
): Deal => ({
    co,
    lead,
    round,
    year,
    source,
});

export const FUNDS: Fund[] = [
    {
        name: "a16z",
        deals: [
            d("westmag", true, "Seed $11M", 2025, SRC.westmag),
            d("salient", false, "Seed ~$4M", 2024, SRC.salient),
            d("mind", true, "Series A $500M (co-lead)", 2026, SRC.mindA),
        ],
    },
    {
        name: "Founders Fund",
        deals: [d("westmag", false, "Seed $11M", 2025, SRC.westmag)],
    },
    {
        name: "Lux",
        deals: [
            d("westmag", false, "Seed $11M", 2025, SRC.westmag),
            d("cobot", false, "Series B $100M", 2024, SRC.cobot),
        ],
    },
    { name: "Menlo", deals: [d("westmag", false, "Seed $11M", 2025, SRC.westmag)] },
    {
        name: "NEA",
        deals: [d("clearmotion", false, "Series C $100M", 2017, SRC.clearmotion)],
    },
    {
        name: "Lightspeed",
        deals: [
            d("robco", true, "Series B $42.5M", 2024, SRC.robco),
            d("robco", true, "Series C $100M (co-lead)", 2026, SRC.robco),
        ],
    },
    {
        name: "Sequoia",
        deals: [
            d("robco", false, "Series C $100M", 2026, SRC.robco),
            d("cobot", false, "Earlier rounds", null, SRC.cobot),
        ],
    },
    {
        name: "Bessemer",
        deals: [d("anybotics", false, "Series B $50M", 2023, SRC.anybotics)],
    },
    {
        name: "First Round",
        deals: [
            d("proception", true, "Seed $11M", 2026, SRC.proception),
            d("dyna", true, "Series A $120M (co-lead)", 2026, SRC.dyna),
        ],
    },
    { name: "Battery", deals: [d("robotiq", true, "Growth $31M", 2018, SRC.robotiq)] },
    {
        name: "Kleiner Perkins",
        deals: [d("mind", true, "$400M round", 2026, SRC.mind400)],
    },
    {
        name: "Accel",
        deals: [d("mind", true, "Series A $500M (co-lead)", 2026, SRC.mindA)],
    },
    { name: "Redpoint", deals: [d("mind", false, "$400M round", 2026, SRC.mind400)] },
    {
        name: "Bain Capital Ventures",
        deals: [
            d("mind", false, "$400M round (returning)", 2026, SRC.mind400),
            d("sunday", false, "Series B $165M", 2026, SRC.sunday),
        ],
    },
    {
        name: "General Catalyst",
        deals: [
            d("minerva", true, "Pre-seed $10M", 2026, SRC.minerva),
            d("cobot", true, "Series B $100M", 2024, SRC.cobot),
            d("standardbots", false, "Earlier rounds", null, SRC.standardbots),
        ],
    },
    {
        name: "Benchmark",
        deals: [d("sunday", false, "Series B $165M", 2026, SRC.sunday)],
    },
    { name: "Coatue", deals: [d("sunday", true, "Series B $165M", 2026, SRC.sunday)] },
    { name: "Greenoaks", deals: [d("botco", true, "$150M round", 2025, SRC.botco)] },
    {
        name: "Spark",
        deals: [d("botco", false, "$150M first round", 2024, SRC.botcoSpark)],
    },
    {
        name: "CRV",
        deals: [
            d("theker", true, "Series A ~$85M", 2026, SRC.theker),
            d("dyna", true, "Seed and Series A (co-lead)", 2025, SRC.dyna),
        ],
    },
    {
        name: "Khosla",
        deals: [
            d("genesis", true, "Seed $105M (co-lead)", 2025, SRC.genesis),
            d("rhoda", false, "Series A $450M", 2026, SRC.rhoda),
        ],
    },
    {
        name: "Norwest",
        deals: [
            d("thirdwave", true, "Series B $40M", 2021, null),
            d("icon", true, "Series B $207M", 2021, null),
        ],
    },
    { name: "Thrive", deals: [] },
    { name: "USV", deals: [] },
    { name: "Ribbit", deals: [] },
    { name: "Index", deals: [] },
    { name: "Greylock", deals: [] },
    { name: "8VC", deals: [] },
    { name: "IVP", deals: [] },
];

export const kindRank = (k: Tier): number =>
    k === "none" ? KINDS.length : KINDS.indexOf(k);

export function companyOf(deal: Deal): Company {
    const c = COMPANIES[deal.co];
    if (!c) throw new Error(`Unknown company: ${deal.co}`);
    return c;
}

// The fund's strongest bet among the given kinds, or "none".
export function tierOf(fund: Fund, kinds: readonly Kind[] = KINDS): Tier {
    const ranks = fund.deals
        .map((x) => companyOf(x).kind)
        .filter((k) => kinds.includes(k))
        .map(kindRank);
    return ranks.length ? (KINDS[Math.min(...ranks)] ?? "none") : "none";
}

export function sidelineFunds(kinds: readonly Kind[] = KINDS): Fund[] {
    return FUNDS.filter((f) => tierOf(f, kinds) === "none").sort((a, b) =>
        a.name.localeCompare(b.name),
    );
}
