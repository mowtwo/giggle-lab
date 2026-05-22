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
  initAudioEnabled,
  requestBgm,
  setAudioEnabled,
  subscribeAudio,
  unlockAudio,
} from "./state";

type AudioControls = {
  enabled: boolean;
  mounted: boolean;
  introSeen: boolean;
  toggle: () => void;
  dismissIntro: () => void;
};

const AudioContext = createContext<AudioControls>({
  enabled: true,
  mounted: false,
  introSeen: true,
  toggle: () => {},
  dismissIntro: () => {},
});

const STORE_ENABLED = "audio.enabled";
const STORE_INTRO = "audio.intro.dismissed";

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [introSeen, setIntroSeen] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORE_ENABLED);
    const initial = stored === null ? true : stored === "1";
    const seenIntro =
      window.localStorage.getItem(STORE_INTRO) === "1";
    initAudioEnabled(initial);
    /* eslint-disable react-hooks/set-state-in-effect */
    setEnabled(initial);
    setIntroSeen(seenIntro);
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const off = subscribeAudio(setEnabled);
    if (initial) void requestBgm(true);
    return off;
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

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      void setAudioEnabled(next);
      return next;
    });
  }, []);

  const dismissIntro = useCallback(() => {
    window.localStorage.setItem(STORE_INTRO, "1");
    setIntroSeen(true);
    void unlockAudio();
  }, []);

  return (
    <AudioContext.Provider
      value={{ enabled, mounted, introSeen, toggle, dismissIntro }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
