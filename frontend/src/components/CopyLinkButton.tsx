import { useEffect, useRef, useState } from "react";

interface Props {
    // Absolute path (with leading "/") to the item, e.g. "/actuators?sel=abc" or
    // "/robots#i2rt-yam". Resolved against the current origin when copied.
    path: string;
    label: string;
    className?: string;
}

// Copies a shareable deeplink to the clipboard with a brief "Copied" confirm.
// Falls back to a hidden textarea + execCommand where the async clipboard API
// is unavailable (older Safari, non-secure contexts).
export function CopyLinkButton({ path, label, className }: Props) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );

    const copy = async () => {
        const url = `${window.location.origin}${path}`;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const ta = document.createElement("textarea");
                ta.value = url;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                let ok = false;
                try {
                    ok = document.execCommand("copy");
                } finally {
                    document.body.removeChild(ta);
                }
                // execCommand reports failure by returning false, not by
                // throwing; treat that as a failed copy so the catch handles it.
                if (!ok) throw new Error("copy command rejected");
            }
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1400);
        } catch {
            // Clipboard blocked (permissions, insecure context): leave the UI
            // unchanged rather than showing a false "Copied".
        }
    };

    return (
        <button
            type="button"
            className={`copy-link${className ? ` ${className}` : ""}`}
            data-copied={copied}
            onClick={(e) => {
                e.stopPropagation();
                void copy();
            }}
            aria-label={label}
            title={copied ? "Link copied" : "Copy link"}
        >
            {copied ? "✓" : "🔗"}
        </button>
    );
}
