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
            <div className="side-brand">
                <BrandMark size={26} />
                <span>
                    get<b>actuators</b>.com
                </span>
            </div>
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
                <Link to="/actuators" className="side-page-link">
                    Actuator gallery →
                </Link>
            </div>
            <p className="side-note">
                v1 dataset {"·"} sourced from manufacturer pages via web search.
                Verify against datasheets before design use.
            </p>
        </aside>
    );
}
