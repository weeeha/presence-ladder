import type { Exchange } from "./agent-source";

export type Segment =
  | { kind: "user"; index: number; durationMs: number }
  | { kind: "think"; durationMs: number }
  | { kind: "agent"; index: number; audio: string };

/**
 * The fixture's timeline as data: a user turn holds `listening`, a fixed
 * pause holds `thinking`, an agent turn holds `speaking` for its audio.
 * Pure so the ordering can be tested without audio.
 */
export function scheduleExchange(exchange: Exchange, thinkMs = 1200): Segment[] {
  const out: Segment[] = [];
  exchange.turns.forEach((turn, index) => {
    if (turn.role === "user") {
      out.push({ kind: "user", index, durationMs: turn.durationMs ?? 3000 });
    } else {
      if (!turn.audio) throw new Error(`agent turn ${index} has no audio`);
      const previous = out[out.length - 1];
      if (previous && previous.kind === "user") out.push({ kind: "think", durationMs: thinkMs });
      out.push({ kind: "agent", index, audio: turn.audio });
    }
  });
  return out;
}

export function stateFor(segment: Segment): "listening" | "thinking" | "speaking" {
  return segment.kind === "user" ? "listening" : segment.kind === "think" ? "thinking" : "speaking";
}
