import { useCallback, useState } from "react";
import {
    type LogoTheme,
    brandInitials,
    logoUrl,
    resolveBrand,
} from "../../../src/brands";

// Logo.dev publishable key (pk_...): public by design, baked in at build time.
// Unset means every logo is a monogram, which is also the no-network fallback.
const LOGO_TOKEN: string = import.meta.env.VITE_LOGO_DEV_TOKEN ?? "";

interface Props {
    // A registry id ("cubemars") or any dataset spelling ("CubeMars (T-Motor)").
    name: string;
    size?: number;
    theme?: LogoTheme;
    // True when the name is not printed beside the logo: the image then carries it.
    standalone?: boolean;
    className?: string;
}

// A company's mark in a small square tile: a self-hosted logo when we have one,
// else the provider's logo (logoUrl), else the company's initials. Never shifts layout.
export function CompanyLogo({ name, size = 16, theme = "dark", standalone = false, className }: Props) {
    const brand = resolveBrand(name);
    const label = brand?.name ?? name;
    const light = brand?.tile === "light";
    const src = brand?.logo ?? (brand?.domain ? logoUrl(brand.domain, size, LOGO_TOKEN, light ? "light" : theme) : null);
    // Remember which URL failed so a new src gets a fresh attempt.
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const failed = src !== null && failedSrc === src;
    // A prerendered <img> can fail before hydration attaches onError, so check
    // its state once it is attached.
    const img = useCallback(
        (el: HTMLImageElement | null) => {
            if (src && el?.complete && el.naturalWidth === 0) setFailedSrc(src);
        },
        [src],
    );

    const box = { width: size, height: size };
    const cls = `company-logo${light ? " company-logo-light" : ""}${className ? ` ${className}` : ""}`;
    if (!src || failed) {
        return (
            <span
                className={`${cls} company-logo-mono`}
                style={{ ...box, fontSize: Math.max(7, Math.round(size * 0.5)) }}
                role={standalone ? "img" : undefined}
                aria-label={standalone ? label : undefined}
                aria-hidden={standalone ? undefined : true}
                title={standalone ? label : undefined}
            >
                {brandInitials(label)}
            </span>
        );
    }
    return (
        <img
            ref={img}
            className={cls}
            src={src}
            alt={standalone ? label : ""}
            title={standalone ? label : undefined}
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            onError={() => setFailedSrc(src)}
        />
    );
}
