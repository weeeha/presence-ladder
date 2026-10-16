"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Exchange } from "@/lib/agent-source";
import { createLadder } from "@/lib/ladder";
import { useLadder } from "@/lib/use-ladder";
import { FixtureSource } from "@/lib/fixture-source";
import { StateStrip } from "./state-strip";
import { RungTile } from "./rung-tile";
import { Hud } from "./hud";
import { OrbRung } from "@/rungs/orb-rung";
import { CharacterRung } from "@/rungs/character-rung";
import { FaceRung } from "@/rungs/face-rung";
import { GwmRung } from "@/rungs/gwm-rung";

const STILL = "/face/still-placeholder.png";

export function LadderView({ exchange }: { exchange: Exchange }) {
  const ladder = useMemo(() => createLadder(), []);
  const snap = useLadder(ladder);
  const sourceRef = useRef<FixtureSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    ladder.reset();
    const source = new FixtureSource(exchange);
    sourceRef.current = source;
    source.on("state", (s, at) => ladder.setState(s, at));
    source.on("turn", (turn, index) => ladder.setCaption(turn?.role ?? null, turn?.text ?? null, index));
    source.on("audioStart", (at, index) => {
      ladder.markAudioStart(at);
      // Wall-clock stamp for the film tool, which muxes the fixture audio onto a screen recording.
      console.info("ladder:audio", index, Math.round(Date.now() + (at - performance.now())));
    });
    source.on("error", (message) => {
      setError(message);
      ladder.setRunning(false);
    });
    source.on("done", () => {
      ladder.setRunning(false);
      console.info("ladder:done", Date.now());
    });
    ladder.setRunning(true);
    console.info("ladder:start", Date.now());
    await source.start();
  };

  const stop = () => {
    sourceRef.current?.stop();
    ladder.setRunning(false);
  };

  useEffect(() => () => sourceRef.current?.stop(), []);

  const inputLevel = () => sourceRef.current?.levels.input ?? 0;
  const outputLevel = () => sourceRef.current?.levels.output ?? 0;

  const turn = snap.turnIndex >= 0 ? exchange.turns[snap.turnIndex] : null;
  const faceClip = turn?.role === "agent" ? turn.faceClip : undefined;
  const loading = snap.running && snap.transitions.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-28 font-medium leading-tight">How much face does an agent need?</h1>
        <p className="max-w-2xl text-14 text-text-2">
          One agent, four presences, the same moment. Each rung shows what it costs to react.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-label="Agent state and transcript">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <StateStrip state={snap.state} />
          </div>
          <button
            type="button"
            onClick={snap.running ? stop : start}
            className={`h-10 min-w-40 shrink-0 rounded-s border px-4 text-14 ${
              snap.running ? "border-line-strong text-text" : "border-accent bg-accent-soft text-accent"
            }`}
          >
            {loading ? "Loading audio" : snap.running ? "Stop" : "Play the exchange"}
          </button>
        </div>
        <p className="min-h-12 text-14 text-text-2" aria-live="polite">
          {error ? (
            <span className="text-warn">{error}</span>
          ) : snap.caption ? (
            <>
              <span className="text-text-3">{snap.captionRole === "user" ? "You" : "Agent"}: </span>
              {snap.caption}
            </>
          ) : null}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="The four rungs">
        <RungTile rung="orb" hud={<Hud rung="orb" snap={snap} />}>
          <OrbRung ladder={ladder} state={snap.state} inputLevel={inputLevel} outputLevel={outputLevel} />
        </RungTile>
        <RungTile rung="character" hud={<Hud rung="character" snap={snap} />}>
          <CharacterRung ladder={ladder} state={snap.state} />
        </RungTile>
        <RungTile
          rung="face"
          hud={
            <Hud
              rung="face"
              snap={snap}
              overrides={{
                react: snap.transitions.some((t) => t.visibleAt.face !== undefined) ? undefined : "holds until it speaks",
                lips: faceClip ? "in sync, pre-rendered" : "clip not rendered yet",
              }}
            />
          }
        >
          <FaceRung ladder={ladder} snap={snap} exchange={exchange} still={STILL} />
        </RungTile>
        <RungTile rung="gwm" hud={<Hud rung="gwm" snap={snap} overrides={{ react: "not in this slice", lips: "not in this slice" }} />}>
          <GwmRung />
        </RungTile>
      </section>

      <footer className="flex max-w-3xl flex-col gap-2 text-12 text-text-3">
        <p>Fixture. {exchange.voice}</p>
        <p>
          react is measured in this browser: from the agent&apos;s state change to the rung&apos;s next painted frame, within one
          frame (16 ms at 60 Hz). lips is the gap from the first audio sample to the first mouth movement.
        </p>
        <p>Live-mode bench not captured yet. The full build adds a live microphone, live lip-sync on ArtPC, and the GWM-1 rung.</p>
      </footer>
    </main>
  );
}
