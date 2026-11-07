// Logo.dev publishable key (pk_...): public by design, baked in at build time.
// Unset means every provider logo is a monogram, which is also the
// no-network fallback. Read by CompanyLogo and the /people network.
export const LOGO_TOKEN: string = import.meta.env.VITE_LOGO_DEV_TOKEN ?? "";
