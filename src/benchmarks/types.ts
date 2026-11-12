// Measured actuator performance: one BenchmarkRun per folder
// data/benchmarks/<actuator-id>/<run-id>/run.json. The protocol behind each
// field is docs/benchmarks/protocol.md. Relative imports only: the browser
// bundle reuses this module.

// published: a paper, thesis, vendor test report, blog or video we cite.
// lab: run on our own rig. community: submitted by pull request, raw data in
// the folder, approved by a maintainer.
export const BENCHMARK_ORIGINS = ["published", "lab", "community"] as const;
export type BenchmarkOrigin = (typeof BENCHMARK_ORIGINS)[number];

export const SOURCE_KINDS = ["paper", "thesis", "vendor", "blog", "video"] as const;
export type BenchmarkSourceKind = (typeof SOURCE_KINDS)[number];

// raw: CSVs from the rig sit in the folder. tabulated: copied from a table in
// the source. digitised: read off a published plot (never raw data).
// reported: single figures quoted in the source's text (a quoted range is
// entered as its mid-point with the half-width as uncertainty).
export const DATA_METHODS = ["raw", "tabulated", "digitised", "reported"] as const;
export type DataMethod = (typeof DATA_METHODS)[number];

// Who stands behind the numbers. Only independent runs get a verdict against
// the datasheet: the maker's own test (vendor) or a test by someone who sells
// products built on the actuator (vendor-affiliated) is shown without one.
export const BENCHMARK_INDEPENDENCE = [
    "vendor",
    "vendor-affiliated",
    "independent",
] as const;
export type BenchmarkIndependence = (typeof BENCHMARK_INDEPENDENCE)[number];

export const INDEPENDENCE_LABEL: Record<BenchmarkIndependence, string> = {
    vendor: "Vendor",
    "vendor-affiliated": "Vendor-affiliated",
    independent: "Independent",
};

// How a datasheet value is meant: a typical figure, or an upper limit
// ("0.5° or less") that a measurement can only stay within or exceed.
export const CLAIM_BOUNDS = ["typical", "max"] as const;
export type ClaimBound = (typeof CLAIM_BOUNDS)[number];

// Run metrics a datasheet claim in run.json can be set against.
export const CLAIM_METRICS = ["peakTorqueNm", "noLoadRpm", "backlashArcmin"] as const;
export type ClaimMetric = (typeof CLAIM_METRICS)[number];

// A datasheet value the catalog does not carry, as the run's source quotes it.
export interface DatasheetClaim {
    metric: ClaimMetric;
    value: number;
    // Where the value comes from, and whether the maker's own document was
    // checked.
    source: string;
    // Omitted means "typical".
    bound?: ClaimBound;
}

export interface BenchmarkRig {
    torqueSensor: string;
    // Accuracy class of the torque transducer, % of full scale. Null when a
    // published source does not state it.
    accuracyPct: number | null;
    encoder: string;
    ambientC: number | null;
    busV: number | null;
    controller: string;
    firmware?: string;
}

export interface TorqueSpeedPoint {
    rpm: number;
    torqueNm: number;
    // Shaft power out over electrical power in, 0 to 1.
    efficiency?: number;
}

export interface ThermalPoint {
    torqueNm: number;
    // Seconds at this torque before the winding limit or thermal derating;
    // null when the run held it without reaching the limit (continuous).
    tToLimitS: number | null;
    windingRiseC?: number;
}

export interface BenchmarkRun {
    actuatorId: string;
    runId: string;
    // When the run was done or published: YYYY, YYYY-MM or YYYY-MM-DD. An
    // undated web page is dated when it was read.
    date: string;
    origin: BenchmarkOrigin;
    // Required for published runs; its url must be in ./sources.ts.
    source?: { url: string; title: string };
    sourceKind?: BenchmarkSourceKind;
    // GitHub handle, community runs only.
    submitter?: string;
    dataMethod: DataMethod;
    independence: BenchmarkIndependence;
    // The evidence for `independence`: who ran the test and any tie to the
    // maker or a seller.
    independenceNote: string;
    // How the numbers were taken or read, in our own words.
    methodNote?: string;
    // Hardware revision or variant tested, when it differs from the catalog
    // entry or matters.
    revision?: string;
    // True when the hardware tested is not the catalog entry's revision: the
    // run is shown but left out of datasheet deltas and the leaderboard.
    otherRevision?: boolean;
    // Why a run on the catalog revision is still kept out of datasheet deltas
    // and the leaderboard (for example a driver limit, or data the source
    // appears to have copied from another model). Shown, not ranked.
    notRanked?: string;
    rig: BenchmarkRig;
    torqueSpeed?: TorqueSpeedPoint[];
    thermal?: ThermalPoint[];
    peakTorqueNm?: number;
    noLoadRpm?: number;
    backlashArcmin?: number;
    stiffnessNmPerRad?: number;
    frictionNm?: number;
    ripplePct?: number;
    bandwidthHz?: number;
    latencyMs?: number;
    repeatabilityArcmin?: number;
    // Plus or minus, in each metric's own unit (N·m for the torque-speed and
    // thermal curves), keyed by metric name, plus `efficiency` (a fraction)
    // when the T-N points carry efficiency.
    uncertainty: Record<string, number>;
    // Datasheet values to compare against when the catalog has none; a
    // catalog value wins when both exist.
    claims?: DatasheetClaim[];
    // Why a result outside the plausibility band is still right.
    plausibilityNote?: string;
    note?: string;
}

// Every metric a run can report, with its unit and measurement group.
export const METRIC_GROUPS = [
    "torque-speed",
    "thermal",
    "transmission",
    "control",
] as const;
export type MetricGroup = (typeof METRIC_GROUPS)[number];

export const METRICS = {
    torqueSpeed: { label: "T-N curve", unit: "N·m", group: "torque-speed" },
    peakTorqueNm: { label: "Peak torque", unit: "N·m", group: "torque-speed" },
    noLoadRpm: { label: "No-load speed", unit: "rpm", group: "torque-speed" },
    thermal: { label: "Thermal derating", unit: "N·m", group: "thermal" },
    backlashArcmin: { label: "Backlash", unit: "arcmin", group: "transmission" },
    stiffnessNmPerRad: {
        label: "Torsional stiffness",
        unit: "N·m/rad",
        group: "transmission",
    },
    frictionNm: { label: "Backdrive friction", unit: "N·m", group: "transmission" },
    ripplePct: { label: "Torque ripple", unit: "%", group: "transmission" },
    bandwidthHz: { label: "Bandwidth", unit: "Hz", group: "control" },
    latencyMs: { label: "Command latency", unit: "ms", group: "control" },
    repeatabilityArcmin: {
        label: "Repeatability",
        unit: "arcmin",
        group: "control",
    },
} as const satisfies Record<
    string,
    { label: string; unit: string; group: MetricGroup }
>;

export type MetricKey = keyof typeof METRICS;
export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

export const GROUP_LABEL: Record<MetricGroup, string> = {
    "torque-speed": "Torque-speed",
    thermal: "Thermal",
    transmission: "Transmission",
    control: "Control",
};

export const ORIGIN_LABEL: Record<BenchmarkOrigin, string> = {
    published: "Published",
    lab: "Lab",
    community: "Community",
};
