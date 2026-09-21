import {
    type KeyboardEvent as ReactKeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ACTUATORS } from "../lib/data";
import { ROBOTS } from "../lib/robots";
import { CATEGORY_MAP } from "../types";
import { navigate } from "../lib/router";
import { ActuatorIcon, RobotIcon } from "./PaletteIcons";

// One searchable entry. `to` is the item's canonical deeplink; `hay` is the
// pre-lowercased text every query term must match.
interface Item {
    key: string;
    kind: "actuator" | "robot";
    name: string;
    sub: string;
    to: string;
    hay: string;
}

const MAX_RESULTS = 40;

function buildIndex(): Item[] {
    const robots: Item[] = ROBOTS.map((r) => ({
        key: `robot:${r.id}`,
        kind: "robot",
        name: r.name,
        sub: r.brand,
        to: `/robots#${r.id}`,
        hay: `${r.name} ${r.brand} ${r.country ?? ""}`.toLowerCase(),
    }));
    const actuators: Item[] = ACTUATORS.map((a) => ({
        key: `actuator:${a.id}`,
        kind: "actuator",
        name: a.name,
        sub: `${a.brand} · ${CATEGORY_MAP[a.category]?.label ?? a.category}`,
        to: `/all?sel=${encodeURIComponent(a.id)}`,
        hay: `${a.name} ${a.brand} ${a.category} ${(a.notes ?? "")}`.toLowerCase(),
    }));
    // Robots first (small, curated set), then the actuator catalog.
    return [...robots, ...actuators];
}

function match(items: Item[], query: string): Item[] {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, MAX_RESULTS);
    const terms = q.split(/\s+/).filter(Boolean);
    return items
        .filter((it) => terms.every((t) => it.hay.includes(t)))
        .slice(0, MAX_RESULTS);
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const index = useMemo(buildIndex, []);
    const results = useMemo(() => match(index, query), [index, query]);

    // Global shortcut: Cmd/Ctrl+K toggles the palette from anywhere.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Reset the query and focus the input each time the palette opens.
    useEffect(() => {
        if (!open) return;
        setQuery("");
        setActive(0);
        const id = requestAnimationFrame(() => inputRef.current?.focus());
        return () => cancelAnimationFrame(id);
    }, [open]);

    // Keep the highlighted row in range as the result set shrinks.
    useEffect(() => {
        setActive((a) => (a >= results.length ? 0 : a));
    }, [results.length]);

    // Keep the active row scrolled into view during keyboard navigation.
    useEffect(() => {
        if (!open) return;
        const el = listRef.current?.children[active] as HTMLElement | undefined;
        el?.scrollIntoView({ block: "nearest" });
    }, [active, open]);

    const go = (it: Item | undefined) => {
        if (!it) return;
        setOpen(false);
        navigate(it.to);
    };

    const onInputKey = (e: ReactKeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            go(results[active]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className="cmdk-trigger"
                onClick={() => setOpen(true)}
                aria-label="Search actuators and robots"
            >
                <span className="cmdk-trigger-icon" aria-hidden="true">
                    ⌕
                </span>
                <span className="cmdk-trigger-text">Search</span>
                <kbd className="cmdk-trigger-kbd">⌘K</kbd>
            </button>

            {open && (
                <div
                    className="cmdk-scrim"
                    onClick={() => setOpen(false)}
                    role="presentation"
                >
                    <div
                        className="cmdk-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Search actuators and robots"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cmdk-input-row">
                            <span className="cmdk-input-icon" aria-hidden="true">
                                ⌕
                            </span>
                            <input
                                ref={inputRef}
                                className="cmdk-input"
                                type="text"
                                placeholder="Search actuators and robots…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onInputKey}
                                aria-label="Search query"
                                // biome-ignore lint/a11y/noAutofocus: focus is the whole point of a command palette
                                autoFocus
                            />
                            <kbd className="cmdk-esc">esc</kbd>
                        </div>

                        <ul className="cmdk-list" ref={listRef}>
                            {results.map((it, i) => (
                                <li key={it.key}>
                                    <button
                                        type="button"
                                        className="cmdk-item"
                                        data-active={i === active}
                                        onClick={() => go(it)}
                                        onMouseMove={() => setActive(i)}
                                    >
                                        <span
                                            className="cmdk-kind"
                                            data-kind={it.kind}
                                            title={it.kind === "robot" ? "Robot" : "Actuator"}
                                        >
                                            {it.kind === "robot" ? (
                                                <RobotIcon size={20} />
                                            ) : (
                                                <ActuatorIcon size={18} />
                                            )}
                                        </span>
                                        <span className="cmdk-item-text">
                                            <span className="cmdk-name">{it.name}</span>
                                            <span className="cmdk-sub">{it.sub}</span>
                                        </span>
                                        <span className="cmdk-go" aria-hidden="true">
                                            ↵
                                        </span>
                                    </button>
                                </li>
                            ))}
                            {results.length === 0 && (
                                <li className="cmdk-empty">No matches for “{query}”.</li>
                            )}
                        </ul>

                        <div className="cmdk-foot">
                            <span>
                                <kbd>↑</kbd>
                                <kbd>↓</kbd> to navigate
                            </span>
                            <span>
                                <kbd>↵</kbd> to open
                            </span>
                            <span>
                                {results.length} result{results.length === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
