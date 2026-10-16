import type { RungId, Transition } from "./ladder";

/** Milliseconds from the agent changing state to this rung visibly changing. */
export function reactMs(t: Transition, rung: RungId): number | null {
  const v = t.visibleAt[rung];
  return v === undefined ? null : Math.max(0, v - t.at);
}

/** Milliseconds from the first audio sample to the first mouth movement. */
export function lipsMs(audioStartAt: number | null, mouthAt: number | undefined): number | null {
  if (audioStartAt === null || mouthAt === undefined) return null;
  return Math.max(0, mouthAt - audioStartAt);
}

export function p50(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function reactSummary(transitions: readonly Transition[], rung: RungId): { p50: number | null; samples: number } {
  const values = transitions.map((t) => reactMs(t, rung)).filter((v): v is number => v !== null);
  return { p50: p50(values), samples: values.length };
}

export function formatMs(value: number | null, fallback = "not measured"): string {
  if (value === null) return fallback;
  return `${Math.round(value)} ms`;
}
