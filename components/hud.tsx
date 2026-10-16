import type { LadderSnapshot, RungId } from "@/lib/ladder";
import { formatMs, reactSummary } from "@/lib/metrics";
import { RUNG_FACTS } from "@/lib/rung-facts";

export interface HudOverrides {
  react?: string;
  lips?: string;
}

/** Four rows under every tile. Measured values come from the store; facts from rung-facts. */
export function Hud({ rung, snap, overrides = {} }: { rung: RungId; snap: LadderSnapshot; overrides?: HudOverrides }) {
  const facts = RUNG_FACTS[rung];
  const summary = reactSummary(snap.transitions, rung);
  const react =
    overrides.react ??
    (summary.samples === 0
      ? "not measured yet"
      : `${formatMs(summary.p50)} p50, ${summary.samples} ${summary.samples === 1 ? "sample" : "samples"}`);

  const rows: [string, string][] = [
    ["react", react],
    ["lips", overrides.lips ?? "none"],
    ["cost / min", facts.cost],
    ["expresses", facts.expresses],
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-12">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-text-3">{k}</dt>
          <dd className="font-mono text-text-2 min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
