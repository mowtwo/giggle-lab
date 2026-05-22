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

let animaleseSynth: Tone.MonoSynth | null = null;
const sfxPlayers = new Map<SfxName, () => void>();

type PinyinModule = typeof import("pinyin-pro");
let pinyinLoader: Promise<PinyinModule> | null = null;
async function getPinyin(): Promise<PinyinModule> {
  if (!pinyinLoader) {
    pinyinLoader = import(
      /* webpackChunkName: "pinyin" */ "pinyin-pro"
    );
  }
  return pinyinLoader;
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

function freshAnimaleseSynth() {
  if (animaleseSynth) {
    animaleseSynth.dispose();
    animaleseSynth = null;
  }
  if (!voiceGain) return null;
  animaleseSynth = new Tone.MonoSynth({
    oscillator: { type: "square" },
    filter: { Q: 3.2, type: "bandpass", frequency: 1100 },
    envelope: { attack: 0.005, decay: 0.045, sustain: 0, release: 0.025 },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.05,
      sustain: 0,
      release: 0.04,
      baseFrequency: 700,
      octaves: 2,
    },
  }).connect(voiceGain);
  animaleseSynth.volume.value = -10;
  return animaleseSynth;
}

const PUNCT_RE = /[.,!?;:。，！？；：、…—–·]/;
const VOWEL_RE = /[aeiouäöü]/i;

async function expandPinyin(text: string): Promise<string> {
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

export async function playAnimalese(
  text: string,
  options: AnimaleseOptions,
): Promise<number> {
  const synth = freshAnimaleseSynth();
  if (!synth) return 0;
  const source = await expandPinyin(text);

  const pitch = options.pitch ?? 1;
  const rate = options.rate ?? 1;
  const velocity = options.volume ?? 0.55;
  const baseCharSec = 0.082 / rate;
  let t = Tone.now() + 0.01;
  const start = t;
  let prev = "";

  for (const raw of source) {
    if (/\s/.test(raw)) {
      t += baseCharSec * 1.6;
      prev = "";
      continue;
    }
    if (PUNCT_RE.test(raw)) {
      synth.triggerAttackRelease(150 * pitch, baseCharSec * 0.7, t, 0.42);
      t += baseCharSec * 2.4;
      prev = "";
      continue;
    }
    const ch = raw.toLowerCase();
    if (!/[a-z0-9]/.test(ch)) {
      t += baseCharSec * 0.35;
      continue;
    }
    if (ch === prev) {
      // animalese trick: skip a doubled letter, just extend the pause
      t += baseCharSec * 0.55;
      continue;
    }
    prev = ch;
    const code = ch.charCodeAt(0);
    const isVowel = VOWEL_RE.test(ch);
    const jitter = (((code * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.08;
    const freq = (isVowel ? 230 : 320) * (pitch + jitter) + (code % 16) * 9;
    const dur = isVowel ? baseCharSec * 0.78 : baseCharSec * 0.52;
    const vel = velocity * (isVowel ? 1 : 0.78);
    synth.triggerAttackRelease(freq, dur, t, vel);
    t += isVowel ? baseCharSec * 0.95 : baseCharSec * 0.7;
  }

  return t - start;
}

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
