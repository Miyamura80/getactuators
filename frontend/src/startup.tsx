import { StrictMode, Suspense, lazy, useLayoutEffect } from "react";
import { createRoot, hydrateRoot, type Root as ReactRoot } from "react-dom/client";
import App from "./App.tsx";
import { usePath } from "./lib/router";
import { Home } from "./pages/Home";
import { ActuatorsPage } from "./pages/actuators/ActuatorsPage";
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
import { Startups } from "./pages/Startups";
import { STARTUPS_PATH } from "../../src/startups";
import { Investors } from "./pages/Investors";
import { INVESTORS_PATH } from "../../src/investors";
import { SupplyChainLab } from "./pages/supply-chain/SupplyChainLab";
import { LAB_PATH } from "../../src/supply-chain/lab-fixtures";
import { Humanoids } from "./pages/humanoids/Humanoids";
import { HUMANOIDS_PATH } from "../../src/humanoids";
import { Contributors } from "./pages/Contributors";
import { CONTRIBUTORS_PATH, PEOPLE_PATH } from "../../src/people";
import { Metals } from "./pages/supply-chain/metals/Metals";
import { METALS_PATH } from "../../src/supply-chain/metals";
import { Policy } from "./pages/supply-chain/policy/Policy";
import { POLICY_PATH } from "../../src/supply-chain/policy";
import { OpenSource } from "./pages/open-source/OpenSource";
import { OPEN_SOURCE_PATH } from "../../src/open-source";
import { Benchmarks } from "./pages/benchmarks/Benchmarks";
import { BENCHMARKS_PATH } from "../../src/benchmarks";
import { MANUFACTURING_PATH } from "../../src/supply-chain/processes/path";
import { ALTS_PATH } from "../../src/supply-chain/alts/path";
import { BOM_PATH } from "../../src/supply-chain/bom/path";
import { PublicHeader } from "./components/PublicHeader";

// The process map carries its 3D vignette specs, so it loads in its own chunk.
const Manufacturing = lazy(() =>
    import("./pages/supply-chain/manufacturing/Manufacturing").then((m) => ({ default: m.Manufacturing })),
);

// /alts carries its 3D scene specs too.
const Alts = lazy(() => import("./pages/supply-chain/alts/Alts").then((m) => ({ default: m.Alts })));

// /bom carries the three teardowns and their 3D scene specs.
const Bom = lazy(() => import("./pages/supply-chain/bom/Bom").then((m) => ({ default: m.Bom })));

function BomLoading({ menuOpen }: { menuOpen: boolean }) {
    return <div className="tool-page bm-page">
        <PublicHeader path={BOM_PATH} initialOpen={menuOpen} />
        <main className="tool-main" aria-busy="true">
            <p role="status">Loading bill of materials</p>
        </main>
    </div>;
}

function AltsLoading({ menuOpen }: { menuOpen: boolean }) {
    return <div className="tool-page al-page">
        <PublicHeader path={ALTS_PATH} initialOpen={menuOpen} />
        <main className="tool-main" aria-busy="true">
            <p role="status">Loading alternatives</p>
        </main>
    </div>;
}

// While the chunk loads, keep the site header and the page frame on screen.
function ManufacturingLoading({ menuOpen }: { menuOpen: boolean }) {
    return <div className="tool-page mf-page">
        <PublicHeader path={MANUFACTURING_PATH} initialOpen={menuOpen} />
        <main className="tool-main" aria-busy="true" />
    </div>;
}
import { CountryPage } from "./pages/supply-chain/country/CountryPage";
import { LIVE_COUNTRY_PAGES } from "../../src/supply-chain/country-pages";
import { SDK_PATH } from "../../src/sdk";

// /sdk carries its evidence dataset (several hundred KB), so it loads in its
// own chunk too.
const Sdk = lazy(() => import("./pages/sdk/Sdk").then((m) => ({ default: m.Sdk })));

function SdkLoading({ menuOpen }: { menuOpen: boolean }) {
    return <div className="tool-page sdk-page">
        <PublicHeader path={SDK_PATH} initialOpen={menuOpen} />
        <main className="tool-main" aria-busy="true">
            <p role="status">Loading SDK scores</p>
        </main>
    </div>;
}

// /people carries the directory, its network layout and the map, so it
// loads in its own chunk.
const People = lazy(() => import("./pages/people/People").then((m) => ({ default: m.People })));

function PeopleLoading({ menuOpen }: { menuOpen: boolean }) {
    return <div className="tool-page pp-page">
        <PublicHeader path={PEOPLE_PATH} initialOpen={menuOpen} />
        <main className="tool-main" aria-busy="true">
            <p role="status">Loading people</p>
        </main>
    </div>;
}

function Page({ menuOpen }: { menuOpen: boolean }) {
    const path = usePath();
    if (path === "/compare") return <Compare menuOpen={menuOpen} />;
    if (path === "/robots" || path === "/robot") return <Home menuOpen={menuOpen} />;
    if (path === "/actuators") return <ActuatorsPage menuOpen={menuOpen} />;
    if (path === "/agents") return <Agents menuOpen={menuOpen} />;
    if (path === ARM_TORQUE_PATH) return <ArmTorqueCalculator menuOpen={menuOpen} />;
    if (path === HUMANOID_GUIDE_PATH) return <HumanoidGuide menuOpen={menuOpen} />;
    if (path === STARTUPS_PATH) return <Startups menuOpen={menuOpen} />;
    if (path === INVESTORS_PATH) return <Investors menuOpen={menuOpen} />;
    if (path === MOTOR_TORQUE_PATH) return <MotorTorqueCalculator menuOpen={menuOpen} />;
    if (path === LAB_PATH) return <SupplyChainLab menuOpen={menuOpen} />;
    if (path === HUMANOIDS_PATH) return <Humanoids menuOpen={menuOpen} />;
    if (path === CONTRIBUTORS_PATH) return <Contributors menuOpen={menuOpen} />;
    if (path === PEOPLE_PATH) return <Suspense fallback={<PeopleLoading menuOpen={menuOpen} />}><People menuOpen={menuOpen} /></Suspense>;
    if (path === METALS_PATH) return <Metals menuOpen={menuOpen} />;
    if (path === POLICY_PATH) return <Policy menuOpen={menuOpen} />;
    if (path === OPEN_SOURCE_PATH) return <OpenSource menuOpen={menuOpen} />;
    if (path === BENCHMARKS_PATH) return <Benchmarks menuOpen={menuOpen} />;
    if (path === MANUFACTURING_PATH) return <Suspense fallback={<ManufacturingLoading menuOpen={menuOpen} />}><Manufacturing menuOpen={menuOpen} /></Suspense>;
    if (path === BOM_PATH || path.startsWith(`${BOM_PATH}/`)) return <Suspense fallback={<BomLoading menuOpen={menuOpen} />}><Bom menuOpen={menuOpen} /></Suspense>;
    if (path === ALTS_PATH) return <Suspense fallback={<AltsLoading menuOpen={menuOpen} />}><Alts menuOpen={menuOpen} /></Suspense>;
    const country = LIVE_COUNTRY_PAGES.find((p) => p.path === path);
    if (country) return <CountryPage page={country} menuOpen={menuOpen} />;
    if (path === SDK_PATH) return <Suspense fallback={<SdkLoading menuOpen={menuOpen} />}><Sdk menuOpen={menuOpen} /></Suspense>;
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
    const top = target ? target.getBoundingClientRect().top : 0;
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
