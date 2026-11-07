import type { CatalogView } from "./url-state";

// Two-segment view control, after the Finder toolbar: icons, then list.
const VIEWS: { key: CatalogView; label: string; path: string }[] = [
    { key: "gallery", label: "Gallery view", path: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
    { key: "list", label: "List view", path: "M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11" },
];

export function ViewSwitch({ view, onChange }: { view: CatalogView; onChange: (v: CatalogView) => void }) {
    return (
        <div className="view-switch" role="group" aria-label="View">
            {VIEWS.map((v) => (
                <button
                    key={v.key}
                    type="button"
                    aria-label={v.label}
                    title={v.label}
                    aria-pressed={view === v.key}
                    onClick={() => onChange(v.key)}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                            d={v.path}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            ))}
        </div>
    );
}
