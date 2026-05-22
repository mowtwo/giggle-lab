"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  initAudioState,
  playAnimalese,
  playSfx,
  requestBgm,
  setAudioEnabled,
  setVoicePitch as setVoicePitchCore,
  setVoiceRate as setVoiceRateCore,
  setVoiceShorten as setVoiceShortenCore,
  setVolume as setVolumeCore,
  subscribeAudio,
  subscribeVoice,
  subscribeVolumes,
  unlockAudio,
  type AudioBus,
  type VoiceConfig,
  type Volumes,
} from "./state";

type AudioControls = {
  enabled: boolean;
  mounted: boolean;
  introSeen: boolean;
  volumes: Volumes;
  voice: VoiceConfig;
  toggle: () => void;
  setVolume: (bus: AudioBus, value: number) => void;
  setVoicePitch: (value: number) => void;
  setVoiceRate: (value: number) => void;
  setVoiceShorten: (value: boolean) => void;
  dismissIntro: () => void;
};

const AudioContext = createContext<AudioControls>({
  enabled: true,
  mounted: false,
  introSeen: true,
  volumes: { music: 0.55, sfx: 0.7, voice: 0.7 },
  voice: { pitch: 1.0, rate: 1.15, shorten: false },
  toggle: () => {},
  setVolume: () => {},
  setVoicePitch: () => {},
  setVoiceRate: () => {},
  setVoiceShorten: () => {},
  dismissIntro: () => {},
});

const STORE_ENABLED = "audio.enabled";
const STORE_INTRO = "audio.intro.dismissed";
const STORE_VOLUME_PREFIX = "audio.volume.";
const STORE_VOICE_PITCH = "audio.voice.pitch";
const STORE_VOICE_RATE = "audio.voice.rate";
const STORE_VOICE_SHORTEN = "audio.voice.shorten";

const READABLE_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "BLOCKQUOTE",
  "SUMMARY",
  "FIGCAPTION",
  "DT",
  "DD",
]);

function findReadable(target: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = target;
  while (el && el !== document.body) {
    if (READABLE_TAGS.has(el.tagName) || el.hasAttribute("data-animalese")) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

function readVolumes(): Volumes {
  const defaults: Volumes = { music: 0.55, sfx: 0.7, voice: 0.7 };
  for (const bus of ["music", "sfx", "voice"] as AudioBus[]) {
    const stored = window.localStorage.getItem(STORE_VOLUME_PREFIX + bus);
    if (stored !== null) {
      const num = Number.parseFloat(stored);
      if (!Number.isNaN(num)) defaults[bus] = Math.max(0, Math.min(1, num));
    }
  }
  return defaults;
}

function readVoice(): VoiceConfig {
  const defaults: VoiceConfig = { pitch: 1.0, rate: 1.15, shorten: false };
  const pitch = window.localStorage.getItem(STORE_VOICE_PITCH);
  if (pitch !== null) {
    const num = Number.parseFloat(pitch);
    if (!Number.isNaN(num)) defaults.pitch = Math.max(0.5, Math.min(2.0, num));
  }
  const rate = window.localStorage.getItem(STORE_VOICE_RATE);
  if (rate !== null) {
    const num = Number.parseFloat(rate);
    if (!Number.isNaN(num)) defaults.rate = Math.max(0.5, Math.min(2.5, num));
  }
  const shorten = window.localStorage.getItem(STORE_VOICE_SHORTEN);
  if (shorten !== null) defaults.shorten = shorten === "1";
  return defaults;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [introSeen, setIntroSeen] = useState(true);
  const [volumes, setVolumesState] = useState<Volumes>({
    music: 0.55,
    sfx: 0.7,
    voice: 0.7,
  });
  const [voice, setVoiceState] = useState<VoiceConfig>({
    pitch: 1.0,
    rate: 1.15,
    shorten: false,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORE_ENABLED);
    const initial = stored === null ? true : stored === "1";
    const seenIntro = window.localStorage.getItem(STORE_INTRO) === "1";
    const initialVolumes = readVolumes();
    const initialVoice = readVoice();
    initAudioState({
      enabled: initial,
      volumes: initialVolumes,
      voice: initialVoice,
    });
    /* eslint-disable react-hooks/set-state-in-effect */
    setEnabled(initial);
    setIntroSeen(seenIntro);
    setVolumesState(initialVolumes);
    setVoiceState(initialVoice);
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const offEnabled = subscribeAudio(setEnabled);
    const offVolumes = subscribeVolumes((next) =>
      setVolumesState({ ...next }),
    );
    const offVoice = subscribeVoice((next) => setVoiceState({ ...next }));
    if (initial) void requestBgm(true);
    return () => {
      offEnabled();
      offVolumes();
      offVoice();
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => {
      void unlockAudio();
    };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-no-sfx]")) return;
      const interactive = target.closest(
        'button:not([disabled]), a[href], input[type="button"], input[type="submit"], [role="button"]',
      );
      if (interactive) {
        void playSfx("tap");
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-no-animalese]")) return;
      if (
        target.closest(
          'button, a[href], input, textarea, select, label, [role="button"], [contenteditable]',
        )
      ) {
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;
      const el = findReadable(target);
      if (!el) return;
      const text = (el.textContent || "").trim();
      if (text.length < 2 || text.length > 160) return;
      void playAnimalese(text, { pitch: 0.95 });
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      window.removeEventListener("click", onClick);
    };
  }, [mounted]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      void setAudioEnabled(next);
      return next;
    });
  }, []);

  const setVolume = useCallback((bus: AudioBus, value: number) => {
    setVolumesState((prev) => ({ ...prev, [bus]: value }));
    void setVolumeCore(bus, value);
  }, []);

  const setVoicePitch = useCallback((value: number) => {
    setVoiceState((prev) => ({ ...prev, pitch: value }));
    setVoicePitchCore(value);
  }, []);

  const setVoiceRate = useCallback((value: number) => {
    setVoiceState((prev) => ({ ...prev, rate: value }));
    setVoiceRateCore(value);
  }, []);

  const setVoiceShorten = useCallback((value: boolean) => {
    setVoiceState((prev) => ({ ...prev, shorten: value }));
    setVoiceShortenCore(value);
  }, []);

  const dismissIntro = useCallback(() => {
    window.localStorage.setItem(STORE_INTRO, "1");
    setIntroSeen(true);
    void unlockAudio();
  }, []);

  return (
    <AudioContext.Provider
      value={{
        enabled,
        mounted,
        introSeen,
        volumes,
        voice,
        toggle,
        setVolume,
        setVoicePitch,
        setVoiceRate,
        setVoiceShorten,
        dismissIntro,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
