const AK = "https://www.cubemars.com/product/ak80-9-v3-0-robotic-actuator.html";
const FAMILY =
    "https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf";
const CYBER =
    "https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf";
const URS = "https://arxiv.org/pdf/2202.12395";
const THERMAL = "https://arxiv.org/pdf/2002.00798";
const ANYMAL = "https://arxiv.org/pdf/1901.08652";
const FRICTION = "https://arxiv.org/pdf/2503.01255";

function source(url: string, name: string): string {
    return `<a class="ga-source" href="${url}">${name}</a>`;
}

function chip(label: string, value: string): string {
    return `<div class="ga-spec-chip"><dt>${label}</dt><dd>${value}</dd></div>`;
}

function photo(
    id: string,
    name: string,
    alt: string,
    chips: string,
    citation: string,
    note: string,
): string {
    return `<article class="ga-photo-card"><a class="ga-photo-link" href="/actuators/${id}"><img src="/actuator-images/${id}.webp" alt="${alt} product photo" width="320" height="320"></a><div class="ga-photo-copy"><h2><a href="/actuators/${id}">${name}</a></h2><dl class="ga-spec-grid">${chips}</dl><p class="ga-photo-note"><span class="ga-badge">Manufacturer spec</span> ${citation}. ${note}</p></div></article>`;
}

// Original 24-unit engineering pictograms; paths stay inline and decorative.
const nodeIcons = {
    Bus: "M3 7h16v12H3zM19 11h2v4h-2M6 13h4m-2-2v4m5-2h3",
    Driver: "M7 7h10v10H7zM3 8h4m-4 4h4m-4 4h4m10-8h4m-4 4h4m-4 4h4M8 3v4m4-4v4m4-4v4M8 17v4m4-4v4m4-4v4M10 14l4-4",
    Motor: "M5 6h13v12H5zM2 9h3m-3 6h3m13-3h4M9 9v6l3-4 3 4V9",
    Gearbox:
        "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0",
    Output: "M2 10h8v4H2zM10 7h4v10h-4zM14 12h8m-4-4 4 4-4 4",
    Winding:
        "M2 16h2V8a2 2 0 0 1 4 0v8a2 2 0 0 0 4 0V8a2 2 0 0 1 4 0v8a2 2 0 0 0 4 0h2",
    Housing: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M6 12v3m12-3v3",
    Ambient: "M2 7h14a3 3 0 1 0-3-3M2 12h17m-3-3 3 3-3 3M2 17h9a3 3 0 1 1-3 3",
    Rotor: "M19 12a7 7 0 1 1-14 0 7 7 0 1 1 14 0M14 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0M12 5v3m7 4h-3m-4 7v-3m-7-4h3",
    Load: "M8 7V5a4 4 0 0 1 8 0v2M6 7h12l3 14H3zM9 12h6m-3-3v6",
    Encoder:
        "M16 12a6 6 0 1 1-12 0 6 6 0 1 1 12 0M10 6v3m-6 3h3m3 6v-3M18 6h4v12h-4M13 10l2-2m-2 6 2 2",
    Reference:
        "M3 3h18v18H3zM3 7h4m-4 4h3m-3 4h4M18 13a4 4 0 1 1-8 0 4 4 0 1 1 8 0M14 7v12m-6-6h12",
    Sim: "M2 3h20v14H2zM8 21h8m-4-4v4M5 13l4-6 5 7 5-5",
    Identify: "M16 10a7 7 0 1 1-14 0 7 7 0 1 1 14 0M14 15l7 7M5 11h2V8h3v4h3",
    Validate: "M7 4H4v18h16V4h-3M8 2h8v4H8zM7 13l3 3 7-7",
} as const;

