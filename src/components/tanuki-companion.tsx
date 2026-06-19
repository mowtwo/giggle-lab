"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAudio } from "@/lib/audio/provider";
import { subscribeVoiceActivity } from "@/lib/audio/state";
import { TanukiAvatar, type TanukiAvatarVariant } from "./tanuki-avatar";

const STAY_MS = 10_000;
const BYE_HOLD_MS = 1_500;

export function TanukiCompanion() {
  const pathname = usePathname();
  const { mounted, enabled } = useAudio();
  const [variant, setVariant] = useState<TanukiAvatarVariant>("talk");
  const [visible, setVisible] = useState(false);
  const idleTimerRef = useRef<number | null>(null);
  const byeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mounted) return;

    const clearTimers = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (byeTimerRef.current !== null) {
        window.clearTimeout(byeTimerRef.current);
        byeTimerRef.current = null;
      }
    };

    const scheduleGoodbye = () => {
      clearTimers();
      idleTimerRef.current = window.setTimeout(() => {
        setVariant("bye");
        byeTimerRef.current = window.setTimeout(() => {
          setVisible(false);
        }, BYE_HOLD_MS);
      }, STAY_MS);
    };

    const unsubscribe = subscribeVoiceActivity(() => {
      setVisible(true);
      setVariant("talk");
      scheduleGoodbye();
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [mounted]);

  // If audio gets globally disabled mid-stay, hide immediately
  useEffect(() => {
    if (!enabled && visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
    }
  }, [enabled, visible]);

  if (!mounted || pathname.includes("/adou-duel")) {
    return null;
  }

  return (
    <div
      data-no-animalese
      data-no-sfx
      className="pointer-events-none fixed bottom-3 left-3 z-30"
      aria-hidden="true"
    >
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="tanuki"
            initial={{ opacity: 0, y: 24, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.78 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <TanukiAvatar variant={variant} size={130} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
