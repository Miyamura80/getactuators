import type { Segment } from "../../../../src/supply-chain/companies";
import { SEGMENT_COLOR, SEGMENT_PICTO, type SegmentCount } from "../../../../src/supply-chain/map";
import { MIX_GAP, type MixLayout, mixColumns } from "../../../../src/supply-chain/map-groups";
import { ObjectTile } from "../glyphs/ObjectTile";

// A segment as an object tile: pickaxe (rare earths), horseshoe magnet
// (magnets & motors), gear (gears & bearings), robot arm (robot makers).
// Hollow (dashed) when the location is a city or region centre.
export function SegmentTile({ segment, hollow = false, size = 16 }: { segment: Segment; hollow?: boolean; size?: number }) {
    const { line, solid } = SEGMENT_PICTO[segment];
    return <ObjectTile className="mk-tile" color={SEGMENT_COLOR[segment]} hollow={hollow} size={size}>
        <path d={line} />
        {solid ? <path d={solid} className="ot-solid" /> : null}
    </ObjectTile>;
}

// What a group holds: one tile per segment present, in chain order, each
// with its site count when more than one. Two segments sit in a row, three
// or four in a 2 x 2 block, so a group marker stays compact (its outer size
// is mixSize in map-groups.ts, which label collision uses). Decorative: the
// button around it carries the same content as its accessible name.
export function SegmentMix({ mix, size = 16, layout = "block" }: { mix: readonly SegmentCount[]; size?: number; layout?: MixLayout }) {
    return <span className="mk-mix" aria-hidden="true"
        style={{ gridTemplateColumns: `repeat(${mixColumns(mix, layout)}, auto)`, gap: MIX_GAP }}>
        {mix.map(({ segment, n }) => <span key={segment} className="mk-mix-cell">
            <SegmentTile segment={segment} size={size} />
            {n > 1 ? <b>{n}</b> : null}
        </span>)}
    </span>;
}
