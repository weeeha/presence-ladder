import { describe, expect, it } from "vitest";
import exchangeJson from "../fixture/exchange.json";
import type { Exchange } from "./agent-source";
import { scheduleExchange, stateFor } from "./fixture-schedule";

const exchange = exchangeJson as Exchange;

describe("fixture schedule", () => {
  it("turns three exchanges into listening, thinking, speaking, repeated", () => {
    const states = scheduleExchange(exchange).map(stateFor);
    expect(states).toEqual([
      "listening", "thinking", "speaking",
      "listening", "thinking", "speaking",
      "listening", "thinking", "speaking",
    ]);
  });

  it("keeps the user turn durations and the agent audio names", () => {
    const segments = scheduleExchange(exchange, 900);
    expect(segments[0]).toEqual({ kind: "user", index: 0, durationMs: 3200 });
    expect(segments[1]).toEqual({ kind: "think", durationMs: 900 });
    expect(segments[2]).toEqual({ kind: "agent", index: 1, audio: "agent-1.wav" });
  });

  it("refuses an agent turn without audio", () => {
    expect(() => scheduleExchange({ title: "", voice: "", turns: [{ role: "agent", text: "x" }] })).toThrow(/no audio/);
  });
});
