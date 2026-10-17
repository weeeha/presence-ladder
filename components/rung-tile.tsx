import type { ReactNode } from "react";
import type { RungId } from "@/lib/ladder";
import { RUNG_FACTS } from "@/lib/rung-facts";

export function RungTile({ rung, children, hud }: { rung: RungId; children: ReactNode; hud: ReactNode }) {
  const facts = RUNG_FACTS[rung];
  return (
    <article className="flex min-w-0 flex-col gap-3" aria-labelledby={`rung-${rung}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`rung-${rung}`} className="text-16 font-medium">
          {facts.name}
        </h2>
        <span className="font-mono text-12 text-text-3">{facts.number}</span>
      </div>
      <div className="rounded-m border border-line bg-surface p-4">{children}</div>
      <p className="text-12 text-text-3">{facts.source}</p>
      {hud}
    </article>
  );
}
