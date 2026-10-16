import { now as defaultNow, type LadderState } from "./agent-source";

export type RungId = "orb" | "character" | "face" | "gwm";
export const RUNGS: readonly RungId[] = ["orb", "character", "face", "gwm"];

export interface Transition {
  state: LadderState;
  at: number;
  /** First frame on which each rung visibly reflected this transition. */
  visibleAt: Partial<Record<RungId, number>>;
}

export interface LadderSnapshot {
  state: LadderState;
  stateChangedAt: number;
  transitions: readonly Transition[];
  turnIndex: number;
  caption: string | null;
  captionRole: "user" | "agent" | null;
  /** First audio sample of the current agent turn. */
  audioStartAt: number | null;
  /** First mouth movement per rung for the current agent turn. */
  mouthAt: Partial<Record<RungId, number>>;
  running: boolean;
}

export interface Ladder {
  getSnapshot(): LadderSnapshot;
  subscribe(fn: () => void): () => void;
  setState(state: LadderState, at?: number): void;
  markVisible(rung: RungId, at?: number): void;
  markAudioStart(at: number): void;
  markMouth(rung: RungId, at?: number): void;
  setCaption(role: "user" | "agent" | null, text: string | null, index: number): void;
  setRunning(running: boolean): void;
  reset(): void;
}

const initial = (): LadderSnapshot => ({
  state: "idle",
  stateChangedAt: 0,
  transitions: [],
  turnIndex: -1,
  caption: null,
  captionRole: null,
  audioStartAt: null,
  mouthAt: {},
  running: false,
});

/**
 * The one source of truth for "what state is the agent in, and when did each
 * rung show it". Framework-free so it can be tested without a DOM and read
 * from React through useSyncExternalStore.
 */
export function createLadder(now: () => number = defaultNow): Ladder {
  let snap = initial();
  const listeners = new Set<() => void>();
  const publish = (next: LadderSnapshot) => {
    snap = next;
    for (const fn of listeners) fn();
  };

  return {
    getSnapshot: () => snap,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    setState(state, at = now()) {
      if (state === snap.state) return;
      const transition: Transition = { state, at, visibleAt: {} };
      publish({ ...snap, state, stateChangedAt: at, transitions: [...snap.transitions, transition] });
    },
    markVisible(rung, at = now()) {
      const last = snap.transitions[snap.transitions.length - 1];
      if (!last || last.visibleAt[rung] !== undefined || at < last.at) return;
      const updated: Transition = { ...last, visibleAt: { ...last.visibleAt, [rung]: at } };
      publish({ ...snap, transitions: [...snap.transitions.slice(0, -1), updated] });
    },
    markAudioStart(at) {
      publish({ ...snap, audioStartAt: at, mouthAt: {} });
    },
    markMouth(rung, at = now()) {
      if (snap.audioStartAt === null || snap.mouthAt[rung] !== undefined || at < snap.audioStartAt) return;
      publish({ ...snap, mouthAt: { ...snap.mouthAt, [rung]: at } });
    },
    setCaption(role, text, index) {
      publish({ ...snap, captionRole: role, caption: text, turnIndex: index });
    },
    setRunning(running) {
      if (running === snap.running) return;
      publish({ ...snap, running });
    },
    reset() {
      publish(initial());
    },
  };
}
