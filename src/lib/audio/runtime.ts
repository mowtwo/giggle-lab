"use client";

import * as Tone from "tone";

import type { AnimaleseOptions, AudioBus, SfxName } from "./state";

let initialized = false;
let masterGain: Tone.Gain | null = null;
let musicGain: Tone.Gain | null = null;
let voiceGain: Tone.Gain | null = null;
let sfxGain: Tone.Gain | null = null;

type BgmSetup = {
  synths: { dispose: () => void }[];
  loops: Tone.Loop[];
};

let bgmSetup: BgmSetup | null = null;
let bgmPlaying = false;

const sfxPlayers = new Map<SfxName, () => void>();

type PinyinModule = typeof import("pinyin-pro");
let pinyinLoader: Promise<PinyinModule> | null = null;
async function getPinyin(): Promise<PinyinModule> {
  if (!pinyinLoader) {
    pinyinLoader = import(/* webpackChunkName: "pinyin" */ "pinyin-pro");
  }
  return pinyinLoader;
}

// ---- Animalese letter library ----
// Faithful port of Acedio/animalese.js (MIT, Josh Simmons 2014).
// One WAV sprite, 26 letters, each LIBRARY_LETTER_SECS long.
// Output is OUTPUT_LETTER_SECS per character, with playbackRate = pitch.
const LIBRARY_LETTER_SECS = 0.15;
const OUTPUT_LETTER_SECS = 0.075;
const ANIMALESE_WAV = "/audio/animalese.wav";

let letterBuffer: Tone.ToneAudioBuffer | null = null;
let letterBufferPromise: Promise<Tone.ToneAudioBuffer> | null = null;

function loadLetterBuffer(): Promise<Tone.ToneAudioBuffer> {
  if (letterBuffer) return Promise.resolve(letterBuffer);
  if (!letterBufferPromise) {
    letterBufferPromise = new Promise((resolve, reject) => {
      const buf = new Tone.ToneAudioBuffer(
        ANIMALESE_WAV,
        () => resolve(buf),
        (err) => reject(err),
      );
    });
    letterBufferPromise.then((b) => {
      letterBuffer = b;
    });
  }
  return letterBufferPromise;
}

export async function unlock() {
  if (!initialized) {
    initialized = true;
    masterGain = new Tone.Gain(1).toDestination();
    musicGain = new Tone.Gain(0.55).connect(masterGain);
    voiceGain = new Tone.Gain(0.7).connect(masterGain);
    sfxGain = new Tone.Gain(0.7).connect(masterGain);
  }
  await Tone.start();
  // Kick the WAV download in the background; subsequent reads will hit cache.
  void loadLetterBuffer().catch(() => {});
}

export function setMasterMute(muted: boolean) {
  if (!masterGain) return;
  masterGain.gain.cancelScheduledValues(Tone.now());
  masterGain.gain.rampTo(muted ? 0 : 1, 0.18);
}

export function setVolume(bus: AudioBus, value: number) {
  const target = bus === "music" ? musicGain : bus === "sfx" ? sfxGain : voiceGain;
  if (!target) return;
  const clamped = Math.max(0, Math.min(1, value));
  target.gain.cancelScheduledValues(Tone.now());
  target.gain.rampTo(clamped, 0.08);
}

// ---- BGM ----

function ensureBgmSetup() {
  if (bgmSetup || !musicGain) return;

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.4, decay: 0.5, sustain: 0.42, release: 1.7 },
  }).connect(musicGain);
  pad.volume.value = -18;

  const bass = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.4, release: 0.7 },
  }).connect(musicGain);
  bass.volume.value = -10;

  const melody = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.04, decay: 0.25, sustain: 0.22, release: 0.6 },
  }).connect(musicGain);
  melody.volume.value = -13;

  const bell = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.5, sustain: 0, release: 0.6 },
  }).connect(musicGain);
  bell.volume.value = -20;

  const progression: string[][] = [
    ["C4", "E4", "G4", "B4"],
    ["A3", "C4", "E4", "G4"],
    ["F3", "A3", "C4", "E4"],
    ["G3", "B3", "D4", "F4"],
  ];
  const bassNotes = ["C2", "A2", "F2", "G2"];
  const pentatonic = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"];

  let chordIdx = 0;

  const chordLoop = new Tone.Loop((time) => {
    pad.triggerAttackRelease(progression[chordIdx], "1m", time, 0.5);
    bass.triggerAttackRelease(bassNotes[chordIdx], "2n", time, 0.7);
    chordIdx = (chordIdx + 1) % progression.length;
  }, "1m").start(0);

  const melodyLoop = new Tone.Loop((time) => {
    if (Math.random() > 0.34) {
      const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      melody.triggerAttackRelease(note, "8n", time, 0.55);
    }
  }, "4n").start(0);

  const bellLoop = new Tone.Loop((time) => {
    if (Math.random() > 0.78) {
      const note = pentatonic[Math.floor(Math.random() * 4) + 4];
      bell.triggerAttackRelease(note, "16n", time, 0.5);
    }
  }, "2n").start(0);

  bgmSetup = {
    synths: [pad, bass, melody, bell],
    loops: [chordLoop, melodyLoop, bellLoop],
  };
}

export function startBgm() {
  if (!musicGain) return;
  ensureBgmSetup();
  if (bgmPlaying) return;
  bgmPlaying = true;
  Tone.Transport.bpm.value = 84;
  if (Tone.Transport.state !== "started") {
    Tone.Transport.start("+0.05");
  }
}

