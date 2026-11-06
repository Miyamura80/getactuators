import type { ExcludedRobot } from "./types";

// Seed candidates checked against the inclusion rule (mechanical design, or
// full BOM plus build instructions, public with a licence stated for those
// files) that do not pass it yet. An open SDK alone does not qualify.

export const EXCLUDED_ROBOTS: readonly ExcludedRobot[] = [
    {
        name: "HopeJR",
        url: "https://github.com/TheRobotStudio/HOPEJr",
        reason: "URDF and arm work are public, but the repository states no licence.",
        sources: ["hopejr-repo"],
    },
    {
        name: "Petoi Bittle",
        url: "https://github.com/PetoiCamp/OpenCat",
        reason: "Firmware and software are MIT; the frame and board designs are not published.",
        sources: ["opencat-repo"],
    },
    {
        name: "Mini Pupper",
        url: "https://github.com/mangdangroboticsclub/mini_pupper",
        reason: "Software is Apache-2.0; no licence is stated for the hardware design.",
        sources: ["mini-pupper-repo"],
    },
    {
        name: "Annin AR4",
        url: "https://www.anninrobotics.com/",
        reason: "Build files are downloadable, but no licence is named for them.",
        sources: ["ar4-hackster"],
    },
    {
        name: "Reachy 2",
        url: "https://pollen-robotics.com/reachy/",
        reason: "Open SDK and URDF only; CAD and BOM are not public.",
        sources: ["reachy2-robots"],
    },
];
