// Registers happy-dom's globals (document, window, ...) so React component
// tests can render under `bun test`. Imported for its side effect as the very
// first import of any DOM test, before React or testing-library load.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
