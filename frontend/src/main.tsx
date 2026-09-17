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
        return <ExplodedView id={decodeURIComponent(path.slice("/actuators/".length))} />;
    }
    return <App />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);
