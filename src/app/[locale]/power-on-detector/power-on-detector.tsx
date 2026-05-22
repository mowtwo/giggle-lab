"use client";

import {
  Button,
  Card,
  Cursor,
  Divider,
  Footer,
  Icon,
  Modal,
} from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { AnimaleseText } from "@/components/animalese-text";
import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";
import { detectDevice, type DeviceInfo } from "./device-detection";

type Phase = "checking" | "surprise" | "result";

const TYPEWRITER_SPEED_MS = 55;
const MIN_CHECKING_MS = 3300;
const SURPRISE_HOLD_MS = 1500;
const TYPEWRITER_BUFFER_MS = 700;
const TYPEWRITER_CPS = Math.round(1000 / TYPEWRITER_SPEED_MS); // 18

function getReadingDuration(text: string) {
  return Math.max(
    MIN_CHECKING_MS,
    text.length * TYPEWRITER_SPEED_MS + TYPEWRITER_BUFFER_MS,
  );
}

function CloseButton({
  open,
  onClose,
  label,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPos(null);
      return;
    }
    let modalEl: Element | null = null;
    let ro: ResizeObserver | null = null;
    let frame = 0;

    const update = () => {
      if (!modalEl) return;
      const r = modalEl.getBoundingClientRect();
      setPos({ left: r.right - 14, top: r.top - 14 });
    };

    const tryFind = () => {
      const candidates = document.querySelectorAll(
        '[class*="animal-modal"]:not([class*="modalClipped"]):not([class*="animal-mask"])',
      );
      const el = candidates[0];
      if (el && el !== modalEl) {
        modalEl = el;
        ro?.disconnect();
        ro = new ResizeObserver(update);
        ro.observe(el);
        update();
      }
      if (!modalEl) {
        frame = window.requestAnimationFrame(tryFind);
      }
    };
    tryFind();

    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [open]);

  if (!open || !pos || typeof document === "undefined") return null;
  return createPortal(
    <button
      type="button"
      data-no-animalese
      aria-label={label}
      title={label}
      onClick={onClose}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 1100,
      }}
      className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#b99b72] bg-white text-[#7a6141] shadow-[0_3px_0_rgba(122,97,65,0.2)] transition active:translate-y-[1px] hover:border-[#794f27]"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M6 6 L18 18 M18 6 L6 18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </button>,
    document.body,
  );
}

export function PowerOnDetector() {
  const { navigate } = useAppNavigation();
  const tCommon = useTranslations("Common");
  const tPowerOn = useTranslations("PowerOn");
  const tDevices = useTranslations("Devices");
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const deviceName = tDevices(device?.key ?? "device");
  const checkingMessage = tPowerOn("checking", { device: deviceName });
  const resultMessage = tPowerOn("result", { device: deviceName });
  const surpriseMessage = tPowerOn("surprise");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDevice(detectDevice());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const checkingDuration = getReadingDuration(checkingMessage);
    const surpriseTimer = window.setTimeout(() => {
      setPhase((prev) => (prev === "checking" ? "surprise" : prev));
    }, checkingDuration);
    const resultTimer = window.setTimeout(() => {
      setPhase((prev) => (prev === "surprise" ? "result" : prev));
    }, checkingDuration + SURPRISE_HOLD_MS);

    return () => {
      window.clearTimeout(surpriseTimer);
      window.clearTimeout(resultTimer);
    };
  }, [checkingMessage, open]);

  function startDetection() {
    setPhase("checking");
    setOpen(true);
  }

  const advance = useCallback(() => {
    setPhase((prev) => {
      if (prev === "checking") return "surprise";
      if (prev === "surprise") return "result";
      // Already on result — close on click
      setOpen(false);
      return prev;
    });
  }, []);

  return (
    <Cursor>
      <main className="min-h-svh px-5 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Button type="default" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <section className="mx-auto grid min-h-[calc(100svh-144px)] max-w-5xl place-items-center py-10">
          <Card
            type="title"
            color="app-yellow"
            className="grid w-full max-w-2xl justify-items-center gap-7 p-8 text-center sm:p-12"
          >
            <Icon name="icon-diy" size={96} bounce />

            <div className="space-y-4">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#19c8b9]">
                Power-on detector
              </p>
              <h1 className="text-balance text-4xl font-black leading-tight text-[#794f27] sm:text-6xl">
                {tPowerOn("title", { device: deviceName })}
              </h1>
              <p className="mx-auto max-w-xl text-base font-bold leading-7 text-[#725d42] sm:text-lg">
                {tPowerOn("description")}
              </p>
            </div>

            <Divider type="wave-yellow" />

            <Button type="primary" size="large" onClick={startDetection}>
              {tPowerOn("start")}
            </Button>
          </Card>
        </section>

        <Footer type="tree" />

        <CloseButton
          open={open}
          onClose={() => setOpen(false)}
          label={tCommon("close")}
        />

        <Modal
          open={open}
          title={tPowerOn("modalTitle", { device: deviceName })}
          width="min(520px, calc(100vw - 32px))"
          footer={null}
          typewriter={false}
          maskClosable={false}
          onClose={() => setOpen(false)}
        >
          <div
            data-no-animalese
            onClick={advance}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                advance();
              }
            }}
            className="-m-4 cursor-pointer rounded-2xl p-4 transition active:translate-y-[1px]"
          >
            {phase === "checking" ? (
              <AnimaleseText
                key="checking"
                as="p"
                text={checkingMessage}
                cps={TYPEWRITER_CPS}
                className="block text-xl font-black leading-9 text-[#725d42]"
              />
            ) : null}
            {phase === "surprise" ? (
              <AnimaleseText
                key="surprise"
                as="p"
                text={surpriseMessage}
                cps={8}
                className="block py-6 text-center text-7xl font-black leading-none text-[#fc736d]"
              />
            ) : null}
            {phase === "result" ? (
              <AnimaleseText
                key="result"
                as="p"
                text={resultMessage}
                cps={TYPEWRITER_CPS}
                className="block text-2xl font-black leading-10 text-[#725d42]"
              />
            ) : null}
          </div>
        </Modal>
      </main>
    </Cursor>
  );
}
