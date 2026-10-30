import type { Confidence, SourceId } from "../sourced";

// Data model for the 3D explode kit (frontend/src/three). Scenes are plain,
// serialisable data so registry records (a /bom node's `part3d`, an /alts
// technology's `scene`) can carry them and the server can describe them in
// markdown twins. The frontend maps each `component` key to a procedural part.
//
// Units are millimetres and radians. Every rotary part is modelled around its
// local Z axis, centred on the origin (from -length/2 to +length/2); flat
// parts (PCBs, encoder discs) lie in the XY plane.

export type Vec3 = [number, number, number];

export interface Transform {
    position?: Vec3;
    // Euler XYZ, radians.
    rotation?: Vec3;
}

export interface CylinderProps {
    radius: number;
    length: number;
    // Radius of a through bore; 0 or absent for a solid bar.
    bore?: number;
}

export interface RingProps {
    outer: number;
    inner: number;
    length: number;
}

// Which side of the yoke the teeth (and windings) face: "inner" for an
// inner-rotor stator, "outer" for an outrunner.
export type ToothSide = "inner" | "outer";

export interface LaminationStackProps {
    outer: number;
    inner: number;
    length: number;
    slots: number;
    teeth?: ToothSide;
    // Sheet lines drawn on the stack edge (visual only).
    sheets?: number;
}

export interface WindingCoilsProps {
    slots: number;
    outer: number;
    inner: number;
    length: number;
    teeth?: ToothSide;
}

export interface MagnetRingProps {
    poles: number;
    outer: number;
    inner: number;
    length: number;
    // Back-iron thickness; it sits on `backIron` side of the magnets.
    backIron?: number;
    backIronSide?: ToothSide;
}

export interface SpurGearProps {
    teeth: number;
    module: number;
    width: number;
    bore?: number;
    // Internal (ring) gear: teeth point inward, `rim` is the outer radius.
    internal?: boolean;
    rim?: number;
}

export interface PlanetaryStageProps {
    sunTeeth: number;
    planetTeeth: number;
    planets: number;
    module: number;
    width: number;
    // Input (sun) angle; planets, carrier and ring follow the gear ratios.
    phase?: number;
    // Ring gear outer radius; defaults to the root circle plus a 3-module rim.
    rim?: number;
}

export interface FlexsplineProps {
    teeth: number;
    module: number;
    // Axial length of the cup.
    length: number;
    wall?: number;
    // Radial deflection of the toothed rim at the major axis.
    deflection?: number;
}

export interface WaveGeneratorProps {
    // Semi-axes of the elliptical cam.
    major: number;
    minor: number;
    width: number;
    bore?: number;
}

export interface CircularSplineProps {
    teeth: number;
    module: number;
    width: number;
    outer: number;
}

export interface CycloidDiscProps {
    lobes: number;
    // Pin circle radius.
    radius: number;
    eccentricity: number;
    pinRadius: number;
    thickness: number;
    // Output pin holes through the disc.
    holes?: number;
    // Also draw the fixed ring of lobes + 1 housing pins.
    pins?: boolean;
}

export interface BallScrewProps {
    diameter: number;
    length: number;
    lead: number;
    nutLength?: number;
    nutOuter?: number;
}

export type RollerScrewPiece = "assembly" | "screw" | "rollers" | "nut";

export interface RollerScrewProps {
    screwDiameter: number;
    length: number;
    lead: number;
    rollers: number;
    rollerDiameter: number;
    rollerLength: number;
    nutOuter?: number;
    // Which piece to draw, so an explode can pull screw, rollers and nut apart.
    piece?: RollerScrewPiece;
}

export const BEARING_KINDS = [
    "deep-groove",
    "angular-contact",
    "crossed-roller",
    "needle",
] as const;
export type BearingKind = (typeof BEARING_KINDS)[number];

export interface BearingProps {
    kind: BearingKind;
    outer: number;
    inner: number;
    width: number;
    elements?: number;
}

export interface EncoderProps {
    radius: number;
    thickness: number;
    kind?: "optical" | "magnetic";
    ticks?: number;
}

export interface PcbProps {
    shape: "round" | "rect";
    // Diameter for a round board.
    width: number;
    height?: number;
    thickness?: number;
    bore?: number;
    chips?: number;
}

