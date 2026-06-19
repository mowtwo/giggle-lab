"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAudio } from "@/lib/audio/provider";
import type { AudioBus } from "@/lib/audio/state";

const SPEAKER_ON = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M4 9v6h4l5 4V5L8 9H4Zm12 3a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16 12Zm-2-7v2.34a6 6 0 0 1 0 9.32V19a8 8 0 0 0 0-14Z"
      fill="currentColor"
    />
  </svg>
);

const SPEAKER_OFF = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M4 9v6h4l5 4V5L8 9H4Zm15.3 1.71L17.59 9 16 10.59 14.41 9 13 10.41 14.59 12 13 13.59 14.41 15 16 13.41 17.59 15 19 13.59 17.41 12Z"
      fill="currentColor"
    />
  </svg>
);

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const percent = Math.round(value * 100);
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
        <span>{label}</span>
        <span className="tabular-nums">{percent}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) / 100)}
        className="block w-full accent-[#19c8b9]"
      />
    </label>
  );
}

function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
        <span>{label}</span>
        <span className="tabular-nums">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min * 100}
        max={max * 100}
        step={step * 100}
        value={value * 100}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) / 100)}
        className="block w-full accent-[#ec4899]"
      />
    </label>
  );
}

export function AudioToggle() {
  const t = useTranslations("Audio");
  const pathname = usePathname();
  const {
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
  } = useAudio();
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("mousedown", onDocClick);
    return () => window.removeEventListener("mousedown", onDocClick);
  }, [panelOpen]);

  if (!mounted || pathname.includes("/adou-duel")) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-no-sfx
      data-no-animalese
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3"
    >
      <AnimatePresence>
        {panelOpen ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="pointer-events-auto w-[260px] rounded-2xl border-2 border-[#b99b72] bg-[#fffaf0] p-4 shadow-[0_8px_0_rgba(122,97,65,0.18)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[#794f27]">
                {t("settingsTitle")}
              </p>
              <button
                type="button"
                onClick={toggle}
                className={`rounded-lg border-2 px-3 py-1 text-xs font-black transition active:translate-y-[1px] ${
                  enabled
                    ? "border-[#19c8b9] bg-[#dcfbf7] text-[#00766d]"
                    : "border-[#d4c9b4] bg-white text-[#7a6141]"
                }`}
              >
                {enabled ? t("on") : t("off")}
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <VolumeSlider
                label={t("musicLabel")}
                value={volumes.music}
                onChange={(v) => setVolume("music" as AudioBus, v)}
              />
              <VolumeSlider
                label={t("sfxLabel")}
                value={volumes.sfx}
                onChange={(v) => setVolume("sfx" as AudioBus, v)}
              />
              <VolumeSlider
                label={t("voiceLabel")}
                value={volumes.voice}
                onChange={(v) => setVolume("voice" as AudioBus, v)}
              />
            </div>
            <div className="mt-4 space-y-3 border-t-2 border-dashed border-[#e3d6b8] pt-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#a3206a]">
                {t("voiceSection")}
              </p>
              <RangeSlider
                label={t("voicePitch")}
                value={voice.pitch}
                min={0.5}
                max={2.0}
                step={0.05}
                format={(v) => `${v.toFixed(2)}x`}
                onChange={setVoicePitch}
              />
              <RangeSlider
                label={t("voiceRate")}
                value={voice.rate}
                min={0.5}
                max={2.5}
                step={0.05}
                format={(v) => `${v.toFixed(2)}x`}
                onChange={setVoiceRate}
              />
              <label className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7a6141]">
                  {t("voiceShorten")}
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceShorten(!voice.shorten)}
                  className={`rounded-lg border-2 px-2.5 py-1 text-[10px] font-black transition active:translate-y-[1px] ${
                    voice.shorten
                      ? "border-[#ec4899] bg-[#fdf2f8] text-[#a3206a]"
                      : "border-[#d4c9b4] bg-white text-[#7a6141]"
                  }`}
                >
                  {voice.shorten ? t("on") : t("off")}
                </button>
              </label>
            </div>
            <span className="pointer-events-none absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#b99b72] bg-[#fffaf0]" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!introSeen && !panelOpen ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="pointer-events-auto relative max-w-[280px] rounded-2xl border-2 border-[#b99b72] bg-[#fffaf0] p-4 shadow-[0_8px_0_rgba(122,97,65,0.18)]"
          >
            <p className="text-sm font-black leading-snug text-[#794f27]">
              {t("introTitle")}
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-[#7a6141]">
              {t("introBody")}
            </p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  toggle();
                  dismissIntro();
                }}
                className="rounded-lg border-2 border-[#d4c9b4] bg-white px-3 py-1.5 text-xs font-black text-[#7a6141] transition active:translate-y-[1px]"
              >
                {t("turnOff")}
              </button>
              <button
                type="button"
                onClick={dismissIntro}
                className="rounded-lg border-2 border-[#19c8b9] bg-[#dcfbf7] px-3 py-1.5 text-xs font-black text-[#00766d] shadow-[0_2px_0_rgba(25,200,185,0.4)] transition active:translate-y-[1px]"
              >
                {t("gotIt")}
              </button>
            </div>
            <span className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#b99b72] bg-[#fffaf0]" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          if (!introSeen) {
            dismissIntro();
            return;
          }
          setPanelOpen((v) => !v);
        }}
        aria-label={t("openPanel")}
        title={t("openPanel")}
        className={`pointer-events-auto grid h-11 w-11 place-items-center rounded-full border-2 transition active:translate-y-[1px] ${
          enabled
            ? "border-[#19c8b9] bg-white text-[#00766d] shadow-[0_3px_0_rgba(25,200,185,0.45)]"
            : "border-[#d4c9b4] bg-white/90 text-[#a3927a] shadow-[0_3px_0_rgba(122,97,65,0.18)]"
        }`}
      >
        {enabled ? SPEAKER_ON : SPEAKER_OFF}
      </button>
    </div>
  );
}
