import { Emitter, now, type AgentSource, type Exchange, type Levels } from "./agent-source";
import { scheduleExchange, type Segment } from "./fixture-schedule";

export interface FixtureOptions {
  /** Where the agent WAVs live. */
  baseUrl?: string;
  thinkMs?: number;
  audioContext?: AudioContext;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * The scripted agent. User turns are captions that hold `listening` with a
 * synthetic microphone envelope; agent turns play pre-rendered audio through
 * a real AudioContext so every level and stream a rung sees is real audio.
 */
export class FixtureSource implements AgentSource {
  readonly kind = "fixture" as const;
  readonly levels: Levels = { input: 0, output: 0 };

  private emitter = new Emitter();
  on = this.emitter.on.bind(this.emitter);

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private data = new Uint8Array(0);
  private raf = 0;
  private stopped = false;
  private playing: AudioBufferSourceNode | null = null;
  private synthUntil = 0;

  constructor(private exchange: Exchange, private opts: FixtureOptions = {}) {}

  async start(): Promise<void> {
    this.stopped = false;
    const ctx = this.opts.audioContext ?? new AudioContext();
    this.ctx = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.5;
    this.analyser = analyser;
    this.data = new Uint8Array(analyser.fftSize);
    const tap = ctx.createMediaStreamDestination();
    analyser.connect(ctx.destination);
    analyser.connect(tap);
    this.emitter.emit("stream", tap.stream);

    try {
      await this.preload();
    } catch (e) {
      this.emitter.emit("error", e instanceof Error ? e.message : String(e));
      return;
    }

    this.tick();
    for (const segment of scheduleExchange(this.exchange, this.opts.thinkMs)) {
      if (this.stopped) return;
      await this.play(segment);
    }
    if (this.stopped) return;
    this.emitter.emit("turn", null, -1);
    this.emitter.emit("state", "idle", now());
    this.emitter.emit("done");
  }

  stop(): void {
    this.stopped = true;
    this.synthUntil = 0;
    cancelAnimationFrame(this.raf);
    try {
      this.playing?.stop();
    } catch {
      /* already ended */
    }
    this.playing = null;
    this.levels.input = 0;
    this.levels.output = 0;
    this.emitter.emit("stream", null);
    this.emitter.emit("turn", null, -1);
    this.emitter.emit("state", "idle", now());
  }

  private async preload(): Promise<void> {
    const ctx = this.ctx!;
    const base = this.opts.baseUrl ?? "/fixture/";
    const names = this.exchange.turns.filter((t) => t.role === "agent").map((t) => t.audio!);
    await Promise.all(
      names.map(async (name) => {
        const res = await fetch(base + name);
        if (!res.ok) throw new Error(`fixture audio missing: ${name} (${res.status})`);
        this.buffers.set(name, await ctx.decodeAudioData(await res.arrayBuffer()));
      }),
    );
  }

  private async play(segment: Segment): Promise<void> {
    if (segment.kind === "user") {
      const turn = this.exchange.turns[segment.index];
      this.emitter.emit("turn", turn, segment.index);
      this.emitter.emit("state", "listening", now());
      this.synthUntil = now() + segment.durationMs;
      await sleep(segment.durationMs);
      this.synthUntil = 0;
      return;
    }
    if (segment.kind === "think") {
      this.emitter.emit("state", "thinking", now());
      await sleep(segment.durationMs);
      return;
    }
    const ctx = this.ctx!;
    const turn = this.exchange.turns[segment.index];
    const buffer = this.buffers.get(segment.audio)!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser!);
    const startAt = ctx.currentTime + 0.05;
    const perfStart = now() + (startAt - ctx.currentTime) * 1000;
    this.playing = source;
    this.emitter.emit("turn", turn, segment.index);
    this.emitter.emit("state", "speaking", now());
    this.emitter.emit("audioStart", perfStart, segment.index);
    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start(startAt);
    });
    this.playing = null;
  }

  /** Levels at animation rate. Output from the analyser, input synthesized during user captions. */
  private tick = () => {
    if (this.stopped) return;
    const t = now();
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.data);
      let sum = 0;
      for (let i = 0; i < this.data.length; i++) {
        const v = (this.data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / this.data.length);
      this.levels.output = Math.min(1, rms * 3.2);
    }
    if (t < this.synthUntil) {
      const s = 0.42 + 0.22 * Math.sin(t / 170) + 0.14 * Math.sin(t / 61) + 0.1 * Math.sin(t / 23);
      this.levels.input = Math.max(0, Math.min(1, s));
    } else {
      this.levels.input *= 0.85;
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
