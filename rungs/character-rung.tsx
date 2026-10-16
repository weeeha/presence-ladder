"use client";

import { useEffect, useState } from "react";
import type { LadderState } from "@/lib/agent-source";
import type { Ladder } from "@/lib/ladder";

/** The api `AbstractPerformance.mount` leaves on window. */
interface AbstractApi {
  setState(value: string, keepDemo?: boolean): void;
  setEmotion(value: string): void;
  setPaused(value: boolean): void;
  redraw(): void;
  getState(): { state: string; emotion: string; paused: boolean };
}

declare global {
  interface Window {
    AbstractPerformance?: unknown;
    abstractPreview?: AbstractApi;
  }
}

/** Ladder state to the runtime's activity vocabulary. */
const ACTIVITY: Record<LadderState, string> = {
  idle: "idle",
  listening: "listening",
  thinking: "thinking",
  speaking: "answering",
  error: "error",
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`could not load ${src}`));
    document.body.append(el);
  });
}

let runtime: Promise<void> | null = null;

export function CharacterRung({ ladder, state }: { ladder: Ladder; state: LadderState }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // index.js mounts against #assistant-rings on load, so it runs after this component is in the DOM.
    if (!runtime) runtime = loadScript("/avatars/abstract-performance.js").then(() => loadScript("/avatars/index.js"));
    runtime
      .then(() => {
        if (cancelled) return;
        const api = window.abstractPreview;
        if (!api) {
          setFailed("Character runtime did not mount.");
          return;
        }
        api.setState("idle");
        api.setEmotion("neutral");
        setReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setFailed(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.abstractPreview?.setState(ACTIVITY[state]);
    const id = requestAnimationFrame(() => ladder.markVisible("character"));
    return () => cancelAnimationFrame(id);
  }, [ready, state, ladder]);

  return (
    <div id="assistant-rings" className="relative">
      <div className="abstract-stage">
        <canvas width={720} height={720} data-variant="assistant-iris" role="img" aria-label="Assistant iris" />
      </div>
      <p data-error role="alert" hidden className="mt-2 text-12 text-warn" />
      {failed && (
        <p role="alert" className="mt-2 text-12 text-warn">
          {failed}
        </p>
      )}
    </div>
  );
}
