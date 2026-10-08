import { StrictMode, useLayoutEffect } from "react";
import { createRoot, hydrateRoot, type Root as ReactRoot } from "react-dom/client";
import App from "./App.tsx";
import { usePath } from "./lib/router";
import { Home } from "./pages/Home";
import { AllActuators } from "./pages/AllActuators";
import { ActuatorsGallery } from "./pages/ActuatorsGallery";
import { ExplodedView } from "./pages/ExplodedView";
import { CommandPalette } from "./components/CommandPalette";
import { Agents } from "./pages/Agents";
import { GalleryRoot } from "./GalleryRoot";
import { Compare } from "./pages/Compare";
import { ArmTorqueCalculator } from "./pages/ArmTorqueCalculator";
import { ARM_TORQUE_PATH } from "../../src/engineering/arm-torque";
import { HumanoidGuide } from "./pages/HumanoidGuide";
import { HUMANOID_GUIDE_PATH } from "../../src/server/agent/humanoid-joints";
import { MOTOR_TORQUE_PATH, MotorTorqueCalculator } from "./pages/MotorTorqueCalculator";

function Page({ menuOpen }: { menuOpen: boolean }) {
    const path = usePath();
    if (path === "/all") return <AllActuators menuOpen={menuOpen} />;
    if (path === "/compare") return <Compare menuOpen={menuOpen} />;
    if (path === "/robots" || path === "/robot") return <Home menuOpen={menuOpen} />;
    if (path === "/actuators") return <ActuatorsGallery menuOpen={menuOpen} />;
    if (path === "/agents") return <Agents menuOpen={menuOpen} />;
    if (path === ARM_TORQUE_PATH) return <ArmTorqueCalculator menuOpen={menuOpen} />;
    if (path === HUMANOID_GUIDE_PATH) return <HumanoidGuide menuOpen={menuOpen} />;
    if (path === MOTOR_TORQUE_PATH) return <MotorTorqueCalculator menuOpen={menuOpen} />;
    if (path.startsWith("/actuators/")) {
        const raw = path.slice("/actuators/".length);
        let id = raw;
        try {
            id = decodeURIComponent(raw);
        } catch {
            // Malformed percent-encoding: fall back to the raw value, which
            // routes to the missing-actuator state rather than crashing render.
        }
        return <ExplodedView id={id} menuOpen={menuOpen} />;
    }
    return <App menuOpen={menuOpen} />;
}

function Root({ menuOpen, restoreFragment }: { menuOpen: boolean; restoreFragment: () => void }) {
    useLayoutEffect(restoreFragment, [restoreFragment]);
    // The command palette lives outside the page switch so Cmd+K works on every
    // route and its jumps survive page changes.
    return (
        <>
            <Page menuOpen={menuOpen} />
            <CommandPalette />
        </>
    );
}

// Only restore the comparison category being navigated to. Other fragments,
// selections, gallery hydration and controls already focused by the user are
// untouched. This callback runs once at the SSR replacement commit, not on
// subsequent selection/history renders (including StrictMode's effect replay).
function comparisonFragmentRestorer(container: HTMLElement): () => void {
    const hash = window.location.hash;
    const id = hash.slice(1);
    const target = document.getElementById(id);
    const active = document.activeElement;
    const restore = window.location.pathname === "/compare" &&
        /^compare-[a-z_]+$/.test(id) && target !== null && container.contains(target) &&
        (active === target || active === document.body);
    const top = target && active === target ? target.getBoundingClientRect().top : 0;
    let pending = restore;
    return () => {
        if (!pending) return;
        pending = false;
        if (window.location.hash !== hash || (document.activeElement !== document.body && document.activeElement !== target)) return;
        const replacement = document.getElementById(id);
        if (!replacement || !container.contains(replacement)) return;
        replacement.focus({ preventScroll: true });
        window.scrollBy(0, replacement.getBoundingClientRect().top - top);
    };
}

// Only the built gallery is hydrated. All other routes keep their prior mount.
export function mountApp(container: HTMLElement): ReactRoot {
    if (
        window.location.pathname === "/actuators" &&
        container.dataset.galleryPrerender === "true"
    ) {
        return hydrateRoot(
            container,
            <StrictMode>
                <GalleryRoot menuOpen={container.querySelector<HTMLDetailsElement>(".site-menu")?.open ?? false} />
            </StrictMode>,
        );
    }
    const menuOpen = container.querySelector<HTMLDetailsElement>(".site-menu")?.open ?? false;
    const restoreFragment = comparisonFragmentRestorer(container);
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <Root menuOpen={menuOpen} restoreFragment={restoreFragment} />
        </StrictMode>,
    );
    return root;
}
