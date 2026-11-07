// Documents behind the /manufacturing precision chain (strain-wave gears,
// planetary roller screws, precision bearings, encoders): maker catalogues,
// machine-tool application notes, patents, papers, standards and a few
// public excerpts of market reports. Each backs one or two numbers in our
// own words; no table is copied.
//
// None was opened: page fetches from the research session were blocked, so
// every figure was confirmed from search results and carries no `accessed`
// date. Open each and add its `accessed` date when checked;
// PRECISION_UNOPENED is every source still without one, so it shrinks as
// documents are checked. Leaderdrive's own share claim is the registry's
// existing Gasgoo source.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "government"
    | "standards-body"
    | "industry-report"
    | "press"
    | "academic"
    | "company-site"
    | "reference";

type Reuse = "open" | "facts" | "restricted";

interface PrecisionSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: Reuse;
    paywalled?: boolean;
    // ISO date the document was opened and checked.
    accessed?: string;
}

const src = (
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind,
    reuse: Reuse,
    paywalled = false,
): PrecisionSource => ({
    id,
    publisher,
    title,
    url,
    kind,
    reuse,
    ...(paywalled ? { paywalled } : {}),
});

// Reuse: vendor pages, patents, papers with unclear terms, standards and
// press are facts; paywalled market reports are restricted (public summary
// lines only, at most three records each).
export const PRECISION_SOURCES: PrecisionSource[] = [
    // Strain-wave gear
    src(
        "emag-flexspline",
        "EMAG",
        "Flexspline machining for harmonic reducers",
        "https://www.emag.com/industries-solutions/workpieces/flexspline/",
        "company-site",
        "facts",
    ),
    src(
        "uspto-us4934212-flexspline",
        "USPTO",
        "US 4,934,212: Harmonic drive flexspline manufacture",
        "https://patents.google.com/patent/US4934212",
        "reference",
        "facts",
    ),
    src(
        "cnipa-cn118143592a-flexspline",
        "CNIPA (via Google Patents)",
        "CN118143592A: Manufacturing method of harmonic reducer flexspline",
        "https://patents.google.com/patent/CN118143592A/en",
        "reference",
        "facts",
    ),
    src(
        "liu-flexspline-peening-2022",
        "Surface and Coatings Technology",
        "Effect of fine particle peening on surface integrity of flexspline in harmonic drive (Liu et al., 2022)",
        "https://search.napstic.cn/literature/periodical/1cd46be1e652131a7b8d0181f30b4a57",
        "academic",
        "facts",
    ),
    src(
        "hd-csf-csg-catalog",
        "Harmonic Drive LLC",
        "CSF and CSG component sets and gear units catalogue",
        "https://www.harmonicdrive.net/_hd/content/documents/csf-csg.pdf",
        "company-site",
        "facts",
    ),
    src(
        "hd-csg-gh",
        "Harmonic Drive LLC",
        "CSG-GH servo gearhead",
        "https://www.harmonicdrive.net/products/servo-mount-gearheads/harmonic-drive/csg-gh",
        "company-site",
        "facts",
    ),
    src(
        "uspto-us6227775-internal-gears",
        "USPTO",
        "US 6,227,775: Internal gears and splines and milling method and apparatus for manufacturing same",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6227775",
        "reference",
        "facts",
    ),
    src(
        "emag-wave-generator",
        "EMAG",
        "Machining of wave generator components on the VLC 350 GT",
        "https://www.emag.com/industries-solutions/workpieces/wave-generator/",
        "company-site",
        "facts",
    ),
    src(
        "gbt-14118-1993",
        "SAC (via Chinese Standard)",
        "GB/T 14118-1993: Harmonic gear drive reducers",
        "https://www.chinesestandard.net/Related.aspx/GBT14118-1993",
        "standards-body",
        "facts",
    ),
    src(
        "gir-harmonic-drive-2024",
        "GlobalInfoResearch (via MarketResearch.com)",
        "Global Harmonic Drive Market 2024 by Manufacturers, Regions, Type and Application, Forecast to 2030",
        "https://marketresearch.com/GlobalInfoResearch-v4117/Global-Harmonic-Drive-Manufacturers-Regions-38257741",
        "industry-report",
        "restricted",
        true,
    ),
    // Planetary roller screw
    src(
        "nook-roller-screw",
        "Nook Industries",
        "Planetary roller screw assembly (product configurator)",
        "https://www.nookindustries.com/ProductDetail/ProductConfig/?id=105732",
        "company-site",
        "facts",
    ),
    src(
        "emag-roller-screw-threads",
        "EMAG",
        "High-precision machining of internal threads in nuts and shafts of planetary roller screws",
        "https://www.emag.com/industries-solutions/workpieces/robotics/nuts-for-planetary-roller-screws/",
        "company-site",
        "facts",
    ),
    src(
        "kim-roller-screw-2024",
        "KIM Co., Ltd.",
        "Roller screw catalogue 2024",
        "https://www.targikielce.pl/storage/file/core_files/2025/7/28/78a0aad485dac78ff8a4cc5656bff7dc/2024-Roller-Screw-KIM-Co-Ltd.pdf",
        "company-site",
        "facts",
    ),
    src(
        "docsurf-roller-screw",
        "doc.surf (Wikipedia mirror)",
        "Roller screw",
        "https://www.doc.surf/wiki/roller-screw",
        "reference",
        "facts",
    ),
    src(
        "uspto-us10267394-roller-sets",
        "USPTO",
        "US 10,267,394: Method for producing a planetary screw drive and kit for carrying out the method",
        "https://patents.google.com/patent/US10267394",
        "reference",
        "facts",
    ),
    src(
        "chinadaily-shuanglin-roller-screw-2026",
        "China Daily (Ningbo)",
        "Ningbo maker starts mass production of planetary roller screws",
        "https://ningbo.chinadaily.com.cn/2026-01/27/c_1157428.htm",
        "press",
        "facts",
    ),
    src(
        "humanoid-guide-actuator-suppliers",
        "Humanoid.guide",
        "Who builds the joints? The humanoid actuator supplier landscape in 2026",
        "https://humanoid.guide/humanoid-actuator-supplier-landscape/",
        "press",
        "facts",
    ),
    src(
        "chineseoptics-lead-interferometer-2010",
        "Chinese Optics",
        "Real-time Abbe error correction in laser interferometer measurement of lead screws",
        "https://chineseoptics.net.cn/en/article/id/8486",
        "academic",
        "facts",
    ),
    src(
        "med-technews-rollvis",
        "Med-Tech News",
        "Swiss Roll: Rollvis satellite roller screws on display at MED",
        "https://med-technews.com/swiss-roll-rollvis-satellite-roller-screws-on-display-at-med",
        "press",
        "facts",
    ),
    src(
        "qyr-roller-screws-2025",
        "QYResearch (via GII)",
        "Roller screws: global market share and ranking, overall sales and demand forecast",
        "https://www.gii.tw/report/qyr1872678-roller-screws-global-market-share-ranking-overall.html",
        "industry-report",
        "restricted",
        true,
    ),
    src(
        "schaeffler-ewellix-purchase",
        "Schaeffler (via Mynewsdesk)",
        "Schaeffler further strengthens industrial business with purchase of Ewellix Group",
        "https://www.mynewsdesk.com/se/schaeffler/pressreleases/schaeffler-further-strengthens-industrial-business-with-purchase-of-ewellix-group-3196733",
        "press",
        "facts",
    ),
    src(
        "gsa-roller-screw-catalog",
        "GSA (via MECSPE)",
        "GSA roller screw catalogue",
        "https://espositori.mecspe.com/portal/en/gsa-ag/catalogs/roller-screw",
        "company-site",
        "facts",
    ),
    // Precision bearing
    src(
        "jstage-bearing-steel-oxygen-1985",
        "Tetsu-to-Hagane (ISIJ)",
        "Production of high-cleanliness bearing steel by EF-LF-RH and continuous casting (Tetsu-to-Hagane 71(14), 1985)",
        "https://www.jstage.jst.go.jp/article/tetsutohagane1955/71/14/71_14_1631/_article",
        "academic",
        "facts",
    ),
    src(
        "nsk-ti-0004",
        "NSK Europe",
        "Technical insight: bearing steel cleanliness and fatigue life",
        "https://nsk.com/content/dam/nsk/eu/en_gb/documents/P_TI-0004_EN.pdf",
        "company-site",
        "facts",
    ),
    src(
        "ncu-bearing-ring-forging-2011",
        "National Central University (Taiwan)",
        "Master's thesis on multi-stage forging and cold rolling of bearing rings",
        "https://ir.lib.ncu.edu.tw/handle/987654321/66930",
        "academic",
        "facts",
    ),
    src(
        "uspto-us9540705-bearing-ring",
        "USPTO",
        "US 9,540,705: Method of manufacturing a bearing ring",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9540705",
        "reference",
        "facts",
    ),
    src(
        "cranfield-raceway-finishing",
        "Cranfield University",
        "Enhanced surface finishing of bearing raceways (Knight, PhD thesis)",
        "https://dspace.lib.cranfield.ac.uk/handle/1826/19427",
        "academic",
        "facts",
    ),
    src(
        "uspto-us8757886-rolling-bearing",
        "USPTO",
        "US 8,757,886: Rolling bearing",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8757886",
        "reference",
        "facts",
    ),
    src(
        "napstic-si3n4-superfinishing-2017",
        "Machinery & Electronics (via NAPSTIC)",
        "Superfinishing parameters for P4-grade raceway roughness of Si3N4 bearing rings (2017)",
        "https://opaj.napstic.cn/periodicalArticle/0120170400593583",
        "academic",
        "facts",
    ),
    src(
        "din-5401-balls",
        "Kugel Pompel",
        "Data sheet: dimensional and form accuracy and roughness of balls to DIN 5401",
        "https://www.kugelpompel.at/img/cms/Downloads/Datenbl%C3%A4tter%20Normen/Data%20sheet%20Dimensional%20shape%20accuracy%20and%20roughness%20DIN%205401%20V1-03.pdf",
        "reference",
        "facts",
    ),
    src(
        "thk-cross-roller-ring-catalog",
        "THK (distributor copy)",
        "Cross-Roller Ring catalogue",
        "https://cdn.shopify.com/s/files/1/1148/4670/files/Cross_Roller_Ring_-_Catalog.pdf",
        "company-site",
        "facts",
    ),
    src(
        "sugawara-bearing-inspection",
        "Sugawara Laboratories",
        "Bearing inspection systems",
        "https://www.sugawara-labs.co.jp/sites/default/files/pdf/bearing_inspection_system_en.pdf",
        "company-site",
        "facts",
    ),
    src(
        "morningstar-skf-profile",
        "Morningstar",
        "SKF AB: company summary",
        "https://www.morningstar.com.au/investments/security/osto/SKF%20A/summary",
        "press",
        "facts",
    ),
    // Encoder
    src(
        "heidenhain-general-catalog",
        "HEIDENHAIN",
        "General catalog: linear, angle and rotary encoders",
        "https://www.heidenhain.com/fileadmin/pdf/en/01_Products/Prospekte/PR_General_Catalog_ID350457_en.pdf",
        "company-site",
        "facts",
    ),
    src(
        "maxlevy-encoder-disks",
        "Max Levy Autograph",
        "Encoder disks, scales and reticles (capabilities brochure)",
        "https://static.elitesecurity.org/uploads/3/2/3220517/maxlevy.pdf",
        "company-site",
        "facts",
    ),
    src(
        "renishaw-resa30",
        "Renishaw",
        "RESOLUTE absolute encoder with RESA30 rotary (angle) ring",
        "https://www.renishaw.com/en/resolute-rotary-angle-absolute-encoder-options--10939",
        "company-site",
        "facts",
    ),
    src(
        "renishaw-resolute-datasheet",
        "Renishaw",
        "Data sheet: RESOLUTE absolute optical encoder system",
        "https://www.renishaw.com/resourcecentre/en/download/data-sheet-resolute-absolute-optical-encoder-system--146358",
        "company-site",
        "facts",
    ),
    src(
        "rls-magnetic-ring-accuracy",
        "RLS",
        "Accuracy of magnetic rings (FAQ note)",
        "https://www.rls.si/media/wysiwyg/RLS/FAQ/Accuracy_Magnetic_rings.pdf",
        "company-site",
        "facts",
    ),
    src(
        "rls-aksim-2",
        "RLS",
        "AksIM-2 off-axis rotary absolute encoder",
        "https://www.rls.si/eng/aksim-2",
        "company-site",
        "facts",
    ),
    src(
        "ichaus-tw8",
        "iC-Haus (via dtsheet)",
        "iC-TW8: 16-bit sin/cos interpolator with auto-calibration",
        "https://dtsheet.com/model/2006800",
        "company-site",
        "facts",
    ),
    src(
        "ubc-encoder-self-calibration",
        "University of British Columbia",
        "Ultra-precise on-axis encoder self-calibration for fast rotary platforms (thesis)",
        "https://circle.ubc.ca/handle/2429/7573",
        "academic",
        "facts",
    ),
    src(
        "mckinsey-humanoid-edge-2025",
        "McKinsey & Company",
        "China's humanoid robot edge (chart)",
        "https://www.mckinsey.com/featured-insights/week-in-charts/chinas-humanoid-robot-edge",
        "industry-report",
        "facts",
    ),
];

// Sources not yet opened and checked: those without an `accessed` date.
export const PRECISION_UNOPENED: ReadonlySet<string> = new Set(
    PRECISION_SOURCES.filter((s) => !s.accessed).map((s) => s.id),
);
