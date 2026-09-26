import { createHash } from "node:crypto";
import { SITE_URL } from "@/server/site";

// MCP App (ui:// resource) that renders compare_actuators' structuredContent
// as a comparison card. Self-contained: no external scripts, styles or
// fetches; it talks to the host only over the MCP Apps postMessage protocol
// (ui/initialize -> ui/notifications/initialized -> ui/notifications/tool-result).

export const COMPARE_VIEW_URI = "ui://getactuators/actuator-compare.html";
export const MCP_APP_MIME = "text/html;profile=mcp-app";

const STYLE = `
:root { color-scheme: light dark; --fg: #1a1a1a; --muted: #6b6b6b; --line: #e3e3e3; --win: #0a7a3d; --bg: #ffffff; }
@media (prefers-color-scheme: dark) { :root { --fg: #ededed; --muted: #a0a0a0; --line: #333; --win: #4ade80; --bg: #161616; } }
body { margin: 0; padding: 12px; font: 13px/1.4 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
h1 { font-size: 14px; margin: 0 0 8px; }
.wrap { overflow-x: auto; }
table { border-collapse: collapse; min-width: 100%; }
th, td { padding: 6px 8px; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; }
th:first-child, td:first-child { text-align: left; color: var(--muted); }
thead th { vertical-align: bottom; }
thead a { color: inherit; cursor: pointer; text-decoration: underline; }
td.win { color: var(--win); font-weight: 600; }
.muted { color: var(--muted); }
`;

const SCRIPT = `
const LABELS = { peak_torque_nm: "Peak torque", rated_torque_nm: "Rated torque", max_speed_rpm: "Max speed", weight_g: "Mass", torque_density_nm_per_kg: "Torque density", price_usd: "Price", price_per_nm: "Price per N.m", backlash_arcmin: "Backlash" };
let nextId = 1;
function rpc(method, params) { window.parent.postMessage({ jsonrpc: "2.0", id: nextId++, method, params }, "*"); }
function notify(method, params) { window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*"); }
function el(tag, text, cls) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
function render(data) {
    const root = document.getElementById("root");
    root.replaceChildren();
    if (!data || !Array.isArray(data.actuators)) { root.append(el("p", "No comparison data.", "muted")); return; }
    root.append(el("h1", "Actuator comparison (" + data.actuators.length + ")"));
    const table = el("table"); const head = el("tr"); head.append(el("th", ""));
    for (const a of data.actuators) {
        const th = el("th"); const link = el("a", a.name); link.title = a.brand;
        link.addEventListener("click", () => rpc("ui/open-link", { url: a.page_url }));
        th.append(link, el("div", a.brand, "muted")); head.append(th);
    }
    const thead = el("thead"); thead.append(head); table.append(thead);
    const body = el("tbody");
    for (const b of data.best || []) {
        const tr = el("tr"); tr.append(el("td", (LABELS[b.metric] || b.metric) + " (" + b.unit + ")"));
        for (const a of data.actuators) {
            const v = a[b.metric];
            tr.append(el("td", v === null || v === undefined ? "n/a" : String(v), a.id === b.actuator_id ? "win" : ""));
        }
        body.append(tr);
    }
    table.append(body);
    const wrap = el("div", undefined, "wrap"); wrap.append(table); root.append(wrap);
    if (data.missing_ids && data.missing_ids.length) root.append(el("p", "Not found: " + data.missing_ids.join(", "), "muted"));
    notify("ui/notifications/size-changed", { height: document.documentElement.scrollHeight });
}
window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg || msg.jsonrpc !== "2.0") return;
    if (msg.id === 1 && msg.result) notify("ui/notifications/initialized", {});
    if (msg.method === "ui/notifications/tool-result") render(msg.params && msg.params.structuredContent);
});
rpc("ui/initialize", { appInfo: { name: "getactuators-compare", version: "1.0.0" }, appCapabilities: {}, protocolVersion: "2026-01-26" });
`;

const sha256 = (s: string) =>
    `'sha256-${createHash("sha256").update(s).digest("base64")}'`;

// Scoped CSP: only this page's own inline script/style (by hash) and images
// from the site origin; embeddable by ChatGPT and Claude.
const CSP = [
    "default-src 'none'",
    `script-src ${sha256(SCRIPT)}`,
    `style-src ${sha256(STYLE)}`,
    `img-src ${SITE_URL} data:`,
    `connect-src ${SITE_URL}`,
    `form-action ${SITE_URL}`,
    "base-uri 'none'",
    "frame-ancestors https://chatgpt.com https://claude.ai",
].join("; ");

export const COMPARE_VIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>Actuator comparison - getactuators</title>
<style>${STYLE}</style>
</head>
<body>
<div id="root"><p class="muted">Waiting for comparison data...</p></div>
<script>${SCRIPT}</script>
</body>
</html>
`;

// Resource _meta for MCP Apps hosts: they build the iframe CSP from these.
export const COMPARE_VIEW_META = {
    ui: {
        csp: { connectDomains: [SITE_URL], resourceDomains: [SITE_URL] },
        prefersBorder: true,
    },
};
