"use client";

import {
  Button,
  Card,
  Cursor,
  Divider,
  Footer,
  Icon,
  Modal,
  Typewriter,
} from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";
import { detectDevice, type DeviceInfo } from "./device-detection";

type Phase = "checking" | "surprise" | "result";

const TYPEWRITER_SPEED_MS = 55;
const MIN_CHECKING_MS = 3300;
const SURPRISE_HOLD_MS = 1500;
const TYPEWRITER_BUFFER_MS = 700;

function getReadingDuration(text: string) {
  return Math.max(
    MIN_CHECKING_MS,
    text.length * TYPEWRITER_SPEED_MS + TYPEWRITER_BUFFER_MS,
  );
}

function getModalContent(
  phase: Phase,
  message: string,
  surprise: string,
): ReactNode {
  const content: Record<Phase, ReactNode> = {
    checking: (
      <p className="text-xl font-black leading-9 text-[#725d42]">
        {message}
      </p>
    ),
    surprise: (
      <p className="py-6 text-center text-7xl font-black leading-none text-[#fc736d]">
        {surprise}
      </p>
    ),
    result: (
      <p className="text-2xl font-black leading-10 text-[#725d42]">
        {message}
      </p>
    ),
  };

  return content[phase];
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
  const modalMessage =
    phase === "result"
      ? tPowerOn("result", { device: deviceName })
      : tPowerOn("checking", { device: deviceName });
  const checkingMessage = tPowerOn("checking", { device: deviceName });

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
    const surpriseTimer = window.setTimeout(
      () => setPhase("surprise"),
      checkingDuration,
    );
    const resultTimer = window.setTimeout(
      () => setPhase("result"),
      checkingDuration + SURPRISE_HOLD_MS,
    );

    return () => {
      window.clearTimeout(surpriseTimer);
      window.clearTimeout(resultTimer);
    };
  }, [checkingMessage, open]);

  function startDetection() {
    setPhase("checking");
    setOpen(true);
  }

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

        <Modal
          open={open}
          title={tPowerOn("modalTitle", { device: deviceName })}
          width="min(520px, calc(100vw - 32px))"
          footer={null}
          typewriter={false}
          onClose={() => setOpen(false)}
        >
          <Typewriter
            trigger={phase}
            speed={phase === "surprise" ? 120 : TYPEWRITER_SPEED_MS}
          >
            {getModalContent(phase, modalMessage, tPowerOn("surprise"))}
          </Typewriter>
        </Modal>
      </main>
    </Cursor>
  );
}
