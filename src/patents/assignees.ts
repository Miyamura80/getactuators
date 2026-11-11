// Assignee normalisation for /patents. Google Patents' harmonised assignee
// names (DOCDB style, e.g. "SEIKO EPSON CORP", "BOSCH GMBH ROBERT") are
// cleaned of case and legal-form suffixes, then grouped under a parent by
// the alias table below. A parent that is also a company in the supply-chain
// registry (src/supply-chain/companies) carries its id, so the page can link
// to the company profile.
//
// Grouping follows ownership today where a subsidiary is majority owned or
// was merged in (Nidec Shimpo under Nidec, ASMO under Denso). Former
// subsidiaries sold off keep their own name (Hitachi Metals is Proterial
// since 2023). Relative imports only: scripts and tests use this module.

// Legal-form and filler tokens dropped from the end of a cleaned name, as
// many times as they repeat ("CO LTD", "GMBH & CO KG").
const SUFFIXES = new Set([
    "AB",
    "AG",
    "AS",
    "BV",
    "CO",
    "COMPANY",
    "CORP",
    "CORPORATION",
    "GMBH",
    "INC",
    "INCORPORATED",
    "KG",
    "KK",
    "LIMITED",
    "LLC",
    "LP",
    "LTD",
    "NV",
    "OY",
    "PLC",
    "SA",
    "SAS",
    "SE",
    "SPA",
    "SRL",
    "&",
]);

