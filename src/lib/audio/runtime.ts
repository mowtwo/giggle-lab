"use client";

import * as Tone from "tone";

import type { AnimaleseOptions, SfxName } from "./state";

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

export async function unlock() {
  if (!initialized) {
    initialized = true;
    masterGain = new Tone.Gain(1).toDestination();
    musicGain = new Tone.Gain(0.42).connect(masterGain);
    voiceGain = new Tone.Gain(0.8).connect(masterGain);
    sfxGain = new Tone.Gain(0.9).connect(masterGain);
  }
  await Tone.start();
}

export function setMasterMute(muted: boolean) {
  if (!masterGain) return;
  masterGain.gain.cancelScheduledValues(Tone.now());
  masterGain.gain.rampTo(muted ? 0 : 1, 0.18);
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

function getAnimaleseSynth() {
  if (!animaleseSynth && voiceGain) {
    animaleseSynth = new Tone.MonoSynth({
      oscillator: { type: "square" },
      filter: { Q: 3.6, type: "bandpass", frequency: 1100 },
      envelope: { attack: 0.005, decay: 0.04, sustain: 0, release: 0.02 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.04,
        sustain: 0,
        release: 0.04,
        baseFrequency: 700,
        octaves: 2,
      },
    }).connect(voiceGain);
    animaleseSynth.volume.value = -10;
  }
  return animaleseSynth;
}

const PUNCT_RE = /[.,!?;:。，！？；：、…—–]/;

export function playAnimalese(text: string, options: AnimaleseOptions): number {
  const synth = getAnimaleseSynth();
  if (!synth) return 0;
  const pitch = options.pitch ?? 1;
  const rate = options.rate ?? 1;
  const velocity = options.volume ?? 0.55;
  const charSeconds = 0.078 / rate;
  let t = Tone.now() + 0.01;
  const start = t;

  for (const ch of text) {
    if (/\s/.test(ch)) {
      t += charSeconds * 1.4;
      continue;
    }
    if (PUNCT_RE.test(ch)) {
      synth.triggerAttackRelease(160 * pitch, charSeconds * 0.7, t, 0.4);
      t += charSeconds * 2.2;
      continue;
    }
    const code = ch.charCodeAt(0);
    const isLatin = /[a-zA-Z]/.test(ch);
    const isCJK = code >= 0x4e00 && code <= 0x9fff;
    const isDigit = /[0-9]/.test(ch);
    if (!isLatin && !isCJK && !isDigit) {
      t += charSeconds * 0.3;
      continue;
    }
    const freq = (220 + (code % 28) * 14) * pitch;
    synth.triggerAttackRelease(freq, charSeconds * 0.7, t, velocity);
    t += charSeconds;
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
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
    }).connect(out);
    synth.volume.value = -12;
    synth.triggerAttackRelease(820, 0.04);
    window.setTimeout(() => synth.dispose(), 200);
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
