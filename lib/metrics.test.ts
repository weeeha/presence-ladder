import { describe, expect, it } from "vitest";
import type { Transition } from "./ladder";
import { formatMs, lipsMs, p50, reactMs, reactSummary } from "./metrics";

const t = (at: number, visibleAt: Transition["visibleAt"]): Transition => ({ state: "speaking", at, visibleAt });

describe("metrics", () => {
  it("reactMs is the gap to the rung's first visible frame, never negative, null when unmeasured", () => {
    expect(reactMs(t(100, { orb: 116 }), "orb")).toBe(16);
    expect(reactMs(t(100, { orb: 90 }), "orb")).toBe(0);
    expect(reactMs(t(100, {}), "orb")).toBeNull();
  });

  it("lipsMs needs both timestamps", () => {
    expect(lipsMs(1000, 1620)).toBe(620);
    expect(lipsMs(null, 1620)).toBeNull();
    expect(lipsMs(1000, undefined)).toBeNull();
  });

  it("p50 handles odd, even and empty", () => {
    expect(p50([5, 1, 3])).toBe(3);
    expect(p50([4, 1, 3, 2])).toBe(2.5);
    expect(p50([])).toBeNull();
  });

  it("reactSummary counts only measured transitions", () => {
    const summary = reactSummary([t(0, { orb: 10 }), t(100, {}), t(200, { orb: 230 })], "orb");
    expect(summary).toEqual({ p50: 20, samples: 2 });
  });

  it("formatMs rounds and names the unmeasured case", () => {
    expect(formatMs(16.4)).toBe("16 ms");
    expect(formatMs(null)).toBe("not measured");
  });
});
