import { describe, expect, it } from "vitest";
import { createLadder } from "./ladder";

function clock(start = 1000) {
  let t = start;
  return { now: () => t, tick: (ms: number) => (t += ms) };
}

describe("ladder store", () => {
  it("records a transition with its timestamp and ignores repeats", () => {
    const c = clock();
    const ladder = createLadder(c.now);
    ladder.setState("listening");
    c.tick(500);
    ladder.setState("listening");
    expect(ladder.getSnapshot().transitions).toHaveLength(1);
    expect(ladder.getSnapshot().transitions[0]).toMatchObject({ state: "listening", at: 1000 });
  });

  it("keeps transitions in order with monotonic timestamps", () => {
    const c = clock();
    const ladder = createLadder(c.now);
    for (const s of ["listening", "thinking", "speaking", "idle"] as const) {
      c.tick(100);
      ladder.setState(s);
    }
    const ats = ladder.getSnapshot().transitions.map((t) => t.at);
    expect(ats).toEqual([1100, 1200, 1300, 1400]);
  });

  it("marks the first visible frame per rung once per transition", () => {
    const c = clock();
    const ladder = createLadder(c.now);
    ladder.setState("speaking");
    c.tick(16);
    ladder.markVisible("orb");
    c.tick(16);
    ladder.markVisible("orb");
    expect(ladder.getSnapshot().transitions[0].visibleAt.orb).toBe(1016);
  });

  it("refuses a visible mark that predates the transition", () => {
    const c = clock();
    const ladder = createLadder(c.now);
    ladder.setState("speaking");
    ladder.markVisible("character", 900);
    expect(ladder.getSnapshot().transitions[0].visibleAt.character).toBeUndefined();
  });

  it("tracks first mouth movement per rung after an audio start", () => {
    const c = clock();
    const ladder = createLadder(c.now);
    ladder.markMouth("face");
    expect(ladder.getSnapshot().mouthAt.face).toBeUndefined();
    ladder.markAudioStart(2000);
    ladder.markMouth("face", 2600);
    ladder.markMouth("face", 2700);
    expect(ladder.getSnapshot().mouthAt.face).toBe(2600);
    ladder.markAudioStart(5000);
    expect(ladder.getSnapshot().mouthAt).toEqual({});
  });

  it("notifies subscribers and stops after unsubscribe", () => {
    const ladder = createLadder(clock().now);
    let calls = 0;
    const off = ladder.subscribe(() => calls++);
    ladder.setState("listening");
    off();
    ladder.setState("thinking");
    expect(calls).toBe(1);
  });
});
