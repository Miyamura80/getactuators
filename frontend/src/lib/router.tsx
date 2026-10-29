import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

// Minimal history store for same-page filters, selection and hash anchors.
// Pathname changes use full documents so the server remains the single source
// of route metadata and substantive catalog content.

const NAV_EVENT = "ga:navigate";

function subscribe(cb: () => void): () => void {
    window.addEventListener("popstate", cb);
    window.addEventListener("hashchange", cb);
    window.addEventListener(NAV_EVENT, cb);
    return () => {
        window.removeEventListener("popstate", cb);
        window.removeEventListener("hashchange", cb);
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

// Full-URL snapshot (path + query + hash). Components that care about the
// query string or hash (deeplinked selection, hash-anchored scroll) subscribe
// to this so query/hash-only changes wake them even when the pathname is stable.
export function useLocationKey(): string {
    return useSyncExternalStore(
        subscribe,
        () => window.location.href,
        () => "",
    );
}

// `keepScroll` is for in-page state such as a selected map pin, where the
// view should stay put.
export function navigate(to: string, { keepScroll = false }: { keepScroll?: boolean } = {}): void {
    const target = new URL(to, window.location.href);
    // Indexable route changes are document navigations: the server owns both
    // the head (including JSON-LD) and the persistent catalog/FAQ content.
    // Native history back/forward restores that document, including via BFCache.
    // Only query/hash state within a page remains client-side.
    if (target.origin !== window.location.origin || target.pathname !== window.location.pathname) {
        window.location.assign(to);
        return;
    }
    // A hash target scrolls itself to the anchor, so skip the reset-to-top that
    // top-level page changes want. A bare same-path click still resets to top.
    const hasHash = keepScroll || to.includes("#");
    if (to === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        if (!hasHash) window.scrollTo({ top: 0 });
        return;
    }
    window.history.pushState({}, "", to);
    if (!hasHash) window.scrollTo({ top: 0 });
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
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                const target = new URL(to, window.location.href);
                if (target.origin !== window.location.origin || target.pathname !== window.location.pathname) return;
                e.preventDefault();
                navigate(to);
            }}
            {...rest}
        >
            {children}
        </a>
    );
}
