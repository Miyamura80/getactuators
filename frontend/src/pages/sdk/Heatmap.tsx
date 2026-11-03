import {
    type BrandSummary,
    DIMENSION_LABEL,
    DIMENSION_SHORT,
    SDK_DIMENSIONS,
    type SdkDimension,
} from "../../../../src/sdk";
import { EVIDENCE_PANEL_ID } from "./Evidence";
import { scoreText } from "./state";

// Below this score the cell shade is dark enough that white text reads better
// than black; 57 keeps both sides at 4.5:1 or more (WCAG AA).
export const LIGHT_TEXT_BELOW = 57;

// 2. Heatmap: brands down, dimensions across, cell shade = score. Every cell
// is a button that opens the checks and posts behind it.
export function SdkHeatmap({ rows, open, onOpen }: {
    rows: BrandSummary[];
    open: { brand: string | null; dim: SdkDimension | null };
    onOpen: (brand: string, dim: SdkDimension) => void;
}) {
    return <div className="sdk-heat-wrap">
        <table className="sdk-heat">
            <thead>
                <tr>
                    <th scope="col">Brand</th>
                    {SDK_DIMENSIONS.map((d) => <th key={d} scope="col" title={DIMENSION_LABEL[d]}>{DIMENSION_SHORT[d]}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((s) => <tr key={s.brand.id}>
                    <th scope="row">{s.brand.name}</th>
                    {SDK_DIMENSIONS.map((d) => {
                        const v = s.score.dimensions[d];
                        const active = open.brand === s.brand.id && open.dim === d;
                        return <td key={d}>
                            <button type="button" className={`sdk-cell${active ? " is-open" : ""}${v ? (v.score < LIGHT_TEXT_BELOW ? " is-low" : "") : " is-empty"}`}
                                style={v ? { ["--s" as string]: String(v.score / 100) } : undefined}
                                aria-label={`${s.brand.name}, ${DIMENSION_LABEL[d]}: ${scoreText(v?.score)}`}
                                aria-expanded={active}
                                aria-controls={active ? EVIDENCE_PANEL_ID : undefined}
                                onClick={() => onOpen(s.brand.id, d)}>
                                {scoreText(v?.score)}
                            </button>
                        </td>;
                    })}
                </tr>)}
            </tbody>
        </table>
    </div>;
}
