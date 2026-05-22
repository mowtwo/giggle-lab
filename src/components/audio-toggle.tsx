"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { useAudio } from "@/lib/audio/provider";

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

export function AudioToggle() {
  const t = useTranslations("Audio");
  const { enabled, mounted, introSeen, toggle, dismissIntro } = useAudio();
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex items-end gap-3">
      <AnimatePresence>
        {!introSeen ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="pointer-events-auto max-w-[280px] rounded-2xl border-2 border-[#b99b72] bg-[#fffaf0] p-4 shadow-[0_8px_0_rgba(122,97,65,0.18)]"
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
        onClick={toggle}
        aria-label={enabled ? t("muteLabel") : t("unmuteLabel")}
        title={enabled ? t("muteLabel") : t("unmuteLabel")}
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
