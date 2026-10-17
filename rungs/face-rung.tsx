"use client";

import { useEffect, useRef, useState } from "react";
import type { Exchange } from "@/lib/agent-source";
import type { Ladder, LadderSnapshot } from "@/lib/ladder";
import { now } from "@/lib/agent-source";

/**
 * Rung three in fixture mode: a still portrait that plays a pre-rendered
 * MuseTalk clip during agent turns. Visible change is only measurable when a
 * clip starts, which is the honest number: the portrait holds until it speaks.
 */
export function FaceRung({ ladder, snap, exchange, still }: { ladder: Ladder; snap: LadderSnapshot; exchange: Exchange; still: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showing, setShowing] = useState(false);
  const turn = snap.turnIndex >= 0 ? exchange.turns[snap.turnIndex] : null;
  const clip = turn?.role === "agent" ? turn.faceClip : undefined;

  useEffect(() => {
    const video = videoRef.current;
    if (!clip || !video || snap.audioStartAt === null) return;
    const delay = Math.max(0, snap.audioStartAt - now());
    const t = setTimeout(() => {
      video.currentTime = 0;
      void video.play().catch(() => setShowing(false));
    }, delay);
    return () => clearTimeout(t);
  }, [clip, snap.audioStartAt]);

  useEffect(() => {
    if (!snap.running) videoRef.current?.pause();
  }, [snap.running]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-full bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- static placeholder, no optimization wanted */}
      <img src={still} alt="Still portrait, the floor the lip-sync falls back to" className="absolute inset-0 h-full w-full object-cover" />
      {clip && (
        <video
          ref={videoRef}
          key={clip}
          src={`/face/${clip}`}
          muted
          playsInline
          preload="auto"
          aria-label="Lip-synced portrait"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: showing && snap.running ? 1 : 0 }}
          onPlaying={() => {
            setShowing(true);
            ladder.markVisible("face");
            ladder.markMouth("face");
          }}
          onEnded={() => setShowing(false)}
        />
      )}
    </div>
  );
}
