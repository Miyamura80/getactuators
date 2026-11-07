import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";

// Light helpers for the 3D kit wrappers. Nothing here imports three.js, so
// they ship in the page bundle and decide whether the 3D chunk loads at all.

let webgl: boolean | undefined;

export function hasWebGL(): boolean {
    if (webgl !== undefined) return webgl;
    try {
        const c = document.createElement("canvas");
        webgl = Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
    } catch {
        webgl = false;
    }
    return webgl;
}

// Tests flip WebGL support without a real context.
export function setWebGLSupport(value: boolean | undefined): void {
    webgl = value;
}

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribeMotion(cb: () => void): () => void {
    if (typeof window.matchMedia !== "function") return () => {};
    const mq = window.matchMedia(REDUCE);
    mq.addEventListener?.("change", cb);
    return () => mq.removeEventListener?.("change", cb);
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(
        subscribeMotion,
        () => typeof window.matchMedia === "function" && window.matchMedia(REDUCE).matches,
        () => false,
    );
}

// Whether the element is on screen now, and whether it ever has been.
// Without IntersectionObserver everything counts as visible.
export function useInView(ref: RefObject<Element | null>): { visible: boolean; seen: boolean } {
    const [state, setState] = useState(() => {
        const io = typeof IntersectionObserver === "function";
        return { visible: !io, seen: !io };
    });
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver !== "function") return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                const visible = Boolean(entry?.isIntersecting);
                setState((s) => ({ visible, seen: s.seen || visible }));
            },
            { rootMargin: "120px 0px", threshold: 0.15 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref]);
    return state;
}

// ---- One WebGL context per page ------------------------------------------
// Browsers cap live contexts (often at 16) and each costs memory, so the kit
// keeps one: the scene that most recently came into view (or was woken by a
// tap) is live; every other scene shows its poster until it claims the slot.

let live: string | null = null;
const listeners = new Set<() => void>();
const emit = () => {
    for (const l of listeners) l();
};

export function claimLive(key: string): void {
    if (live === key) return;
    live = key;
    emit();
}

export function releaseLive(key: string): void {
    if (live !== key) return;
    live = null;
    emit();
}

export function liveKey(): string | null {
    return live;
}

function subscribeLive(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function useLiveSlot(key: string, wanted: boolean): boolean {
    const isLive = useSyncExternalStore(
        subscribeLive,
        () => live === key,
        () => false,
    );
    useEffect(() => {
        if (wanted) claimLive(key);
    }, [key, wanted]);
    useEffect(() => () => releaseLive(key), [key]);
    return isLive;
}

// ---- Scroll-driven explode -------------------------------------------------

// 0 while the element's top is below the fold, 1 once its top has risen to
// the upper third of the viewport.
export function scrollProgress(top: number, viewport: number): number {
    if (viewport <= 0) return 0;
    return Math.min(1, Math.max(0, (viewport - top) / (viewport * 0.68)));
}

export function useScrollProgress(
    ref: RefObject<Element | null>,
    enabled: boolean,
    onChange: (p: number) => void,
): void {
    useEffect(() => {
        if (!enabled) return;
        let raf = 0;
        const update = () => {
            raf = 0;
            const el = ref.current;
            if (el) onChange(scrollProgress(el.getBoundingClientRect().top, window.innerHeight));
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [ref, enabled, onChange]);
}
