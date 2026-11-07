// Which chain a step id belongs to, without loading the chains (their 3D
// vignettes are heavy). Links from other pages (/bom's process chips) use it
// to add ?chain= for steps outside the first chain. A test keeps this list
// equal to each chain's steps.

export const CHAIN_STEP_INDEX: Readonly<Record<string, readonly string[]>> = {
    precision: [
        "flexspline-forging",
        "flexspline-forming",
        "flexspline-hardening",
        "flexspline-hobbing",
        "flexspline-shot-peening",
        "circular-spline-cutting",
        "wave-generator-grinding",
        "strain-wave-assembly",
        "strain-wave-testing",
        "roller-screw-turning",
        "screw-hardening",
        "screw-thread-grinding",
        "roller-thread-grinding",
        "nut-thread-grinding",
        "roller-screw-assembly",
        "lead-accuracy-test",
        "bearing-steel-refining",
        "ring-forging",
        "ring-hardening",
        "raceway-grinding",
        "raceway-superfinishing",
        "rolling-element-sorting",
        "bearing-assembly",
        "bearing-noise-test",
        "scale-substrate",
        "grating-lithography",
        "magnetic-pole-writing",
        "readhead-assembly",
        "interpolation-asic",
        "encoder-calibration",
        "encoder-sealing",
    ],
};

// The chain id holding `stepId` when it is not the first chain, else null.
export function otherChainOf(stepId: string): string | null {
    for (const [chain, ids] of Object.entries(CHAIN_STEP_INDEX))
        if (ids.includes(stepId)) return chain;
    return null;
}
