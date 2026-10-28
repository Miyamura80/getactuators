// SPDX id from a licence file's text, by the phrases each licence must
// carry. Returns null when nothing matches (the item then reads "other").

const RULES: [string, RegExp[]][] = [
    ["Apache-2.0", [/Apache License/i, /Version 2\.0/i]],
    ["MPL-2.0", [/Mozilla Public License/i, /2\.0/]],
    ["LGPL-3.0", [/GNU LESSER GENERAL PUBLIC LICENSE/i, /Version 3/i]],
    ["LGPL-2.1", [/GNU LESSER GENERAL PUBLIC LICENSE/i, /Version 2\.1/i]],
    ["AGPL-3.0", [/GNU AFFERO GENERAL PUBLIC LICENSE/i]],
    ["GPL-3.0", [/GNU GENERAL PUBLIC LICENSE/i, /Version 3/i]],
    ["GPL-2.0", [/GNU GENERAL PUBLIC LICENSE/i, /Version 2/i]],
    ["MIT", [/Permission is hereby granted, free of charge/i]],
    [
        "BSD-3-Clause",
        [/Redistribution and use in source and binary forms/i, /Neither the name/i],
    ],
    ["BSD-2-Clause", [/Redistribution and use in source and binary forms/i]],
    ["Unlicense", [/This is free and unencumbered software/i]],
    ["CC-BY-4.0", [/Creative Commons Attribution 4\.0/i]],
];

export function detectLicence(text: string): string | null {
    for (const [id, all] of RULES) if (all.every((re) => re.test(text))) return id;
    return null;
}
