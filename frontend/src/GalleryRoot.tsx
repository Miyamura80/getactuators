import { ActuatorsPage } from "./pages/actuators/ActuatorsPage";
import { CommandPalette } from "./components/CommandPalette";

// A fixed gallery tree avoids the router's homepage server snapshot during hydration.
// Path changes remain native document navigations, as on every other route.
export function GalleryRoot({ menuOpen = false }: { menuOpen?: boolean }) {
    return (
        <>
            <ActuatorsPage menuOpen={menuOpen} prerendered />
            <CommandPalette />
        </>
    );
}
