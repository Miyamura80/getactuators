// Public API of the 3D explode kit. Importing from here costs only the light
// wrappers; three.js and the part library load in a lazy chunk when a scene
// first comes into view on a WebGL-capable browser.
//
//   <ExplodeScene {...QDD_JOINT} onSelectPart={...} />
//   <ProcessLoop loop={MAGNET_PRESS_LOOP} />
//
// Scene data (PartSpec, ProcessLoopSpec) lives in src/supply-chain/scenes so
// registry records can carry it. For JSX-composed scenes, import the named
// part components from ./parts/Part inside a lazily loaded module.

export { ExplodeScene, type ExplodeSceneProps } from "./ExplodeScene";
export { ProcessLoop, type ProcessLoopProps } from "./ProcessLoop";
export { hasWebGL, scrollProgress, useReducedMotion, useScrollProgress } from "./support";
