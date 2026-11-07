import "./index.css";
import { mountApp } from "./startup";
import { registerWebMcp } from "./lib/webmcp";

// Hands read-only catalog tools to in-browser agents; a no-op without WebMCP.
registerWebMcp();
mountApp(document.getElementById("root") as HTMLElement);
