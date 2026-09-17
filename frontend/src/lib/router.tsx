import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

// Minimal history-based router. The site is small enough that pulling in a
// routing library would be more moving parts than the two extra pages need.
// The Railway server already serves an SPA fallback, so real paths resolve
// on hard refresh.

const NAV_EVENT = "ga:navigate";

function subscribe(cb: () => void): () => void {
    window.addEventListener("popstate", cb);
    window.addEventListener(NAV_EVENT, cb);
    return () => {
        window.removeEventListener("popstate", cb);
        window.removeEventListener(NAV_EVENT, cb);
    };
}

export function usePath(): string {
    return useSyncExternalStore(
        subscribe,
        () => window.location.pathname,
        () => "/",
    );
}

export function navigate(to: string): void {
    if (to === window.location.pathname) {
        window.scrollTo({ top: 0 });
        return;
    }
    window.history.pushState({}, "", to);
    window.scrollTo({ top: 0 });
    window.dispatchEvent(new Event(NAV_EVENT));
}

interface LinkProps {
    to: string;
    className?: string;
    children: ReactNode;
    "aria-label"?: string;
}

export function Link({ to, className, children, ...rest }: LinkProps) {
    return (
        <a
            href={to}
            className={className}
            onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                navigate(to);
            }}
            {...rest}
        >
            {children}
        </a>
    );
}
