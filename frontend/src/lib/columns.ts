import type { ColumnDef } from "../types";
import { num, price } from "./format";

// Column definitions for the leaderboard table. Order here is display order.
export const COLUMNS: ColumnDef[] = [
    {
        key: "torque_density_nm_per_kg",
        label: "Torque density",
        unit: "N·m/kg",
        value: (a) => a.torque_density_nm_per_kg,
        display: (a) => num(a.torque_density_nm_per_kg, 1),
        higherIsBetter: true,
        bar: true,
        numeric: true,
    },
    {
        key: "peak_torque_nm",
        label: "Peak torque",
        unit: "N·m",
        value: (a) => a.peak_torque_nm,
        display: (a) => num(a.peak_torque_nm, 1),
        higherIsBetter: true,
        bar: true,
        numeric: true,
    },
    {
        key: "rated_torque_nm",
        label: "Rated torque",
        unit: "N·m",
        value: (a) => a.rated_torque_nm,
        display: (a) => num(a.rated_torque_nm, 1),
        higherIsBetter: true,
        numeric: true,
    },
    {
        key: "max_speed_rpm",
        label: "Max speed",
        unit: "rpm",
        value: (a) => a.max_speed_rpm,
        display: (a) => num(a.max_speed_rpm),
        higherIsBetter: true,
        numeric: true,
    },
    {
        key: "weight_g",
        label: "Weight",
        unit: "g",
        value: (a) => a.weight_g,
        display: (a) => num(a.weight_g),
        higherIsBetter: false,
        numeric: true,
    },
    {
        key: "backlash_arcmin",
        label: "Backlash",
        unit: "arcmin",
        value: (a) => a.backlash_arcmin,
        display: (a) => num(a.backlash_arcmin, 1),
        higherIsBetter: false,
        numeric: true,
    },
    {
        key: "price_usd",
        label: "Price",
        unit: "USD",
        value: (a) => a.price_usd,
        display: (a) => price(a.price_usd),
        higherIsBetter: false,
        numeric: true,
    },
    {
        key: "price_per_nm",
        label: "$ / N·m",
        unit: "peak",
        value: (a) => a.price_per_nm,
        display: (a) => (a.price_per_nm == null ? "–" : `$${num(a.price_per_nm, 1)}`),
        higherIsBetter: false,
        bar: true,
        numeric: true,
    },
];

export const COLUMN_MAP: Record<string, ColumnDef> = Object.fromEntries(
    COLUMNS.map((c) => [c.key, c]),
);
