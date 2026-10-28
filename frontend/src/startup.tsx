import { StrictMode } from "react";
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
import { Metals } from "./pages/supply-chain/metals/Metals";
import { METALS_PATH } from "../../src/supply-chain/metals";
import { OpenSource } from "./pages/open-source/OpenSource";
import { OPEN_SOURCE_PATH } from "../../src/open-source";

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
    if (path === METALS_PATH) return <Metals menuOpen={menuOpen} />;
    if (path === OPEN_SOURCE_PATH) return <OpenSource menuOpen={menuOpen} />;
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

function Root({ menuOpen }: { menuOpen: boolean }) {
    // The command palette lives outside the page switch so Cmd+K works on every
    // route and its jumps survive page changes.
    return (
        <>
            <Page menuOpen={menuOpen} />
            <CommandPalette />
        </>
    );
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
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <Root menuOpen={menuOpen} />
        </StrictMode>,
    );
    return root;
}
