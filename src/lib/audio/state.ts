"use client";

import type * as Runtime from "./runtime";

export type SfxName = "pour" | "complete" | "win" | "tap" | "tier-up";

export type AnimaleseOptions = {
  pitch?: number;
  rate?: number;
  volume?: number;
};

type State = {
  enabled: boolean;
  unlocked: boolean;
  bgmRequested: boolean;
  runtime: typeof Runtime | null;
  runtimePromise: Promise<typeof Runtime> | null;
  listeners: Set<(enabled: boolean) => void>;
};

const state: State = {
  enabled: true,
  unlocked: false,
  bgmRequested: false,
  runtime: null,
  runtimePromise: null,
  listeners: new Set(),
};

function loadRuntime(): Promise<typeof Runtime> {
  if (state.runtime) return Promise.resolve(state.runtime);
  if (!state.runtimePromise) {
    state.runtimePromise = import(
      /* webpackChunkName: "audio-runtime" */ "./runtime"
    ).then((mod) => {
      state.runtime = mod;
      mod.setMasterMute(!state.enabled);
      return mod;
    });
  }
  return state.runtimePromise;
}

function notify() {
  for (const listener of state.listeners) listener(state.enabled);
}

export function isAudioEnabled() {
  return state.enabled;
}

export function isAudioUnlocked() {
  return state.unlocked;
}

export function subscribeAudio(listener: (enabled: boolean) => void) {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

export function initAudioEnabled(value: boolean) {
  state.enabled = value;
  notify();
  if (state.runtime) state.runtime.setMasterMute(!value);
}

export async function setAudioEnabled(next: boolean) {
  if (state.enabled === next) return;
  state.enabled = next;
  notify();
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
  return rt.playAnimalese(text, options);
}
