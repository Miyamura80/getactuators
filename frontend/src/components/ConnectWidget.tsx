import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
    AGENT_CLIENTS,
    DEFAULT_CLIENT_ID,
    EFFORT_BADGE,
    MCP_URL,
    findClient,
    snippetHint,
} from "../lib/agent-clients";
import type { AgentClient } from "../lib/agent-clients";

async function writeClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Clipboard blocked (insecure context, permissions): the text stays
        // visible on screen, so failing quietly is the right fallback.
        return false;
    }
}

function CopyIcon() {
    return (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
}

function CopyButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );
    return (
        <button
            type="button"
            className="cw-copy"
            data-copied={copied}
            aria-label={label}
            title={copied ? "Copied" : "Copy"}
            onClick={async () => {
                if (!(await writeClipboard(text))) return;
                setCopied(true);
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), 1400);
            }}
        >
            {copied ? "✓" : <CopyIcon />}
        </button>
    );
}

function Logo({ src }: { src: string }) {
    // The marks are tinted with currentColor through a CSS mask so they sit in
    // the monochrome palette instead of each brand's own colors.
    const mask = `url("${src}") center / contain no-repeat`;
    return <span className="cw-logo" style={{ WebkitMask: mask, mask }} aria-hidden="true" />;
}

function Steps({ steps, label }: { steps: string[]; label: string }) {
    return (
        <details className="cw-steps">
            <summary>{label}</summary>
            <ol>
                {steps.map((s) => (
                    <li key={s}>{s}</li>
                ))}
            </ol>
        </details>
    );
}

// ChatGPT's link only opens its Plugins page, so put the URL on the clipboard first
// and then navigate. Modified clicks keep their default (new tab) and just copy.
function copyThenOpen(e: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        void writeClipboard(MCP_URL);
        return;
    }
    e.preventDefault();
    void writeClipboard(MCP_URL).then(() => {
        window.location.href = href;
    });
}

function Panel({ client }: { client: AgentClient }) {
    if (client.installUrl) {
        const pageOnly = client.effort === "page-only";
        const href = client.installUrl;
        return (
            <div className="cw-panel">
                <a
                    className="cw-install"
                    href={href}
                    onClick={pageOnly ? (e) => copyThenOpen(e, href) : undefined}
                >
                    <Logo src={client.logo} />
                    {pageOnly ? `Open ${client.name} Plugins` : `Add to ${client.name}`}
                </a>
                {client.note && <p className="cw-note">{client.note}</p>}
                {client.steps && (
                    <Steps
                        steps={client.steps}
                        label={pageOnly ? "Full click-path" : "If the link does not open"}
                    />
                )}
            </div>
        );
    }
    return (
        <div className="cw-panel">
            {client.snippet && (
                <>
                    <p className="cw-note">{snippetHint(client)}</p>
                    <div className="cw-code">
                        <pre>{client.snippet}</pre>
                        <CopyButton text={client.snippet} label={`Copy the ${client.name} setup`} />
                    </div>
                </>
            )}
            {client.note && <p className="cw-note">{client.note}</p>}
            {client.steps && <Steps steps={client.steps} label="Or by hand" />}
        </div>
    );
}

export function ConnectWidget() {
    const [selectedId, setSelectedId] = useState(DEFAULT_CLIENT_ID);
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = findClient(selectedId) ?? AGENT_CLIENTS[0];

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="cw">
            <span className="cw-label">MCP server URL</span>
            <div className="cw-code cw-url">
                <code title={MCP_URL}>{MCP_URL}</code>
                <CopyButton text={MCP_URL} label="Copy the MCP server URL" />
            </div>

            <div className="cw-picker" ref={rootRef}>
                <button
                    type="button"
                    className="cw-toggle"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                >
                    <Logo src={selected.logo} />
                    <span className="cw-toggle-name">{selected.name}</span>
                    <span className="cw-caret" aria-hidden="true">
                        ▾
                    </span>
                </button>
                {open && (
                    <ul className="cw-menu" role="listbox" aria-label="MCP client">
                        {AGENT_CLIENTS.map((c) => (
                            <li key={c.id} role="option" aria-selected={c.id === selected.id}>
                                <button
                                    type="button"
                                    className="cw-option"
                                    data-on={c.id === selected.id}
                                    onClick={() => {
                                        setSelectedId(c.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Logo src={c.logo} />
                                    <span className="cw-option-name">{c.name}</span>
                                    <span className="cw-badge" data-effort={c.effort}>
                                        {EFFORT_BADGE[c.effort]}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Panel key={selected.id} client={selected} />
        </div>
    );
}
