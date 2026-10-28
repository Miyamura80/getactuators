// Candidates checked against the inclusion rule and left off the list, with
// the reason. "Open SDK only" robots belong on /sdk instead.

export interface ExcludedCandidate {
    name: string;
    url: string;
    reason: string;
}

export const EXCLUDED_CANDIDATES: readonly ExcludedCandidate[] = [
    {
        name: "Reachy Mini",
        url: "https://github.com/pollen-robotics/reachy_mini",
        reason: "The README says hardware design files are CC BY-NC-SA, but no CAD or STEP files were found in the repository; SDK and sim are open.",
    },
    {
        name: "Reachy 2",
        url: "https://github.com/pollen-robotics/reachy2-sdk",
        reason: "Open SDK and URDF; no public mechanical design or build BOM.",
    },
    {
        name: "HopeJR",
        url: "https://github.com/TheRobotStudio/HOPEJr",
        reason: "Print files and STEP are public, but the repository states no licence.",
    },
    {
        name: "Zeroth-01",
        url: "https://github.com/zeroth-robotics/zeroth-bot",
        reason: "MIT software; the hardware files are not in the repository and the build docs could not be checked.",
    },
    {
        name: "AhaRobot",
        url: "https://github.com/aha-robot",
        reason: "Only a project website repository was found; the CAD and BOM could not be checked.",
    },
    {
        name: "Petoi Bittle",
        url: "https://github.com/PetoiCamp/OpenCat",
        reason: "OpenCat firmware is MIT, but the mechanical design is not published.",
    },
    {
        name: "Mini Pupper 4",
        url: "https://github.com/mangdangroboticsclub/mini_pupper",
        reason: "Open software stack on proprietary coreless servo joints; mechanical files not verified.",
    },
    {
        name: "Stanford Pupper v3",
        url: "https://github.com/stanfordroboticsclub/StanfordQuadruped",
        reason: "The project says build instructions are still to be released.",
    },
];
