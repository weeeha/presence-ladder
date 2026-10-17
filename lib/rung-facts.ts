import type { RungId } from "./ladder";

/** What is true of each renderer regardless of the run. Measured values live in the store. */
export interface RungFacts {
  name: string;
  number: string;
  source: string;
  cost: string;
  expresses: string;
}

export const RUNG_FACTS: Record<RungId, RungFacts> = {
  orb: {
    name: "Orb",
    number: "01",
    source: "AI-Orb, one WebGL program",
    cost: "0",
    expresses: "4 states, 2 audio levels",
  },
  character: {
    name: "Character",
    number: "02",
    source: "AI-Avatars, assistant iris",
    cost: "0",
    expresses: "12 activities, 7 expressions, gaze",
  },
  face: {
    name: "Portrait",
    number: "03",
    source: "MuseTalk, pre-rendered clips",
    cost: "local GPU, RTX 3090",
    expresses: "lips, a real face",
  },
  gwm: {
    name: "Generated human",
    number: "04",
    source: "Runway avatar SDK, GWM-1",
    cost: "credits, not measured",
    expresses: "lips, gaze, generated face, own voice",
  },
};
