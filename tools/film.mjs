// Records Film A: the fixture playing in a 1920x1080 browser, then muxes the
// agent WAVs onto the recording at the wall-clock offsets the page logged.
// Usage: node tools/film.mjs [url] [out.mp4]
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

const url = process.argv[2] ?? "http://localhost:3017/";
const out = process.argv[3] ?? "docs/film-a.mp4";
const tmp = path.resolve("docs/.film-tmp");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist"] });
const videoStart = Date.now();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: tmp, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();
const audio = new Map(); // turn index -> epoch ms
let done = null;
page.on("console", (m) => {
  const t = m.text();
  if (t.startsWith("ladder:audio")) {
    const [, i, epoch] = t.split(" ");
    audio.set(Number(i), Number(epoch));
  }
  if (t.startsWith("ladder:done")) done = Number(t.split(" ")[1]);
});
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: "Play the exchange" }).click();
const started = Date.now();
while (!done && Date.now() - started < 60000) await page.waitForTimeout(250);
await page.waitForTimeout(2500);
const hud = await page.locator("dl").allInnerTexts();
await context.close();
await browser.close();

const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
const video = path.join(tmp, webm);
const turns = [...audio.entries()].sort((a, b) => a[0] - b[0]);
console.log("audio starts (ms into video):", turns.map(([i, e]) => `${i}:${e - videoStart}`).join(" "));
console.log("HUD at end:", hud.map((t) => t.replace(/\s+/g, " ")).join(" | "));

// Agent turns are indices 1, 3, 5 in the fixture; their WAVs are agent-1..3.
const inputs = [];
const filters = [];
turns.forEach(([index, epoch], n) => {
  const wav = `public/fixture/agent-${(index + 1) / 2}.wav`;
  inputs.push("-i", wav);
  const delay = Math.max(0, epoch - videoStart);
  filters.push(`[${n + 1}]adelay=${delay}|${delay}[a${n}]`);
});
const mix = `${filters.join(";")};${turns.map((_, n) => `[a${n}]`).join("")}amix=inputs=${turns.length}:normalize=0[aout]`;
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-i", video, ...inputs,
  "-filter_complex", mix,
  "-map", "0:v", "-map", "[aout]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
  "-c:a", "aac", "-b:a", "160k", "-shortest",
  out,
]);
rmSync(tmp, { recursive: true, force: true });
console.log("wrote", out);
