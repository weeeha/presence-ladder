/** One agent, many presences. Everything a rung needs comes through this interface. */

export type LadderState = "idle" | "listening" | "thinking" | "speaking" | "error";
export type SourceKind = "fixture" | "runway";

export interface Turn {
  role: "user" | "agent";
  text: string;
  /** User turns: how long the fixture holds `listening`. Agent turns: ignored, the audio decides. */
  durationMs?: number;
  /** Agent turns: path under /fixture/ to the pre-rendered WAV. */
  audio?: string;
  /** Agent turns: MuseTalk clip under /face/, rendered from the same WAV. Absent until rendered. */
  faceClip?: string;
}

export interface Exchange {
  title: string;
  /** Who the agent voice is, printed on the page so nothing is passed off as live. */
  voice: string;
  turns: Turn[];
}

/** Mutable at animation rate. Rungs read it every frame; the store never copies it. */
export interface Levels {
  input: number;
  output: number;
}

export interface AgentEvents {
  state: (state: LadderState, at: number) => void;
  turn: (turn: Turn | null, index: number) => void;
  stream: (stream: MediaStream | null) => void;
  /** First audio sample of an agent turn, in performance.now() time. */
  audioStart: (at: number, index: number) => void;
  done: () => void;
  error: (message: string) => void;
}

type AnyHandler = (...args: never[]) => void;

export class Emitter {
  private handlers = new Map<keyof AgentEvents, Set<AnyHandler>>();

  on<K extends keyof AgentEvents>(event: K, fn: AgentEvents[K]): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as AnyHandler);
    return () => {
      set?.delete(fn as AnyHandler);
    };
  }

  emit<K extends keyof AgentEvents>(event: K, ...args: Parameters<AgentEvents[K]>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of set) (fn as (...a: Parameters<AgentEvents[K]>) => void)(...args);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export interface AgentSource {
  readonly kind: SourceKind;
  readonly levels: Levels;
  on: Emitter["on"];
  start(): Promise<void>;
  stop(): void;
}

export function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
