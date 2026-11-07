import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { useEffect } from "react";
import { BrandGlyph } from "../components/BrandGlyph";
import { ConnectWidget } from "../components/ConnectWidget";
import { MCP_TOOLS } from "../lib/agent-clients";

// Machine-readable doors besides MCP. Plain anchors: these are server routes,
// not SPA pages, so the client router must not intercept them.
const OTHER_WAYS: { href: string; label: string }[] = [
    { href: "/openapi.json", label: "openapi.json" },
    { href: "/docs/api", label: "REST docs" },
    { href: "/llms.txt", label: "llms.txt" },
    { href: "/auth.md", label: "auth.md (none needed)" },
];

const TITLE = "Connect actuatorlist to your AI agent (MCP)";

export function Agents({ menuOpen = false }: { menuOpen?: boolean }) {
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);

    return (
        <div className="agents-page">
            <PublicHeader path="/agents" initialOpen={menuOpen} />

            <div className="agents-grid">
                <section className="agents-intro">
                    <h1>
                        <BrandGlyph className="block-tag" />
                        Add actuatorlist to your agent
                    </h1>
                    <p className="agents-lede">
                        The whole actuator and robot catalog as a free, read-only MCP
                        server. No key, no sign-up.
                    </p>

                    <h2 className="agents-h2">What your agent can call</h2>
                    <ul className="agents-tools">
                        {MCP_TOOLS.map((t) => (
                            <li key={t.name} title={t.does}>
                                <code>{t.name}</code>
                                <span>{t.does}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="agents-other">
                        <span>Other ways in</span>
                        {OTHER_WAYS.map((w) => (
                            <a key={w.href} href={w.href}>
                                {w.label}
                            </a>
                        ))}
                    </p>
                </section>

                <section className="agents-connect" aria-label="Install in your client">
                    <ConnectWidget />
                </section>
            </div>
            <PublicFooter />
        </div>
    );
}