// Original conceptual schematics. No measured axes, fitted curves or scores.
function diagram(
    kind: "energy" | "thermal" | "precision" | "model",
    title: string,
): string {
    // Stack a 24-unit pictogram above the unchanged label, including on mobile.
    const box = (x: number, y: number, text: keyof typeof nodeIcons) =>
        `<rect x="${x}" y="${y}" width="96" height="48" rx="7"/><g data-icon="${text}" aria-hidden="true" transform="translate(${x + 36} ${y + 2})" fill="none" stroke="#c3fffd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${nodeIcons[text]}"/></g><text x="${x + 48}" y="${y + 42}" text-anchor="middle">${text}</text>`;
    const right = (x: number, y: number) => `<path d="M${x} ${y}h18m-6-5 6 5-6 5"/>`;
    let drawing: string;
    if (kind === "energy") {
        drawing = `${box(12, 20, "Bus")}${right(111, 44)}${box(132, 20, "Driver")}${right(231, 44)}${box(252, 20, "Motor")}<path d="M300 72v34m-5-6 5 6 5-6"/>${box(252, 116, "Gearbox")}<path d="M249 140h-18m6-5-6 5 6 5"/>${box(132, 116, "Output")}<text x="12" y="143" class="ga-svg-note">Losses at</text><text x="12" y="161" class="ga-svg-note">each stage</text>`;
    } else if (kind === "thermal") {
        drawing = `${box(12, 64, "Winding")}${right(111, 88)}${box(132, 64, "Housing")}${right(231, 88)}${box(252, 64, "Ambient")}<text x="180" y="38" text-anchor="middle" class="ga-svg-note">Installed heat path</text><text x="180" y="149" text-anchor="middle" class="ga-svg-note">Mounting + airflow change heat transfer</text>`;
    } else if (kind === "precision") {
        drawing = `${box(12, 20, "Rotor")}${right(111, 44)}${box(132, 20, "Gearbox")}${right(231, 44)}${box(252, 20, "Load")}${box(12, 116, "Encoder")}${box(252, 116, "Reference")}<path class="ga-svg-dashed" d="M60 72v40m240-40v40"/><text x="180" y="133" text-anchor="middle" class="ga-svg-note">Bits ≠</text><text x="180" y="155" text-anchor="middle" class="ga-svg-note">output error</text>`;
    } else {
        drawing = `${box(12, 20, "Sim")}${right(111, 44)}${box(132, 20, "Identify")}${right(231, 44)}${box(252, 20, "Validate")}<path d="M300 74v30H60V74m-5 6 5-6 5 6"/><text x="180" y="139" text-anchor="middle" class="ga-svg-note">Held-out loads + trajectories</text><text x="180" y="160" text-anchor="middle" class="ga-svg-note">Refine only from observed residuals</text>`;
    }
    return `<figure class="ga-concept"><svg role="img" aria-labelledby="${kind}-concept-title" viewBox="0 0 360 180"><title id="${kind}-concept-title">${title}</title>${drawing}</svg><figcaption>Conceptual illustration, not a measured chart</figcaption></figure>`;
}

function panel(
    title: string,
    kind: "energy" | "thermal" | "precision" | "model",
    accessible: string,
    content: string,
): string {
    return `<section class="ga-evidence-panel"><h2>${title}</h2>${diagram(kind, accessible)}${content}</section>`;
}

const legend = `<ul class="ga-evidence-legend" aria-label="Evidence classes"><li><span class="ga-badge">Manufacturer spec</span> Vendor rating</li><li><span class="ga-badge">Research measurement</span> Paper-specific test</li><li><span class="ga-badge">Estimate</span> Conditional inference</li><li><span class="ga-badge">Unknown</span> Not established</li></ul>`;
const photoNote = `<p class="ga-photo-provenance">Manufacturer/distributor product image: not a measured test. Catalog photos are illustrative; confirm the installed variant and firmware. Original watermarks preserved.</p>`;
const mirrorNote =
    "Source: third-party mirror; TLS certificate expired at retrieval; not Xiaomi-origin authenticated. Provenance confidence: moderate.";

