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

// Original conceptual schematics. No measured axes, fitted curves or scores.
function diagram(
    kind: "energy" | "thermal" | "precision" | "model",
    title: string,
): string {
    const box = (x: number, y: number, text: string) =>
        `<rect x="${x}" y="${y}" width="96" height="48" rx="7"/><text x="${x + 48}" y="${y + 29}" text-anchor="middle">${text}</text>`;
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
