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
  setVolume as setVolumeCore,
  subscribeAudio,
  subscribeVolumes,
  unlockAudio,
  type AudioBus,
  type Volumes,
} from "./state";

type AudioControls = {
  enabled: boolean;
  mounted: boolean;
  introSeen: boolean;
  volumes: Volumes;
  toggle: () => void;
  setVolume: (bus: AudioBus, value: number) => void;
  dismissIntro: () => void;
};

const AudioContext = createContext<AudioControls>({
  enabled: true,
  mounted: false,
  introSeen: true,
  volumes: { music: 0.55, sfx: 0.7, voice: 0.7 },
  toggle: () => {},
  setVolume: () => {},
  dismissIntro: () => {},
});

const STORE_ENABLED = "audio.enabled";
const STORE_INTRO = "audio.intro.dismissed";
const STORE_VOLUME_PREFIX = "audio.volume.";

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

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [introSeen, setIntroSeen] = useState(true);
  const [volumes, setVolumesState] = useState<Volumes>({
    music: 0.55,
    sfx: 0.7,
    voice: 0.7,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORE_ENABLED);
    const initial = stored === null ? true : stored === "1";
    const seenIntro = window.localStorage.getItem(STORE_INTRO) === "1";
    const initialVolumes = readVolumes();
    initAudioState({ enabled: initial, volumes: initialVolumes });
    /* eslint-disable react-hooks/set-state-in-effect */
    setEnabled(initial);
    setIntroSeen(seenIntro);
    setVolumesState(initialVolumes);
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const offEnabled = subscribeAudio(setEnabled);
    const offVolumes = subscribeVolumes((next) =>
      setVolumesState({ ...next }),
    );
    if (initial) void requestBgm(true);
    return () => {
      offEnabled();
      offVolumes();
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
      void playAnimalese(text, { pitch: 0.92, rate: 0.78 });
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
        toggle,
        setVolume,
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
