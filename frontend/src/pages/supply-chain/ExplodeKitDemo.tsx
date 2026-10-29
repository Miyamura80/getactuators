import { useState } from "react";
import {
    DEMO_SCENES,
    MAGNET_PRESS_LOOP,
} from "../../../../src/supply-chain/scenes/demos";
import { ExplodeScene, ProcessLoop } from "../../three";

const TABS = [
    ...DEMO_SCENES.map((s) => ({ id: s.id, label: s.title })),
    { id: MAGNET_PRESS_LOOP.id, label: MAGNET_PRESS_LOOP.title },
];

// The kit's demo bench: one stage, one live scene at a time. Tabs swap the
// assembly; the last tab shows the ProcessLoop primitive.
export default function ExplodeKitDemo() {
    const [tab, setTab] = useState(TABS[0]?.id ?? "");
    const scene = DEMO_SCENES.find((s) => s.id === tab);
    return (
        <div className="sc-lab-3d">
            <div className="sc-lab-tabs" role="tablist" aria-label="Demo scenes">
                {TABS.map((t, i) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        id={`x3-tab-${t.id}`}
                        aria-selected={t.id === tab}
                        aria-controls="x3-panel"
                        onClick={() => setTab(t.id)}
                    >
                        <b>{String.fromCharCode(65 + i)}</b>
                        {t.label}
                    </button>
                ))}
            </div>
            <div id="x3-panel" role="tabpanel" aria-labelledby={`x3-tab-${tab}`}>
                {scene ? (
                    <ExplodeScene key={scene.id} {...scene} drive="both" defaultExplode={0.72} />
                ) : (
                    <ProcessLoop key={MAGNET_PRESS_LOOP.id} loop={MAGNET_PRESS_LOOP} />
                )}
            </div>
        </div>
    );
}
