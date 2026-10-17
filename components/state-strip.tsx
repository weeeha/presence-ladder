import type { LadderState } from "@/lib/agent-source";

const STEPS: { id: LadderState; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "listening", label: "Listening" },
  { id: "thinking", label: "Thinking" },
  { id: "speaking", label: "Speaking" },
];

/** Four fixed cells. Only colour changes on a state change; nothing moves. */
export function StateStrip({ state }: { state: LadderState }) {
  return (
    <ol className="flex gap-1" aria-label="Agent state">
      {STEPS.map((step) => {
        const active = step.id === state;
        return (
          <li
            key={step.id}
            aria-current={active ? "step" : undefined}
            className={`flex-1 rounded-s border px-3 py-2 text-center text-14 ${
              active ? "border-accent bg-accent-soft text-accent" : "border-line text-text-3"
            }`}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