export interface HousingProps {
    profile: "cup" | "tube" | "flange";
    outer: number;
    length: number;
    wall: number;
    ribs?: number;
    bolts?: number;
    bore?: number;
}

export interface BoltProps {
    diameter: number;
    length: number;
    // A bolt circle: `count` bolts at radius `circle`.
    count?: number;
    circle?: number;
}

export interface PartPropsByKind {
    cylinder: CylinderProps;
    ring: RingProps;
    "lamination-stack": LaminationStackProps;
    "winding-coils": WindingCoilsProps;
    "magnet-ring": MagnetRingProps;
    "spur-gear": SpurGearProps;
    "planetary-stage": PlanetaryStageProps;
    flexspline: FlexsplineProps;
    "wave-generator": WaveGeneratorProps;
    "circular-spline": CircularSplineProps;
    "cycloid-disc": CycloidDiscProps;
    "ball-screw": BallScrewProps;
    "roller-screw": RollerScrewProps;
    bearing: BearingProps;
    encoder: EncoderProps;
    pcb: PcbProps;
    housing: HousingProps;
    bolt: BoltProps;
}

export type PartKind = keyof PartPropsByKind;

export const PART_KINDS = [
    "cylinder",
    "ring",
    "lamination-stack",
    "winding-coils",
    "magnet-ring",
    "spur-gear",
    "planetary-stage",
    "flexspline",
    "wave-generator",
    "circular-spline",
    "cycloid-disc",
    "ball-screw",
    "roller-screw",
    "bearing",
    "encoder",
    "pcb",
    "housing",
    "bolt",
] as const satisfies readonly PartKind[];

// A part's shape: which procedural component, with which parameters.
export type PartShape = {
    [K in PartKind]: { component: K; props: PartPropsByKind[K] };
}[PartKind];

interface PartMeta {
    id: string;
    label: string;
    assembled?: Transform;
    // The single solid cyan part of a scene (an output shaft, a magnet).
    accent?: boolean;
    // Cross-link into a /bom case tree.
    bomNodeId?: string;
    // Provenance of the geometry: a teardown, a patent drawing. Anything not
    // "reported" is shown as inferred.
    sources?: SourceId[];
    confidence?: Confidence;
}

export type PartSpec = PartShape &
    PartMeta & {
        // Where the part travels to at explode = 1, relative to `assembled`.
        explodedOffset: Vec3;
    };

export interface ExplodeSceneSpec {
    id: string;
    title: string;
    parts: PartSpec[];
    // Seconds-free stagger between consecutive parts, as a share of 0..1.
    stagger?: number;
}

// ---- ProcessLoop -------------------------------------------------------

export interface Keyframe {
    // Phase in the loop, 0..1.
    at: number;
    position?: Vec3;
    rotation?: Vec3;
    scale?: number;
    opacity?: number;
    // Generic 0..1 channel: glow on an actor, alignment for particles,
    // strength for field lines.
    value?: number;
}

export type LoopActor = PartShape &
    PartMeta & {
        track: Keyframe[];
    };

export type Axis = "x" | "y" | "z";

export interface FieldLinesSpec {
    id: string;
    // "axial": straight lines through a cylinder, closing around it like a
    // solenoid; "radial": spokes out from the axis.
    kind: "axial" | "radial";
    count: number;
    radius: number;
    length: number;
    center?: Vec3;
    axis?: Axis;
    track: Keyframe[];
}

export interface ParticlesSpec {
    id: string;
    count: number;
    // Box the particles fill, centred on `center`.
    size: Vec3;
    center?: Vec3;
    // "align": random needles that turn to the field axis as `value` -> 1.
    // "swirl": orbit the axis (jet milling). "fall": drop through the box.
    mode: "align" | "swirl" | "fall";
    axis?: Axis;
    seed?: number;
    track: Keyframe[];
}

export interface LoopStep {
    at: number;
    label: string;
}

export interface ProcessLoopSpec {
    id: string;
    title: string;
    // Seconds per loop.
    duration: number;
    actors: LoopActor[];
    fields?: FieldLinesSpec[];
    particles?: ParticlesSpec[];
    // Captions along the loop; the active one is shown in the step bar.
    steps?: LoopStep[];
    // Phase drawn for posters and under reduced motion.
    posterAt?: number;
}