export function comparisonDashboard(): string {
    const cards =
        photo(
            "cubemars-ak80-9",
            "AK80-9 V3.0 KV100",
            "CubeMars AK80-9 V3.0 KV100",
            chip("Nominal bus", "48 V") +
                chip("Rated output", "9 N·m") +
                chip("Peak output", "22 N·m") +
                chip("Listed mass", "490 g") +
                chip("Reduction", "9:1"),
            source(AK, "CubeMars model page"),
            "Peak is not sustained duty. Firmware unconfirmed.",
        ) +
        photo(
            "xiaomi-cybergear",
            "Original CyberGear",
            "Xiaomi CyberGear, original configuration illustrative",
            chip("Nominal bus", "24 V") +
                chip("Rated output", "4 N·m") +
                chip("Peak output", "12 N·m") +
                chip("Listed mass", "317 ±3 g") +
                chip("Reduction", "7.75:1"),
            source(CYBER, "Original Chinese manual, mirror"),
            "Document-scoped configuration, not a named hardware revision. Peak is not sustained duty.",
        );
    return `<div class="ga-dashboard"><p class="ga-deck">Size from documented ratings. Validate performance on the same mission.</p><div class="ga-product-pair">${cards}</div>${photoNote}<p class="ga-provenance-alert">CyberGear source caveat: ${mirrorNote} Vendor cooling and mounting conditions are not shown to match AK.</p>${legend}<div class="ga-editorial-grid">
${panel("Efficiency", "energy", "Energy flow: bus to driver to motor to gearbox to output", `<p><span class="ga-badge">Unknown</span> Matched bus-to-output efficiency. No demonstrated winner.</p><p><span class="ga-badge">Estimate</span> Measure shared torque–speed points, then replay the mission. Reducer efficiency is not complete-actuator efficiency. ${source(URS, "Urs et al., measurement boundary")}</p>`)}
${panel("Cooling", "thermal", "Thermal path: winding to housing to ambient", `<p><span class="ga-badge">Manufacturer spec</span> CyberGear: <strong>12 N·m for 28 s</strong> at <strong>24 rpm</strong>, <strong>25 °C ambient</strong>, <strong>120 °C winding endpoint</strong>. ${source(CYBER, "Manual §1.3.15, pp. 4–5")}</p><p class="ga-limit">${mirrorNote} Initial winding state and fixture unspecified; recovery time unknown. Not a repeatable duty-cycle guarantee.</p><p><span class="ga-badge">Unknown</span> AK equivalent overload/recovery envelope; matched warm-cycle endurance. ${source(AK, "AK model page")} ${source(FAMILY, "AK family manual")}</p>`)}
${panel("Precision", "precision", "Precision distinction: inner encoder sensing versus independently measured load-side error", `<p><span class="ga-badge">Manufacturer spec</span> AK model: <strong>16-bit</strong> inner encoder; family manual: <strong>21-bit</strong>. Unresolved revision/scope conflict. ${source(AK, "Model page")} ${source(FAMILY, "Manual V3.2.0")}</p><p><span class="ga-badge">Unknown</span> Matched loaded accuracy and repeatability. Encoder bits are not load-side precision. ${source(CYBER, "CyberGear manual, mirror")}</p>`)}
${panel("Sim2real", "model", "Sim2real workflow: simulation to identification to held-out validation", `<p><span class="ga-badge">Research measurement</span> Command history and static friction matter in other robots; not AK/CyberGear benchmarks. ${source(ANYMAL, "ANYmal")} ${source(FRICTION, "Static-friction study")}</p><p><span class="ga-badge">Unknown</span> Matched transfer error. Pin firmware, mode and gains; validate on unseen loads.</p>`)}
</div><aside class="ga-verdict"><h2>Best inference: requirements first</h2><p><span class="ga-badge">Estimate</span> Screen AK for higher published torque; CyberGear for lower listed mass and compatible voltage. Assumption: the required simultaneous torque–speed point and installed cooling are verified. Confidence: moderate for screening, low for a performance ranking. ${source(AK, "AK ratings")} ${source(CYBER, "CyberGear ratings, mirror")}</p><p><strong>No quantified efficiency, cooling, precision or sim2real advantage established.</strong></p></aside><p><a href="/guides/robot-actuator-selection">Selection workflow →</a></p></div>`;
}

