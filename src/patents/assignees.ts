import { getCompany } from "../supply-chain/registry";

// Assignee normalisation. Raw names come from Google Patents'
// assignee_harmonized field ("HARMONIC DRIVE SYSTEMS INC", "NIDEC SHIMPO
// CORP"); the alias table folds subsidiaries and spellings into one
// organisation and links it to the supply-chain company registry where the
// company is there. Names not in the table are kept, cleaned of legal-form
// suffixes, so an unknown assignee still counts once.

export interface AssigneeAlias {
    // Canonical key: the registry company id when there is one.
    id: string;
    name: string;
    companyId?: string;
    // Upper-case fragments matched against the cleaned raw name.
    patterns: readonly string[];
}

export const ASSIGNEE_ALIASES: readonly AssigneeAlias[] = [
    {
        id: "harmonic-drive-systems",
        name: "Harmonic Drive Systems",
        companyId: "harmonic-drive-systems",
        // Harmonic Drive LLC (US) and Harmonic Drive SE (DE) file as group
        // companies.
        patterns: ["HARMONIC DRIVE"],
    },
    {
        id: "nidec",
        name: "Nidec",
        companyId: "nidec",
        // Nidec Drive Technology (formerly Nidec-Shimpo) makes the FLEXWAVE line.
        patterns: ["NIDEC"],
    },
    {
        id: "nabtesco",
        name: "Nabtesco",
        companyId: "nabtesco",
        patterns: ["NABTESCO"],
    },
    {
        id: "leaderdrive",
        name: "Leaderdrive",
        companyId: "leaderdrive",
        patterns: ["LEADERDRIVE", "LEADER DRIVE"],
    },
    {
        id: "shin-etsu-chemical",
        name: "Shin-Etsu Chemical",
        companyId: "shin-etsu-chemical",
        patterns: ["SHIN ETSU", "SHINETSU"],
    },
    {
        id: "jl-mag",
        name: "JL MAG Rare-Earth",
        companyId: "jl-mag",
        patterns: ["JL MAG", "JINLI PERMANENT MAGNET"],
    },
    {
        id: "china-northern-rare-earth",
        name: "China Northern Rare Earth",
        companyId: "china-northern-rare-earth",
        patterns: ["CHINA NORTHERN RARE EARTH"],
    },
    {
        id: "china-rare-earth-group",
        name: "China Rare Earth Group",
        companyId: "china-rare-earth-group",
        patterns: ["CHINA RARE EARTH GROUP"],
    },
    {
        id: "shenghe-resources",
        name: "Shenghe Resources",
        companyId: "shenghe-resources",
        patterns: ["SHENGHE RESOURCES"],
    },
    {
        id: "mp-materials",
        name: "MP Materials",
        companyId: "mp-materials",
        patterns: ["MP MATERIALS"],
    },
    {
        id: "timken",
        name: "Timken",
        companyId: "timken",
        patterns: ["TIMKEN"],
    },
    {
        id: "tesla",
        name: "Tesla",
        companyId: "tesla",
        patterns: ["TESLA INC", "TESLA MOTORS"],
    },
    {
        id: "boston-dynamics",
        name: "Boston Dynamics",
        companyId: "boston-dynamics",
        patterns: ["BOSTON DYNAMICS"],
    },
    {
        id: "hyundai-mobis",
        name: "Hyundai Mobis",
        companyId: "hyundai-mobis",
        patterns: ["HYUNDAI MOBIS"],
    },
    {
        id: "rainbow-robotics",
        name: "Rainbow Robotics",
        companyId: "rainbow-robotics",
        patterns: ["RAINBOW ROBOTICS"],
    },
    {
        id: "fanuc",
        name: "FANUC",
        companyId: "fanuc",
        patterns: ["FANUC"],
    },
    {
        id: "yaskawa",
        name: "Yaskawa Electric",
        companyId: "yaskawa",
        patterns: ["YASKAWA"],
    },
    {
        id: "unitree",
        name: "Unitree Robotics",
        companyId: "unitree",
        // Registered in China as Hangzhou Yushu Technology.
        patterns: ["UNITREE", "HANGZHOU YUSHU"],
    },
    {
        id: "ubtech",
        name: "UBTech Robotics",
        companyId: "ubtech",
        patterns: ["UBTECH"],
    },
    {
        id: "agibot",
        name: "AgiBot",
        companyId: "agibot",
        patterns: ["AGIBOT"],
    },
    {
        id: "tuopu-group",
        name: "Ningbo Tuopu Group",
        companyId: "tuopu-group",
        patterns: ["TUOPU"],
    },
];

// Legal-form words dropped from the end of a raw name before matching and
// display, longest first so "CO LTD" goes before "LTD".
const LEGAL_FORMS = [
    "CO LTD",
    "COMPANY LIMITED",
    "CORPORATION",
    "INCORPORATED",
    "LIMITED",
    "COMPANY",
    "GMBH",
    "CORP",
    "INC",
    "LTD",
    "LLC",
    "KK",
    "AG",
    "SE",
    "SA",
    "SPA",
    "BV",
    "AB",
    "PLC",
    "CO",
];

export function cleanAssignee(raw: string): string {
    let s = raw
        .toUpperCase()
        .replace(/[.,&()'"-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    for (let changed = true; changed; ) {
        changed = false;
        for (const form of LEGAL_FORMS) {
            if (s.endsWith(` ${form}`)) {
                s = s.slice(0, -form.length - 1).trim();
                changed = true;
            }
        }
    }
    return s;
}

export interface NormalizedAssignee {
    key: string;
    name: string;
    companyId?: string;
}

export function normalizeAssignee(raw: string): NormalizedAssignee {
    const clean = cleanAssignee(raw);
    const alias = ASSIGNEE_ALIASES.find((a) =>
        a.patterns.some((p) => clean.includes(p)),
    );
    if (alias)
        return {
            key: alias.id,
            name: alias.name,
            ...(alias.companyId ? { companyId: alias.companyId } : {}),
        };
    return { key: clean.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: clean };
}

// Every alias that claims a registry company must point at a real one.
export function unknownCompanyLinks(): string[] {
    return ASSIGNEE_ALIASES.filter(
        (a) => a.companyId !== undefined && !getCompany(a.companyId),
    ).map((a) => a.id);
}