export function stopBgm() {
  if (!bgmPlaying) return;
  bgmPlaying = false;
  if (Tone.Transport.state === "started") Tone.Transport.stop();
}

// ---- Animalese ----

function shortenWord(s: string): string {
  return s.length > 1 ? s[0] + s[s.length - 1] : s;
}

function applyShorten(text: string): string {
  return text
    .replace(/[^a-z]/gi, " ")
    .split(" ")
    .filter((w) => w.length > 0)
    .map(shortenWord)
    .join(" ");
}

async function toLatin(text: string): Promise<string> {
  if (!/[一-鿿]/.test(text)) return text;
  try {
    const mod = await getPinyin();
    return mod.pinyin(text, {
      toneType: "none",
      type: "string",
      v: true,
      nonZh: "consecutive",
    });
  } catch {
    return text;
  }
}

// playId increments on every call. Sources record the id they belong to so we
// can stop only the current generation if a new call comes in.
let playId = 0;
let activeSources: { id: number; src: Tone.ToneBufferSource }[] = [];

function stopActive() {
  for (const entry of activeSources) {
    try {
      entry.src.stop();
    } catch {
      // ignore
    }
    entry.src.dispose();
  }
  activeSources = [];
}

export async function playAnimalese(
  text: string,
  options: AnimaleseOptions,
): Promise<number> {
  if (!voiceGain) return 0;
  // Take the lock synchronously so concurrent calls know they're stale.
  stopActive();
  const myId = ++playId;

  const lib = await loadLetterBuffer().catch(() => null);
  if (!lib || myId !== playId) return 0;

  const latinSrc = await toLatin(text);
  if (myId !== playId) return 0;
  const processed = options.shorten ? applyShorten(latinSrc) : latinSrc;

  const pitch = Math.max(0.5, Math.min(2.0, options.pitch ?? 1));
  const rate = Math.max(0.4, Math.min(2.5, options.rate ?? 1));
  const charSecs = OUTPUT_LETTER_SECS / rate;

  let t = Tone.now() + 0.01;
  const start = t;

  for (const raw of processed) {
    const upper = raw.toUpperCase();
    if (upper >= "A" && upper <= "Z") {
      const idx = upper.charCodeAt(0) - "A".charCodeAt(0);
      const offsetSec = idx * LIBRARY_LETTER_SECS;
      const src = new Tone.ToneBufferSource({
        url: lib,
        playbackRate: pitch,
        fadeIn: 0,
        fadeOut: 0.008,
      }).connect(voiceGain);
      const entry = { id: myId, src };
      src.onended = () => {
        const i = activeSources.indexOf(entry);
        if (i >= 0) activeSources.splice(i, 1);
        src.dispose();
      };
      src.start(t, offsetSec, OUTPUT_LETTER_SECS);
      activeSources.push(entry);
    }
    t += charSecs;
  }

  return t - start;
}

// ---- SFX ----

function ensureSfxPlayers() {
  if (sfxPlayers.size > 0 || !sfxGain) return;
  const out = sfxGain;

  sfxPlayers.set("pour", () => {
    const filter = new Tone.Filter(900, "bandpass").connect(out);
    filter.Q.value = 1.4;
    const noise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.005, decay: 0.42, sustain: 0, release: 0.05 },
    }).connect(filter);
    noise.volume.value = -6;
    filter.frequency.rampTo(360, 0.42);
    noise.triggerAttackRelease(0.4);
    window.setTimeout(() => {
      noise.dispose();
      filter.dispose();
    }, 700);
  });

  sfxPlayers.set("complete", () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.4 },
    }).connect(out);
    synth.volume.value = -8;
    const t = Tone.now();
    ["C5", "E5", "G5", "C6"].forEach((n, i) =>
      synth.triggerAttackRelease(n, "16n", t + i * 0.07, 0.6),
    );
    window.setTimeout(() => synth.dispose(), 1300);
  });

  sfxPlayers.set("win", () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.5, sustain: 0, release: 0.6 },
    }).connect(out);
    synth.volume.value = -5;
    const t = Tone.now();
    ["C5", "E5", "G5", "C6", "E6"].forEach((n, i) =>
      synth.triggerAttackRelease(n, "8n", t + i * 0.11, 0.7),
    );
    window.setTimeout(() => synth.dispose(), 1800);
  });

  sfxPlayers.set("tap", () => {
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03 },
    }).connect(out);
    synth.volume.value = -16;
    const t = Tone.now();
    synth.frequency.setValueAtTime(880, t);
    synth.frequency.exponentialRampToValueAtTime(660, t + 0.05);
    synth.triggerAttackRelease(0.05, t);
    window.setTimeout(() => synth.dispose(), 250);
  });

  sfxPlayers.set("tier-up", () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.3 },
    }).connect(out);
    synth.volume.value = -6;
    const t = Tone.now();
    ["E5", "G5", "C6", "G6"].forEach((n, i) =>
      synth.triggerAttackRelease(n, "16n", t + i * 0.06, 0.65),
    );
    window.setTimeout(() => synth.dispose(), 1100);
  });
}

export function playSfx(name: SfxName) {
  if (!sfxGain) return;
  ensureSfxPlayers();
  sfxPlayers.get(name)?.();
}
