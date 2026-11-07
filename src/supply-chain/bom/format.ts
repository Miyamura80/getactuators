// "9.1x" under 10, "180x" above: an idiot index or step multiplier, shared
// by the React badges and the markdown twins.
export function idiotText(n: number): string {
    return `${n < 10 ? Number(n.toFixed(1)) : Math.round(n).toLocaleString("en-US")}x`;
}
