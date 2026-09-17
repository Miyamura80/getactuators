import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { usePath } from "./lib/router";
import { ActuatorsGallery } from "./pages/ActuatorsGallery";
import { ExplodedView } from "./pages/ExplodedView";

function Root() {
    const path = usePath();
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

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);
