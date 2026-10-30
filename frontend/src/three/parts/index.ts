import type { PartShape } from "../../../../src/supply-chain/scenes/spec";
import { boltPart, cylinderPart, housingPart, laminationPart, magnetRingPart, ringPart, windingPart } from "./rotary";
import {
    circularSplinePart,
    cycloidPart,
    flexsplinePart,
    planetaryPart,
    spurGearPart,
    waveGeneratorPart,
} from "./drives";
import { ballScrewPart, bearingPart, rollerScrewPart } from "./screws";
import { encoderPart, pcbPart } from "./boards";
import type { Piece } from "./geometry";

export type { Piece } from "./geometry";
export { planetaryPose } from "./drives";

// Geometry for any part shape. Pure three.js, no React, so tests can build
// every part without a WebGL context.
export function buildPart(shape: PartShape): Piece[] {
    switch (shape.component) {
        case "cylinder":
            return cylinderPart(shape.props);
        case "ring":
            return ringPart(shape.props);
        case "lamination-stack":
            return laminationPart(shape.props);
        case "winding-coils":
            return windingPart(shape.props);
        case "magnet-ring":
            return magnetRingPart(shape.props);
        case "spur-gear":
            return spurGearPart(shape.props);
        case "planetary-stage":
            return planetaryPart(shape.props);
        case "flexspline":
            return flexsplinePart(shape.props);
        case "wave-generator":
            return waveGeneratorPart(shape.props);
        case "circular-spline":
            return circularSplinePart(shape.props);
        case "cycloid-disc":
            return cycloidPart(shape.props);
        case "ball-screw":
            return ballScrewPart(shape.props);
        case "roller-screw":
            return rollerScrewPart(shape.props);
        case "bearing":
            return bearingPart(shape.props);
        case "encoder":
            return encoderPart(shape.props);
        case "pcb":
            return pcbPart(shape.props);
        case "housing":
            return housingPart(shape.props);
        case "bolt":
            return boltPart(shape.props);
    }
}
