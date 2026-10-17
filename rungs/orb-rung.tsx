"use client";

import { useEffect } from "react";
import { Orb, type OrbState } from "@/vendor/ai-orb";
import type { LadderState } from "@/lib/agent-source";
import type { Ladder } from "@/lib/ladder";

const ORB_STATE: Record<LadderState, OrbState> = {
  idle: "idle",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  error: "idle",
};

export function OrbRung({
  ladder,
  state,
  inputLevel,
  outputLevel,
}: {
  ladder: Ladder;
  state: LadderState;
  inputLevel: () => number;
  outputLevel: () => number;
}) {
  useEffect(() => {
    const id = requestAnimationFrame(() => ladder.markVisible("orb"));
    return () => cancelAnimationFrame(id);
  }, [state, ladder]);

  return (
    <Orb
      finish="aurora"
      field="dark"
      state={ORB_STATE[state]}
      inputLevelRef={inputLevel}
      outputLevelRef={outputLevel}
      style={{ width: "100%", aspectRatio: "1" }}
    />
  );
}
