// Editorial evidence only: never imports or changes raw catalog records.
export type EngineeringTopic = "efficiency" | "thermal" | "precision" | "modeling";
export interface EngineeringEvidenceItem {
    status: "manufacturer" | "research" | "unknown";
    summary: string;
    scope: string;
    sources: { label: string; url: string; locator: string }[];
}
export interface EngineeringEvidence {
    revision: string;
    warnings: string[];
    topics: Record<EngineeringTopic, EngineeringEvidenceItem>;
}
const akManual =
    "https://www.cubemars.com/data/cms/202602/ak-series-prodcut-manual-v3-2-0-for-ak-3-0-robotic-actuator.pdf";
const cgManual =
    "https://roboticscv.com/wp-content/uploads/pdf/CyberGear%E5%BE%AE%E7%94%B5%E6%9C%BA%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E%E4%B9%A6.pdf";
const mySheet =
    "https://www.myactuator.com/_files/archives/cab28a_85824a1893de4b058080c363664a1c9f.zip";
const myManual =
    "https://www.myactuator.com/_files/archives/cab28a_82abda57fa5a4db1b99e86d416ba2e94.zip";
const source = (label: string, url: string, locator: string) => ({
    label,
    url,
    locator,
});
const evidence: Record<string, EngineeringEvidence> = {
    "cubemars-ak80-9": {
        revision: "AK80-9 V3.0 KV100; installed hardware/firmware unconfirmed",
        warnings: [
            "Document review, not independent bench validation. Retained catalog mass and encoder conflicts remain unresolved.",
        ],
        topics: {
            efficiency: {
                status: "manufacturer",
                summary:
                    "Manufacturer 48 VDC KV100 torque sweep plots efficiency, output power, current and varying speed; no numeric efficiency is digitized here.",
                scope: "Electrical-input boundary, temperature, cooling, duration, uncertainty and graph revision are unspecified. Complete bus-to-output efficiency remains unknown.",
                sources: [
                    source(
                        "Manufacturer operating curve",
                        "https://www.cubemars.com/images/20250424/1745462214935457.jpg",
                        "Image title AK80-9 KV100@48VDC; efficiency/output power/current/speed axes",
                    ),
                ],
            },
            thermal: {
                status: "manufacturer",
                summary:
                    "Manual exposes separate motor/MOS temperature and fault telemetry, and serial input voltage/current versus output and d/q currents.",
                scope: "Telemetry is not calibrated winding-hotspot metrology. Mounting-specific repeated duty, overload recovery and cooldown remain unknown; board and module limits are different scopes.",
                sources: [
                    source(
                        "AK manual V3.2.0",
                        akManual,
                        "PDF pp47,50, section 4.3; temperature/fault and serial feedback fields",
                    ),
                ],
            },
            precision: {
                status: "manufacturer",
                summary:
                    "Manual p4 specifies 16-bit sensing, up to 21-bit with custom firmware; p8 still lists unqualified 21-bit.",
                scope: "This does not reconcile the retained 14-bit catalog or installed revision. Loaded output accuracy and bidirectional repeatability remain unknown; encoder resolution is not accuracy.",
                sources: [
                    source(
                        "AK manual V3.2.0",
                        akManual,
                        "PDF p4 sensing/firmware qualifier; p8 family driver inner-loop encoder specification; p7 compatibility table",
                    ),
                ],
            },
            modeling: {
                status: "manufacturer",
                summary:
                    "Official archive contains AK80-9 V3.0.STEP geometry; manual documents no-load identification, parameter export and version inspection.",
                scope: "CAD and configuration are not calibrated dynamics. Published AK80-9 regressions use Dephy FASTER, not the stock V3.0 driver; neither coefficients nor bandwidth transfer. Held-out stock-model validation remains unknown.",
                sources: [
                    source(
                        "Official CAD",
                        "https://www.cubemars.com/data/cms/202602/ak80-9-v3-0-robotic-actuator-3d-drawing.zip",
                        "AK80-9 V3.0.STEP; AP214 HEADER identifies V3.0 KV100",
                    ),
                    source(
                        "AK manual V3.2.0",
                        akManual,
                        "PDF pp17–21, sections 3.1.1–3.1.2; no-load identification and heating warning",
                    ),
                    source(
                        "Nesler et al. 2022",
                        "https://locolab.robotics.umich.edu/documents/NeslerGregg-RAL2022.pdf",
                        "PDF pp4–5, section III.B–D, Fig7; legacy AK80-9/Dephy regression",
                    ),
                    source(
                        "Zhao et al. 2024",
                        "https://locolab.robotics.umich.edu/documents/ZhaoWaltersGregg-BioRob2024.pdf",
                        "PDF pp2–5, section II.C–D, Table I; Dephy FASTER test configuration",
                    ),
                ],
            },
        },
    },
    "xiaomi-cybergear": {
        revision: "Original CyberGear, 24 V / 7.75:1 / 317 g; not CyberGear 2.0",
        warnings: [
            "Manufacturer-branded Chinese manual retrieved from an unauthenticated third-party mirror with expired TLS certificate; provenance confidence moderate. Installed hardware/firmware unpinned. Document review, not bench validation.",
        ],
        topics: {
            efficiency: {
                status: "unknown",
                summary:
                    "No complete bus-to-output efficiency map established in the reviewed original manual; its torque–speed curve is not efficiency.",
                scope: "Iq/phase current and bus voltage do not substitute for synchronized bus-power and output-torque measurements; regeneration and idle losses remain unknown.",
                sources: [
                    source(
                        "Chinese manual (mirror)",
                        cgManual,
                        "PDF pp4,6,15–16; parameter/telemetry tables; reviewed pp1–30",
                    ),
                ],
            },
            thermal: {
                status: "manufacturer",
                summary:
                    "Vendor overload table includes 11 N·m/45 s, 10/60, 9/90, 7/320 at 24 rpm, 25 °C ambient and 120 °C winding endpoint.",
                scope: "120 °C is not a protection setting: board ceiling 80 °C, CAN default motor warning/fault 75/80 °C. Initial winding temperature, mounting/airflow, NTC-to-winding offset and repeat-cycle recovery are unknown; no cooldown inferred.",
                sources: [
                    source(
                        "Chinese manual (mirror)",
                        cgManual,
                        "PDF pp4–5 section 1.3.15 overload table; p6 board limit; p24 section 4.1.10 CAN defaults",
                    ),
                ],
            },
            precision: {
                status: "unknown",
                summary:
                    "14-bit single-turn sensing and reported load-side position do not establish loaded accuracy, mechanical play or bidirectional repeatability.",
                scope: "Independent external-reference loaded metrology was not established in these reviewed sources; resolution is not accuracy.",
                sources: [
                    source(
                        "Chinese manual (mirror)",
                        cgManual,
                        "PDF pp6,10,15–16,25; encoder and position feedback tables",
                    ),
                ],
            },
            modeling: {
                status: "research",
                summary:
                    "Author-reported exploratory MuJoCo identification fits friction/inertia, then manually retunes inertia after a 10 Hz mismatch, worsening step-response agreement.",
                scope: "Not peer-reviewed or a portable calibrated model: torque scaling assumed, revision unpinned, raw data and held-out load/temperature errors unavailable. Record AppCodeVersion/AppGitVersion and actual gains; CAN reads 0x7019–0x701D require unspecified newer firmware and are not debugger-only extended telemetry. Type18 writes are power-off volatile.",
                sources: [
                    source(
                        "hossyan exploratory identification",
                        "https://zenn.dev/hossyan/articles/2406675c7d76a3",
                        "Sections 2.1–2.3/results/high-frequency validation; manual inertia retuning",
                    ),
                    source(
                        "Chinese manual (mirror)",
                        cgManual,
                        "PDF p13 identity; pp14–16 debugger fields; pp24–25 volatile writes/conditional CAN reads",
                    ),
                ],
            },
        },
    },
    "myactuator-rmd-x8-pro-v2": {
        revision:
            "RMD-X8-Pro 1:9 V2 / current X8-25 alias; unchanged winding/driver/firmware not established",
        warnings: [
            "Current X8-25 documents rate 10 N·m / 125 W / 110 rpm versus legacy 13 N·m / 166 W / 122 rpm and 160 rpm no-load. Catalog fields are retained, not revalidated.",
            "Current sheet says 48 V; legacy says 24–48 V. IP54 and brake are customization options, not established standard-unit features. Document review, not bench validation.",
        ],
        topics: {
            efficiency: {
                status: "manufacturer",
                summary:
                    "Current X8-25 curve prints 80.8%, 7.19 N·m, 242.0 rpm, 47.99 V, 4.676 A, 224.36 W input and 181.30 W output; source arithmetic discrepancy: torque × angular speed gives 182.21 W and 81.21% of printed input, not the printed output/efficiency.",
                scope: "Printed values are retained, not corrected; not a coherent verified operating point. Current characteristic sweep only; applicability to the legacy catalog unit is unconfirmed. Electrical metering location, driver/cable loss boundary, thermal state, dwell and uncertainty are unspecified; not a verified bus-to-output map or continuous-duty guarantee.",
                sources: [
                    source(
                        "X8-25 product archive",
                        mySheet,
                        "240814 product parameter PDF p1, Motor Characteristic Curve summary/table",
                    ),
                    source(
                        "X Series V2 manual archive",
                        myManual,
                        "X Series-V2 Product Manual-241227.pdf, PDF p5 / printed E-11/12, characteristic curve",
                    ),
                ],
            },
            thermal: {
                status: "manufacturer",
                summary:
                    "Current rated-torque footnote specifies 24 °C ambient, no other heat dissipation, rated speed and 60 °C rise to thermal equilibrium.",
                scope: "Applies to current 10 N·m / 110 rpm, not the legacy 13 N·m rating without confirmation. Sensor location, fixture conduction, equilibrium criterion, repeated peak duty and recovery remain unknown.",
                sources: [
                    source(
                        "X Series V2 manual archive",
                        myManual,
                        "X Series-V2 Product Manual-241227.pdf, PDF p5 / E-11/12, rated-torque footnote",
                    ),
                ],
            },
            precision: {
                status: "manufacturer",
                summary:
                    "240814 sheet says 16-bit input encoder; 241227 manual/current page say 18 bits. Current backlash is 10 arcmin versus legacy 5 arcmin.",
                scope: "Installed revision remains unresolved. Encoder resolution/backlash do not establish loaded output accuracy or bidirectional repeatability; those remain unknown.",
                sources: [
                    source(
                        "X8-25 product archive",
                        mySheet,
                        "240814 product parameter PDF p1, encoder/backlash table",
                    ),
                    source(
                        "X Series V2 manual archive",
                        myManual,
                        "X Series-V2 Product Manual-241227.pdf, PDF p5, encoder/backlash table",
                    ),
                    source(
                        "Legacy manufacturer manual (RobotShop mirror)",
                        "https://cdn.robotshop.com/media/M/Mya/RBC-Mya-19/pdf/RMD-X%20V2%20Series%20Product%20Manual.pdf",
                        "PDF p9 / printed pp15–16, X8-Pro V2 1:9, item A00085; revision date unresolved",
                    ),
                ],
            },
            modeling: {
                status: "manufacturer",
                summary:
                    "Official X8-25 archive contains drawings and AP214 STEP geometry whose HEADER identifies RMD-X8pro-P9 V2.step, exported by SolidWorks 2020.",
                scope: "Geometry/tabulated inertia are not identified friction, compliance, control delay or validated sim2real dynamics. Driver V3 / protocol V4.2 cover does not establish compatibility with the catalog MC-X-300-O hardware/firmware; calibrated model remains unknown.",
                sources: [
                    source(
                        "X8-25 product archive",
                        mySheet,
                        "Archive drawing/STEP members; RMD-X8pro-P9 V2.step HEADER, 2023-12-27",
                    ),
                    source(
                        "Driver/protocol archive",
                        myManual,
                        "MC driver manual V3.0 cover; protocol PDF p1, Applicable driver V3 / Version V4.2 / 2024.05",
                    ),
                ],
            },
        },
    },
};

export function engineeringEvidenceFor(id: string): EngineeringEvidence | undefined {
    return Object.hasOwn(evidence, id) ? evidence[id] : undefined;
}
