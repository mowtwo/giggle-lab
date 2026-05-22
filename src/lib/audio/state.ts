"use client";

import type * as Runtime from "./runtime";

export type SfxName = "pour" | "complete" | "win" | "tap" | "tier-up";
export type AudioBus = "music" | "sfx" | "voice";

export type AnimaleseOptions = {
  pitch?: number;
  rate?: number;
  volume?: number;
  shorten?: boolean;
};

export type Volumes = Record<AudioBus, number>;

export type VoiceConfig = {
  pitch: number;
  rate: number;
  shorten: boolean;
};

type State = {
  enabled: boolean;
  unlocked: boolean;
  bgmRequested: boolean;
  volumes: Volumes;
  voice: VoiceConfig;
  runtime: typeof Runtime | null;
  runtimePromise: Promise<typeof Runtime> | null;
  listeners: Set<(enabled: boolean) => void>;
  volumeListeners: Set<(volumes: Volumes) => void>;
  voiceListeners: Set<(voice: VoiceConfig) => void>;
};

const DEFAULT_VOLUMES: Volumes = { music: 0.55, sfx: 0.7, voice: 0.7 };
const DEFAULT_VOICE: VoiceConfig = { pitch: 1.0, rate: 1.15, shorten: false };

const state: State = {
  enabled: true,
  unlocked: false,
  bgmRequested: false,
  volumes: { ...DEFAULT_VOLUMES },
  voice: { ...DEFAULT_VOICE },
  runtime: null,
  runtimePromise: null,
  listeners: new Set(),
  volumeListeners: new Set(),
  voiceListeners: new Set(),
};

function loadRuntime(): Promise<typeof Runtime> {
  if (state.runtime) return Promise.resolve(state.runtime);
  if (!state.runtimePromise) {
    state.runtimePromise = import(
      /* webpackChunkName: "audio-runtime" */ "./runtime"
    ).then((mod) => {
      state.runtime = mod;
      mod.setMasterMute(!state.enabled);
      mod.setVolume("music", state.volumes.music);
      mod.setVolume("sfx", state.volumes.sfx);
      mod.setVolume("voice", state.volumes.voice);
      return mod;
    });
  }
  return state.runtimePromise;
}

function notifyEnabled() {
  for (const listener of state.listeners) listener(state.enabled);
}

function notifyVolumes() {
  for (const listener of state.volumeListeners) listener({ ...state.volumes });
}

function notifyVoice() {
  for (const listener of state.voiceListeners) listener({ ...state.voice });
}

export function isAudioEnabled() {
  return state.enabled;
}

export function isAudioUnlocked() {
  return state.unlocked;
}

export function getVolumes(): Volumes {
  return { ...state.volumes };
}

export function getVoiceConfig(): VoiceConfig {
  return { ...state.voice };
}

export function subscribeAudio(listener: (enabled: boolean) => void) {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

export function subscribeVolumes(listener: (volumes: Volumes) => void) {
  state.volumeListeners.add(listener);
  return () => {
    state.volumeListeners.delete(listener);
  };
}

export function subscribeVoice(listener: (voice: VoiceConfig) => void) {
  state.voiceListeners.add(listener);
  return () => {
    state.voiceListeners.delete(listener);
  };
}

export function initAudioState(opts: {
  enabled: boolean;
  volumes?: Partial<Volumes>;
  voice?: Partial<VoiceConfig>;
}) {
  state.enabled = opts.enabled;
  if (opts.volumes) state.volumes = { ...state.volumes, ...opts.volumes };
  if (opts.voice) state.voice = { ...state.voice, ...opts.voice };
  notifyEnabled();
  notifyVolumes();
  notifyVoice();
  if (state.runtime) {
    state.runtime.setMasterMute(!state.enabled);
    state.runtime.setVolume("music", state.volumes.music);
    state.runtime.setVolume("sfx", state.volumes.sfx);
    state.runtime.setVolume("voice", state.volumes.voice);
  }
}

export function setVoicePitch(value: number) {
  const clamped = Math.max(0.5, Math.min(2.0, value));
  if (state.voice.pitch === clamped) return;
  state.voice.pitch = clamped;
  notifyVoice();
  if (typeof window !== "undefined") {
    window.localStorage.setItem("audio.voice.pitch", String(clamped));
  }
}

export function setVoiceRate(value: number) {
  const clamped = Math.max(0.5, Math.min(2.5, value));
  if (state.voice.rate === clamped) return;
  state.voice.rate = clamped;
  notifyVoice();
  if (typeof window !== "undefined") {
    window.localStorage.setItem("audio.voice.rate", String(clamped));
  }
}

export function setVoiceShorten(value: boolean) {
  if (state.voice.shorten === value) return;
  state.voice.shorten = value;
  notifyVoice();
  if (typeof window !== "undefined") {
    window.localStorage.setItem("audio.voice.shorten", value ? "1" : "0");
  }
}

export function getVoicePitch() {
  return state.voice.pitch;
}

export function getVoiceRate() {
  return state.voice.rate;
}

export function getVoiceShorten() {
  return state.voice.shorten;
}

export async function setAudioEnabled(next: boolean) {
  if (state.enabled === next) return;
  state.enabled = next;
  notifyEnabled();
  if (typeof window !== "undefined") {
    window.localStorage.setItem("audio.enabled", next ? "1" : "0");
  }
  if (state.runtime) {
    state.runtime.setMasterMute(!next);
    if (next && state.bgmRequested && state.unlocked) state.runtime.startBgm();
    else if (!next) state.runtime.stopBgm();
  } else if (next && state.bgmRequested) {
    const rt = await loadRuntime();
    if (state.enabled && state.unlocked) rt.startBgm();
  }
}

export async function setVolume(bus: AudioBus, value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  if (state.volumes[bus] === clamped) return;
  state.volumes[bus] = clamped;
  notifyVolumes();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(`audio.volume.${bus}`, String(clamped));
  }
  const rt = state.runtime ?? (state.unlocked ? await loadRuntime() : null);
  rt?.setVolume(bus, clamped);
}

export async function unlockAudio() {
  if (state.unlocked) {
    if (state.enabled && state.bgmRequested && state.runtime) {
      state.runtime.startBgm();
    }
    return;
  }
  state.unlocked = true;
  const rt = await loadRuntime();
  await rt.unlock();
  if (state.enabled && state.bgmRequested) rt.startBgm();
}

export async function requestBgm(playing: boolean) {
  state.bgmRequested = playing;
  if (!state.enabled || !state.unlocked) return;
  const rt = state.runtime ?? (await loadRuntime());
  if (playing) rt.startBgm();
  else rt.stopBgm();
}

export async function playSfx(name: SfxName) {
  if (!state.enabled) return;
  if (!state.unlocked) return;
  const rt = state.runtime ?? (await loadRuntime());
  rt.playSfx(name);
}

export async function playAnimalese(
  text: string,
  options: AnimaleseOptions = {},
): Promise<number> {
  if (!state.enabled || !text) return 0;
  if (!state.unlocked) return 0;
  const rt = state.runtime ?? (await loadRuntime());
  const merged: AnimaleseOptions = {
    ...options,
    pitch: (options.pitch ?? 1) * state.voice.pitch,
    rate: (options.rate ?? 1) * state.voice.rate,
    shorten: options.shorten ?? state.voice.shorten,
  };
  return rt.playAnimalese(text, merged);
}
