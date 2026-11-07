// /metals: the metals in an actuator's magnet, who controls each step, how
// much is left and how the price is set. Data only; zod wire shapes live in
// ./views (server side).

export const METALS_PATH = "/metals";
export const METALS_AS_OF = "October 2026";

export * from "./drivers";
export * from "./elements";
export * from "./events";
export * from "./grades";
export * from "./market";
export * from "./prices";
export * from "./reserves";
export * from "./stage-shares";