export function guideDashboard(): string {
    const cards =
        photo(
            "leaderdrive-lcs",
            "Reducer ≠ complete actuator",
            "Leaderdrive LCS cup-shaped strain-wave reducer",
            chip("LCS-I input", "Keyed shaft") +
                chip("LCS-II input", "Oldham coupling") +
                chip("Integration", "Motor not included"),
            source("https://www.leaderdrive.com/product/6.html", "Leaderdrive LCS"),
            "Family illustration; select the actual variant.",
        ) +
        photo(
            "nidec-smart-flexwave-srh",
            "Sensing ≠ integrated motor",
            "Nidec Smart-FLEXWAVE SRH sensorized hollow-shaft reducer",
            chip("Family", "Hollow-shaft reducer") +
                chip("WPU-SRH-BD", "Sensor configuration") +
                chip("Integration", "Confirm electronics"),
            source(
                "https://www.nidec-dtc.com/product/srh-series-wpu-srh-bd/",
                "Nidec WPU-SRH-BD",
            ),
            "A sensorized reducer is not a complete servo joint.",
        );
    return `<div class="ga-dashboard"><p class="ga-deck">Four checks. One installed joint. Peak torque is only a starting point.</p><div class="ga-product-pair">${cards}</div>${photoNote}${legend}<div class="ga-editorial-grid">
${panel("Efficiency", "energy", "Energy flow: bus to driver to motor to gearbox to output", `<p><span class="ga-badge">Research measurement</span> Compare measured bus power with output torque × speed. ${source(URS, "Actuator characterization")}</p><ul><li>Shared operating points; signed energy.</li><li>Record temperature, idle and cooling power.</li></ul><p><span class="ga-badge">Unknown</span> Product winner without matched measurements.</p>`)}
${panel("Cooling", "thermal", "Thermal path: winding to housing to ambient", `<p><span class="ga-badge">Estimate</span> Identify winding/housing heat paths in the installed fixture. ${source(THERMAL, "Thermal identification")}</p><ul><li>Cold start + warm repeated cycles.</li><li>Validate recovery and restart conditions.</li></ul><p><span class="ga-badge">Unknown</span> Runtime or cooldown without losses, thermal parameters and limits. Battery endurance is not thermal duty.</p>`)}
${panel("Precision", "precision", "Precision distinction: encoder resolution versus externally measured load-side error", `<p><span class="ga-badge">Proposed protocol</span> Separate reversal play, compliance and external output metrology. ${source(URS, "Actuator characterization")}</p><ul><li>Accuracy: bias against a reference.</li><li>Repeatability: repeated-output spread.</li></ul><p><span class="ga-badge">Unknown</span> Loaded precision from encoder bits alone.</p>`)}
${panel("Sim2real", "model", "Sim2real workflow: simulation to identification to held-out validation", `<p><span class="ga-badge">Research measurement</span> History, delay and stiction affect transfer in published robots. ${source(ANYMAL, "ANYmal")} ${source(FRICTION, "Static friction")}</p><ul><li>Pin firmware, gains and current scaling.</li><li>Identify; validate unseen trajectories.</li></ul><p><span class="ga-badge">Unknown</span> Transfer advantage without held-out results.</p>`)}
</div><aside class="ga-verdict"><h2>Your acceptance sheet</h2><p>Exact revision · Mission energy · Warm duty · Loaded repeatability · Held-out model error</p><p><span class="ga-badge">Estimate</span> Prefer the simplest candidate meeting the measured mission with a justified margin. Assumption: installed tests represent the mission. No universal numeric margin inferred.</p></aside><p><a href="/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear">See the AK80-9 / CyberGear evidence dashboard →</a></p></div>`;
}