// Upper-case, punctuation to spaces (keeping "&"), legal-form suffixes off.
export function cleanAssigneeName(raw: string): string {
    const words = raw
        .toUpperCase()
        .replace(/[.,()"']/g, " ")
        .replace(/[^A-Z0-9& -]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    while (words.length > 1 && SUFFIXES.has(words.at(-1) as string)) words.pop();
    return words.join(" ");
}

export interface AssigneeAlias {
    // Display name of the parent.
    name: string;
    // Cleaned-name prefixes grouped under it.
    match: string[];
    // Supply-chain registry company id, when there is one.
    company?: string;
}

// Parents with more than one harmonised spelling or a subsidiary among the
// top assignees. Order matters only where prefixes nest: the first match wins.
export const ASSIGNEE_ALIASES: readonly AssigneeAlias[] = [
    {
        name: "Proterial (ex-Hitachi Metals)",
        match: ["HITACHI METALS", "PROTERIAL"],
        company: "proterial",
    },
    { name: "Hitachi Construction Machinery", match: ["HITACHI CONSTRUCTION"] },
    { name: "Hitachi", match: ["HITACHI"] },
    { name: "Seiko Epson", match: ["SEIKO EPSON"], company: "seiko-epson" },
    {
        name: "Sumitomo Heavy Industries",
        match: ["SUMITOMO HEAVY"],
        company: "sumitomo-heavy",
    },
    { name: "Nabtesco", match: ["NABTESCO"], company: "nabtesco" },
    {
        name: "Harmonic Drive Systems",
        match: ["HARMONIC DRIVE SYSTEMS", "HARMONIC DRIVE"],
        company: "harmonic-drive-systems",
    },
    { name: "Nidec", match: ["NIDEC", "NIHON DENSAN"], company: "nidec" },
    { name: "NTN", match: ["NTN"], company: "ntn" },
    { name: "NSK", match: ["NSK"], company: "nsk" },
    { name: "JTEKT", match: ["JTEKT"], company: "jtekt" },
    { name: "THK", match: ["THK"], company: "thk" },
    { name: "TDK", match: ["TDK"], company: "tdk" },
    {
        name: "Shin-Etsu Chemical",
        match: ["SHINETSU CHEMICAL", "SHIN ETSU CHEMICAL"],
        company: "shin-etsu-chemical",
    },
    {
        name: "Daido Steel",
        match: ["DAIDO STEEL", "DAIDO ELECTRONICS"],
        company: "daido-steel",
    },
    { name: "Aichi Steel", match: ["AICHI STEEL"], company: "aichi-steel" },
    { name: "Denso", match: ["DENSO", "ASMO"] },
    {
        name: "Toyota Motor",
        match: ["TOYOTA MOTOR", "TOYOTA ENG & MFG", "TOYOTA JIDOSHA"],
        company: "toyota-motor",
    },
    { name: "Honda", match: ["HONDA MOTOR", "HONDA GIKEN"], company: "honda" },
    { name: "FANUC", match: ["FANUC"], company: "fanuc" },
    { name: "Yaskawa Electric", match: ["YASKAWA"], company: "yaskawa" },
    {
        name: "Kawasaki Heavy Industries",
        match: ["KAWASAKI HEAVY", "KAWASAKI JUKOGYO"],
        company: "kawasaki-heavy",
    },
    {
        name: "Mitsubishi Electric",
        match: ["MITSUBISHI ELECTRIC"],
        company: "mitsubishi-electric",
    },
    { name: "MinebeaMitsumi", match: ["MINEBEA"], company: "minebea-mitsumi" },
    { name: "OMRON", match: ["OMRON"], company: "omron" },
    { name: "Toshiba", match: ["TOSHIBA"] },
    { name: "Panasonic", match: ["PANASONIC", "MATSUSHITA ELECTRIC"] },
    { name: "Sony", match: ["SONY"] },
    { name: "Canon", match: ["CANON"] },
    { name: "Aisin", match: ["AISIN"] },
    {
        name: "Hyundai Motor",
        match: ["HYUNDAI MOTOR", "KIA"],
        company: "hyundai-motor",
    },
    { name: "Hyundai Mobis", match: ["HYUNDAI MOBIS"], company: "hyundai-mobis" },
    {
        name: "HD Hyundai",
        match: ["HYUN DAI HEAVY", "HYUNDAI HEAVY", "HD HYUNDAI"],
        company: "hd-hyundai",
    },
    { name: "KYB", match: ["KYB", "KAYABA"] },
    { name: "HL Mando", match: ["MANDO", "HL MANDO"] },
    {
        name: "Samsung Electronics",
        match: ["SAMSUNG ELECTRONICS"],
        company: "samsung-electronics",
    },
    {
        name: "Samsung Electro-Mechanics",
        match: ["SAMSUNG ELECTRO MECH"],
        company: "samsung-electro-mechanics",
    },
    { name: "LG Electronics", match: ["LG ELECTRONICS"], company: "lg-electronics" },
    { name: "LG Innotek", match: ["LG INNOTEK"], company: "lg-innotek" },
    { name: "Star Group Industrial", match: ["STAR GROUP IND"], company: "star-group" },
    { name: "SBB Tech", match: ["SBBTECH", "SBB TECH"], company: "sbb-tech" },
    { name: "Robotis", match: ["ROBOTIS"], company: "robotis" },
    {
        name: "Korea Institute of Machinery & Materials",
        match: ["KOREA INST MACH & MATERIALS", "KOREA MACH & MATERIALS INST"],
        company: "kimm",
    },
    {
        name: "Schaeffler",
        match: ["SCHAEFFLER", "LUK LAMELLEN"],
        company: "schaeffler",
    },
    { name: "Bosch", match: ["BOSCH GMBH ROBERT", "ROBERT BOSCH"] },
    { name: "Siemens", match: ["SIEMENS"] },
    {
        name: "ZF Friedrichshafen",
        match: [
            "ZAHNRADFABRIK FRIEDRICHSHAFEN",
            "ZF FRIEDRICHSHAFEN",
            "ZF ACTIVE SAFETY",
        ],
    },
    { name: "BMW Group", match: ["BAYERISCHE MOTOREN WERKE"], company: "bmw-group" },
    {
        name: "Mercedes-Benz",
        match: ["MERCEDES BENZ", "DAIMLER"],
        company: "mercedes-benz",
    },
    { name: "Renault Group", match: ["RENAULT", "AMPERE"], company: "renault-group" },
    { name: "Valeo", match: ["VALEO"] },
    { name: "KUKA", match: ["KUKA"], company: "kuka" },
    { name: "ABB", match: ["ABB"], company: "abb" },
    { name: "SKF", match: ["SKF"], company: "skf" },
    { name: "VACUUMSCHMELZE (VAC)", match: ["VACUUMSCHMELZE"], company: "vac" },
    { name: "Festo", match: ["FESTO"], company: "festo" },
    {
        name: "General Motors",
        match: ["GM GLOBAL TECH", "GEN MOTORS", "GENERAL MOTORS"],
        company: "general-motors",
    },
    { name: "Ford", match: ["FORD GLOBAL TECH", "FORD MOTOR"] },
    { name: "General Electric", match: ["GEN ELECTRIC", "GENERAL ELECTRIC"] },
    { name: "Rolls-Royce", match: ["ROLLS ROYCE"] },
    {
        name: "Collins Aerospace (RTX)",
        match: ["HAMILTON SUNDSTRAND", "COLLINS AEROSPACE"],
    },
    { name: "Boston Dynamics", match: ["BOSTON DYNAMICS"], company: "boston-dynamics" },
    { name: "Tesla", match: ["TESLA"], company: "tesla" },
    { name: "Intuitive Surgical", match: ["INTUITIVE SURGICAL"], company: "intuitive" },
    { name: "Moog", match: ["MOOG"], company: "moog" },
    {
        name: "Regal Rexnord",
        match: ["REGAL BELOIT", "REGAL REXNORD"],
        company: "regal-rexnord",
    },
    { name: "Magna International", match: ["MAGNA"], company: "magna" },
    { name: "Niron Magnetics", match: ["NIRON MAGNETICS"], company: "niron-magnetics" },
    {
        name: "Cambridge Mechatronics",
        match: ["CAMBRIDGE MECHATRONICS"],
        company: "cambridge-mechatronics",
    },
    {
        name: "Artimus Robotics",
        match: ["ARTIMUS ROBOTICS"],
        company: "artimus-robotics",
    },
    { name: "Foxconn (Hon Hai)", match: ["HON HAI", "HONGFUJIN PREC"] },
    {
        name: "Xiamen Tungsten",
        match: [
            "XIAMEN TUNGSTEN",
            "FUJIAN CHANGTING GOLDEN DRAGON",
            "FUJIAN GOLDEN DRAGON",
            "FUJIAN CHANGJIANG GOLDEN DRAGON",
            "FUJIAN JINLONG RARE EARTH",
        ],
        company: "xiamen-tungsten",
    },
    {
        name: "Zhong Ke San Huan",
        match: [
            "BEIJING ZHONG KE SAN HUAN",
            "TIANJIN SANHUAN LUCKY",
            "ZHONG KE SAN HUAN",
        ],
        company: "zhong-ke-san-huan",
    },
    {
        name: "Zhenghai Magnetic Material",
        match: ["YANTAI ZHENGHAI", "NANTONG ZHENGHAI"],
        company: "zhenghai-magnetic",
    },
    {
        name: "Yantai Dongxing Magnetic Materials (YSM)",
        match: ["YANTAI SHOUGANG MAGNETIC", "YANTAI DONGXING MAGNETIC"],
        company: "yantai-dongxing",
    },
    { name: "Ningbo Yunsheng", match: ["NINGBO YUNSHENG"], company: "ningbo-yunsheng" },
    {
        name: "Earth-Panda Advance Magnetic Material",
        match: ["EARTH PANDA"],
        company: "earth-panda",
    },
    { name: "JL MAG Rare-Earth", match: ["JL MAG"], company: "jl-mag" },
    { name: "Grirem Advanced Materials", match: ["GRIREM"], company: "grirem" },
    {
        name: "China Northern Rare Earth",
        match: [
            "CHINA NORTHERN RARE EARTH",
            "BAOTOU RES INST RARE EARTHS",
            "INNER MONGOLIA BAOTOU STEEL RARE EARTH",
        ],
        company: "china-northern-rare-earth",
    },
    { name: "Laifual Drive", match: ["ZHEJIANG LAIFUAL"], company: "laifual" },
    {
        name: "Leaderdrive",
        match: ["SUZHOU LVDI", "LEADERDRIVE"],
        company: "leaderdrive",
    },
    {
        name: "UBTech Robotics",
        match: ["UBTECH ROBOTICS", "UBTECH"],
        company: "ubtech",
    },
    {
        name: "Dobot (Shenzhen Yuejiang)",
        match: ["SHENZHEN YUEJIANG"],
        company: "dobot",
    },
    { name: "Siasun", match: ["SHENYANG SIASUN"], company: "siasun" },
    {
        name: "Sanhua Intelligent Controls",
        match: ["ZHEJIANG SANHUA"],
        company: "sanhua",
    },
    {
        name: "Midea",
        match: ["MIDEA", "GD MIDEA", "GUANGDONG MIDEA"],
        company: "midea",
    },
    { name: "Gree Electric", match: ["GREE ELECTRIC", "ZHUHAI GREE"] },
    { name: "BYD", match: ["BYD"], company: "byd" },
    { name: "Estun", match: ["NANJING ESTUN"], company: "estun" },
    {
        name: "Inovance",
        match: ["SHENZHEN INOVANCE", "SUZHOU INOVANCE"],
        company: "inovance",
    },
    {
        name: "Unitree Robotics",
        match: ["HANGZHOU YUSHU", "UNITREE"],
        company: "unitree",
    },
    { name: "Xiaomi", match: ["BEIJING XIAOMI", "XIAOMI"], company: "xiaomi" },
    {
        name: "Harbin Institute of Technology",
        match: [
            "HARBIN INST TECHNOLOGY",
            "HARBIN INSTITUTE TECHNOLOGY",
            "HARBIN INSTITUTE OF TECH",
        ],
    },
    {
        name: "Chinese Academy of Sciences, Ningbo Institute of Materials",
        match: ["NINGBO INST MATERIALS TECH & ENG CAS"],
    },
];

// Words that stay upper-case in a display name built from a cleaned one.
const KEEP_UPPER = new Set([
    "CAS",
    "USA",
    "UK",
    "LG",
    "ABB",
    "NTN",
    "NSK",
    "THK",
    "TDK",
    "KAIST",
    "MIT",
    "ETH",
    "EPFL",
    "CNRS",
    "IND",
]);
const LOWER = new Set(["&", "OF", "AND", "THE", "FOR", "DE", "DU", "LA"]);

function titleCase(cleaned: string): string {
    return cleaned
        .split(" ")
        .map((w, i) => {
            if (KEEP_UPPER.has(w) || /\d/.test(w)) return w;
            if (i > 0 && LOWER.has(w)) return w === "&" ? w : w.toLowerCase();
            return w.charAt(0) + w.slice(1).toLowerCase();
        })
        .join(" ");
}

export interface NormalisedAssignee {
    // Stable grouping key.
    key: string;
    name: string;
    company?: string;
}

export function aliasFor(cleaned: string): AssigneeAlias | undefined {
    return ASSIGNEE_ALIASES.find((a) =>
        a.match.some((m) => cleaned === m || cleaned.startsWith(`${m} `)),
    );
}

export function normaliseAssignee(raw: string): NormalisedAssignee {
    const cleaned = cleanAssigneeName(raw);
    const alias = aliasFor(cleaned);
    if (alias)
        return {
            key: alias.company ?? `alias:${alias.name}`,
            name: alias.name,
            ...(alias.company ? { company: alias.company } : {}),
        };
    return { key: cleaned, name: titleCase(cleaned) };
}
