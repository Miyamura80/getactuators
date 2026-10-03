import type { Actuator } from "@/catalog/types";

// Metadata-only brand labels. Never change the source catalog's manufacturer
// attribution, visible names, Product schema or engineering content.
const SEO_BRANDS: Readonly<Record<string, string>> = {
    "Unitree Robotics": "Unitree",
    "Robotis (Dynamixel)": "Dynamixel",
    "CubeMars (T-Motor)": "CubeMars",
    "DAMIAO (DMBots)": "DAMIAO",
    "INNFOS (Mintasca)": "INNFOS",
    "Waveshare (Feetech OEM)": "Waveshare",
    "Harmonic Drive LLC": "Harmonic Drive",
    "Hiwonder (LewanSoul)": "Hiwonder",
    "iPower Motor (iFlight)": "iPower",
    "Spinea (Cone Drive)": "Spinea",
    "TQ-Systems (RoboDrive)": "TQ-RoboDrive",
    "Allied Motion / Allient": "Allied Motion",
    "ODrive Robotics": "ODrive",
    "Trampa / VESC Project": "Trampa",
    "Trinamic (Analog Devices)": "Trinamic",
    "Harmonic Drive (Harmonic Drive SE / LLC)": "Harmonic Drive",
    "Leaderdrive (Suzhou Leader Harmonic Drive)": "Leaderdrive",
    "Nidec Drive Technology (Nidec-Shimpo)": "Nidec",
    "LKMTech (LKTECH / Shanghai Lingkong)": "LKMTech",
};

// Reviewed labels for verbose families: retain model/family identity and useful
// component context rather than blindly deleting parentheses or clipping text.
// Unlisted models keep their complete catalog name, including voltage, KV,
// gear ratios and revisions. Length is a readability target, not a hard limit.
const SEO_MODELS: Readonly<Record<string, string>> = {
    "nabtesco-rv-42n": "RV-42N cycloidal reducer",
    "feetech-sts3250": "STS3250 (12V)",
    "feetech-sts3215": "STS3215 (12V)",
    "dynamixel-h54-200-s500-r": "H54-200-S500-R PRO",
    "waveshare-st3215": "ST3215",
    "waveshare-sc15": "SC15",
    "harmonic-drive-lpa-20": "LPA-20",
    "xiaomi-cybergear": "CyberGear",
    "spinea-drivespin-ds110": "DriveSpin DS110",
    "atar-arc-cycloidal-joint": "Arc Series Cycloidal Joint",
    "allied-motion-megaflux-mf0127": "Megaflux MF0127 frameless",
    "trinamic-tmc4671": "TMC4671 FOC controller",
    "harmonic-drive-sha-cg": "SHA-CG series",
    "harmonic-drive-cha-series": "CHA series",
    "leaderdrive-lhs": "LHS series strain-wave reducer",
    "leaderdrive-lhd": "LHD series hollow-shaft reducer",
    "leaderdrive-lcs": "LCS series cup-type reducer",
    "nidec-flexwave-wpg": "FLEXWAVE WPG gearhead",
    "nidec-smart-flexwave-srh": "Smart-FLEXWAVE SRH reducer",
    "dynamixel-ph54-200-s500-r": "PH54-200-S500-R Pro+",
    "dynamixel-pm54-060-s250-r": "PM54-060-S250-R Pro+",
};

export function actuatorSeoTitle(a: Actuator): string {
    const brand = SEO_BRANDS[a.brand] ?? a.brand;
    const model = SEO_MODELS[a.id] ?? a.name;
    const label = model.toLowerCase().startsWith(`${brand.toLowerCase()} `)
        ? model
        : `${brand} ${model}`;
    return `${label} specs`;
}
