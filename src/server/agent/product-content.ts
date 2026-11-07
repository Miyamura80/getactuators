// Editorial enrichment only: never replace SKU fields with family-table examples.
const leader = "https://www.leaderdrive.com";
const nidec = "https://www.nidec-dtc.com";
const flex = `${nidec}/wp-content/uploads/downloads/catalogs/nidec-flexwave-strain-wave-gear-reducer-catalog.pdf`;
const smart = `${nidec}/wp-content/uploads/downloads/catalogs/nidec-smart-flexwave-strain-wave-gear-reducer-catalog.pdf`;

interface ProductContent {
    summary: string;
    specifications: string;
    conflicts: string;
    modeling: string;
}

const content: Record<string, ProductContent> = {
    "leaderdrive-lcs": {
        summary:
            "Leaderdrive LCS cup-shaped strain-wave reducer family with keyed or Oldham-coupled input options; select frame, ratio and input variant.",
        specifications: `LCS uses a standard cup-shaped flexspline. LCS-I has keyed input; LCS-II uses an Oldham coupling. LCSG is a separate strengthened family. [Leaderdrive LCS, Models](${leader}/product/6.html).`,
        conflicts: `Frame 20, ratio 100 is an example, not a complete SKU. The [website table](${leader}/product/6.html) lists rated 40 Nm, start-stop 82 Nm, maximum average load 49 Nm, maximum peak 147 Nm and maximum input 6,500 rpm. The [LCS-I manual, PDF page 2 in ZIP](${leader}/uploadfile/file/20250725/1753419635322738.zip) instead lists 38 Nm at 2,000 rpm, start-stop 78 Nm, average 47 Nm, momentary 140 Nm and maximum input 6,000 rpm. Rating conditions and applicable revision need confirmation; do not combine them into SKU limits.`,
        modeling: `The [LCS geometry archive](${leader}/uploadfile/file/20250728/1753661078125719.zip) contains STEP and Parasolid geometry. Drawings and source-qualified mechanical tables support partial modeling, not a calibrated dynamics or thermal model.`,
    },
    "leaderdrive-lhd": {
        summary:
            "Leaderdrive LHD ultra-flat hollow-shaft strain-wave reducer family for constrained axial packaging, with direct or supported hollow-input variants.",
        specifications: `LHD prioritizes axial packaging. LHD-I uses direct input; LHD-III adds a supported, sealed hollow input for routing. The manufacturer's approximate 50% axial-length reduction versus LHS/LHSG is not a matched-SKU dimensional result. [Leaderdrive LHD, overview and Models](${leader}/product/2.html).`,
        conflicts: `For frame 20, ratio 100, the [website table](${leader}/product/2.html) lists rated 28 Nm, start-stop 57 Nm, average 34 Nm, peak 95 Nm, maximum input 6,500 rpm and backlash ≤10 arcsec. The [LHD-I manual, PDF page 2 in ZIP](${leader}/uploadfile/file/20250725/1753420859665519.zip) lists 27 Nm at 2,000 rpm, start-stop 54 Nm, average 32 Nm, momentary 90 Nm, maximum input 6,000 rpm and backlash ≤20 arcsec. Website zero-backlash prose conflicts with its numerical table. These are unresolved source/revision differences, not a basis for choosing the more favorable limit.`,
        modeling: `The [LHD geometry archive](${leader}/uploadfile/file/20250728/1753663504620515.zip) contains STEP and Parasolid files. Select the variant drawing before assigning mass, bore or envelope. Geometry is not a validated simulator package.`,
    },
    "leaderdrive-lhs": {
        summary:
            "Leaderdrive LHS hat-type strain-wave reducer family with keyed, coupled, supported hollow-input and input-shaft integration options.",
        specifications: `LHS has a hat-type, hollow-flanged construction. Variants include keyed I, cross-slider II, supported hollow-input III and supported input-shaft IV; III-ST and CL-III change packaging. A reducer input shaft is not an integrated electric motor. LHSG is separate. [Leaderdrive LHS, Models](${leader}/product/4.html).`,
        conflicts: `At frame 20, ratio 100, the [website](${leader}/product/4.html) lists rated 40 Nm, start-stop 82 Nm, average 49 Nm, peak 147 Nm and maximum input 6,500 rpm. The [LHS-I manual, PDF page 2 in ZIP](${leader}/uploadfile/file/20250725/1753424129693371.zip) lists 38 Nm at 2,000 rpm, start-stop 78 Nm, average 47 Nm, momentary 140 Nm and maximum input 6,000 rpm. Confirm applicable revision. Website starting/backdriving values are variant-specific: III is 32 cN·m / 38 Nm; IV is 9.9 cN·m / 12 Nm. Do not collapse them into a universal family value.`,
        modeling: `The [LHS geometry archive](${leader}/uploadfile/file/20250728/1753689892719593.zip) contains STEP files. Routing, enclosure and input details require the actual variant drawing; CAD does not establish calibrated simulation support.`,
    },
    "nidec-flexwave-wpg": {
        summary:
            "Nidec FLEXWAVE WPG housed, supported strain-wave gearhead for an externally selected motor; frame, ratio and motor mount code define the configuration.",
        specifications: `WPG is a single-stage, motor-mountable gearhead, not a motor-and-drive module. Frames 35 and 42 do not support every ratio offered in larger frames. [Nidec WPG, ratio matrix](${nidec}/product/wpg-gearhead/). For frame 50, ratio 100, the [FLEXWAVE catalog, printed page 68](${flex}) lists nominal 52 Nm, start-stop 107 Nm and catalog life 10,000 hours at 2,000 rpm input and nominal torque. The [WPG brochure, page 2](${nidec}/wp-content/uploads/2024/12/WPG-Brochure.pdf) separately lists 191 Nm emergency-stop torque; it is not continuous or normal start-stop torque.`,
        conflicts: `The [WPG brochure, page 2 footnote 4](${nidec}/wp-content/uploads/2024/12/WPG-Brochure.pdf) defines nominal input speed as an intermittent-operation average and discourages continuous operation. No duty percentage follows from that statement. The [gearhead lubrication section, printed page 75](${flex}) specifies factory-sealed Sumiplex SFB No.1 grease and 0–40°C ambient, not cooling hardware.`,
        modeling: `The [product page](${nidec}/product/wpg-gearhead/) advertises configurator CAD, but no WPG CAD download was verified in this review. Catalog main-bearing moment rigidity is not drivetrain torsional stiffness. Related WPU efficiency charts do not establish WPG efficiency.`,
    },
    "nidec-smart-flexwave-srh": {
        summary:
            "Nidec Smart-FLEXWAVE SRH sensorized hollow-shaft reducer with torque and internal-temperature sensing; distinguish WPU-SRH-BD from bare WPU-SRH.",
        specifications: `The sensorized WPU-SRH-BD has a cross-roller-supported flange and hollow input for routing; it is not an integrated motor. [Nidec SRH](${nidec}/product/srh-series-wpu-srh-bd/). The [Smart-FLEXWAVE catalog, pages 4–6](${smart}) gives frame 50, ratio 100 nominal 52 Nm, start-stop 107 Nm, emergency 191 Nm and life 7,692 hours at 2,000 rpm input and nominal torque. Sensor data lists 12-bit torque resolution, nonlinearity ±3% FS or less and hysteresis 3% FS or less within rated torque. These do not establish total-system accuracy or output-position repeatability. The 24 VDC supply and 3.0 Mbps half-duplex RS-485 are sensor electronics, not a motor bus or servo protocol.`,
        conflicts: `The [website](${nidec}/product/srh-series-wpu-srh-bd/) lists sensor current ≤0.06 A; the [catalog, page 5](${smart}) lists ≤0.1 A. Both are T.B.D.; final consumption is unknown. Catalog ±2°C temperature accuracy is also T.B.D. Frame 35/42 comparison masses 0.72/1.0 kg differ from dimensions/catalog values 0.78/1.05 kg. Certification prose says obtained while the table retains expected-in-2024 wording: request the certificate and scope rather than infer whole-machine compliance. Compensation notation ±0.05FS/°C lacks an explicit percent sign; do not normalize it.`,
        modeling: `Catalog frame-specific mass/inertia and sensing can assist identification, but no calibrated simulator package was verified. The [0–80°C sensor measurement/electronics range](${smart}) is not unrestricted reducer ambient or continuous thermal duty. Temperature monitoring is not cooling; ordinary WPU efficiency charts do not explicitly validate SRH-BD.`,
    },
};

