import { BrandMark } from "./BrandMark";
import { Link } from "../lib/router";

export interface NavItem {
    id: string;
    label: string;
}

interface Props {
    items: NavItem[];
    active: string;
    onSelect: (id: string) => void;
}

export function Sidebar({ items, active, onSelect }: Props) {
    return (
        <aside className="sidebar">
            <Link to="/" className="side-brand" aria-label="actuatorlist home">
                <BrandMark size={26} />
                <span>
                    <b>actuator</b>list.com
                </span>
            </Link>
            <nav>
                {items.map((it) => (
                    <button
                        type="button"
                        key={it.id}
                        className="side-link"
                        data-on={active === it.id}
                        onClick={() => onSelect(it.id)}
                    >
                        {it.label}
                    </button>
                ))}
            </nav>
            <div className="side-pages">
                <Link to="/robots" className="side-page-link">
                    Browse by robot type →
                </Link>
                <Link to="/all" className="side-page-link">
                    All actuators (full table) →
                </Link>
                <Link to="/actuators" className="side-page-link">
                    Actuator gallery →
                </Link>
                <Link to="/agents" className="side-page-link">
                    AI agents (MCP) →
                </Link>
                <a href="/guides" className="side-page-link">
                    Engineering guides →
                </a>
            </div>
            <p className="side-note">
                v1 dataset {"·"} sourced from manufacturer pages via web search.
                Verify against datasheets before design use.
            </p>
        </aside>
    );
}
