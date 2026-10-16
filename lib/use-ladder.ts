"use client";

import { useSyncExternalStore } from "react";
import type { Ladder, LadderSnapshot } from "./ladder";

const idle: LadderSnapshot = {
  state: "idle",
  stateChangedAt: 0,
  transitions: [],
  turnIndex: -1,
  caption: null,
  captionRole: null,
  audioStartAt: null,
  mouthAt: {},
  running: false,
};

export function useLadder(ladder: Ladder): LadderSnapshot {
  return useSyncExternalStore(ladder.subscribe, ladder.getSnapshot, () => idle);
}