export function productSummary(id: string): string | undefined {
    return content[id]?.summary;
}

// Reuse the exact editorial URLs in the main Sources list, without changing
// source catalog records or promoting legacy distributor notes to evidence.
export function engineeringSources(id: string): string[] {
    const p = content[id];
    if (!p) return [];
    return [
        ...new Set(
            [
                ...`${p.specifications}\n${p.conflicts}\n${p.modeling}`.matchAll(
                    /\]\((https:\/\/[^)]+)\)/g,
                ),
            ]
                .map((match) => match[1])
                .filter((url): url is string => Boolean(url)),
        ),
    ];
}

export function engineeringNotes(id: string): string {
    const p = content[id];
    if (!p) return "";
    return [
        "## Engineering notes",
        "Family-level evidence reviewed October 1, 2026. Manufacturer-published data is not independent bench validation. Examples below are not selected inventory SKUs; existing catalog fields are not replaced with family ranges.",
        "### Manufacturer specifications",
        p.specifications,
        "### Conditions and revision conflicts",
        p.conflicts,
        "### Engineering inference",
        p.modeling,
        "Inference assumes the selected drawing and applicable revision are confirmed. Confidence in model completeness is low; no numerical efficiency, cooldown or precision estimate is defensible from this evidence.",
        "### Unknown / confirmation required",
        "Numerical product-specific efficiency, cooling hardware, repeated thermal duty/derating, externally measured loaded output repeatability and calibrated simulation support remain unconfirmed in the reviewed material. Unknown is not zero. Encoder or sensor resolution is not output accuracy. Motor voltage, current and motor constants are not applicable to a reducer alone; select a motor/drive separately.",
        "Use the [robot actuator selection guide](/guides/robot-actuator-selection) to define the missing measurements and acceptance criteria.",
    ].join("\n\n");
}
