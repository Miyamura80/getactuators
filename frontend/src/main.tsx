import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { usePath } from "./lib/router";
import { Home } from "./pages/Home";
import { AllActuators } from "./pages/AllActuators";
import { ActuatorsGallery } from "./pages/ActuatorsGallery";
import { ExplodedView } from "./pages/ExplodedView";
import { CommandPalette } from "./components/CommandPalette";

function Page() {
    const path = usePath();
    if (path === "/all") return <AllActuators />;
    if (path === "/robots" || path === "/robot") return <Home />;
    if (path === "/actuators") return <ActuatorsGallery />;
    if (path.startsWith("/actuators/")) {
        const raw = path.slice("/actuators/".length);
        let id = raw;
        try {
            id = decodeURIComponent(raw);
        } catch {
            // Malformed percent-encoding: fall back to the raw value, which
            // routes to the missing-actuator state rather than crashing render.
        }
        return <ExplodedView id={id} />;
    }
    return <App />;
}

function Root() {
    // The command palette lives outside the page switch so Cmd+K works on every
    // route and its jumps survive page changes.
    return (
        <>
            <Page />
            <CommandPalette />
        </>
    );
}

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);
