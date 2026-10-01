import { useEffect } from "react";
import { BrandGlyph } from "../components/BrandGlyph";
import { BrandMark } from "../components/BrandMark";
import { ConnectWidget } from "../components/ConnectWidget";
import { MCP_TOOLS } from "../lib/agent-clients";
import { Link } from "../lib/router";

// Machine-readable doors besides MCP. Plain anchors: these are server routes,
// not SPA pages, so the client router must not intercept them.
const OTHER_WAYS: { href: string; label: string }[] = [
    { href: "/openapi.json", label: "openapi.json" },
    { href: "/docs/api", label: "REST docs" },
    { href: "/llms.txt", label: "llms.txt" },
    { href: "/auth.md", label: "auth.md (none needed)" },
];

const TITLE = "Connect actuatorlist to your AI agent (MCP)";

export function Agents() {
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);

    return (
        <div className="agents-page">
            <header className="page-bar">
                <Link to="/" className="page-brand" aria-label="actuatorlist home">
                    <BrandMark size={24} />
                    <span>
                        <b>actuator</b>list.com
                    </span>
                </Link>
                <nav className="page-nav">
                    <Link to="/" className="page-nav-link">
                        Leaderboard
                    </Link>
                    <Link to="/robots" className="page-nav-link">
                        Robot types
                    </Link>
                    <Link to="/all" className="page-nav-link">
                        All actuators
                    </Link>
                    <Link to="/actuators" className="page-nav-link">
                        Gallery
                    </Link>
                    <Link to="/agents" className="page-nav-link" data-on={true}>
                        Agents
                    </Link>
                    <a href="/guides" className="page-nav-link">
                        Guides
                    </a>
                </nav>
            </header>

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
        </div>
    );
}
