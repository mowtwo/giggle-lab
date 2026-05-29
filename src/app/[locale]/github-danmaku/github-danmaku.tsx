"use client";

import { Button, Card, Cursor, Icon } from "animal-island-ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

type DanmakuUser = {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
};

type DanmakuMessage = {
  id: string;
  clientId: string;
  kind: "text";
  text: string;
  createdAt: string;
  day: string;
  user: DanmakuUser;
  status: "confirmed" | "pending" | "failed";
  schemaVersion: 1;
  extensions?: Record<string, unknown>;
};

type DanmakuStyle = {
  color: string;
  size: "small" | "medium" | "large";
  speed: "slow" | "normal" | "fast";
};

type StageMessage = DanmakuMessage & {
  lane: number;
  delay: number;
};

type SessionInfo = {
  user: DanmakuUser | null;
  config: {
    repo: string;
    missing: { auth: boolean; write: boolean };
    syncIntervalSeconds: number;
  };
};

const syncIntervalMs = 5 * 60 * 1000;
const playbackWindowMinutes = 120;
const laneCount = 8;
const styleColors = ["#ffffff", "#ffe66d", "#19c8b9", "#ff7ca8", "#8ee36a", "#b692ff"];
const sizeClass = {
  small: "text-sm sm:text-base",
  medium: "text-base sm:text-xl",
  large: "text-xl sm:text-3xl",
};
const speedDuration = {
  slow: "18s",
  normal: "12s",
  fast: "7s",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localDay(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function minuteOfDay(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function timeLabel(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function messageMinute(message: DanmakuMessage) {
  return minuteOfDay(new Date(message.createdAt));
}

function messageSecondOfDay(message: DanmakuMessage) {
  const date = new Date(message.createdAt);
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function pendingKey(day: string) {
  return `giggle-danmaku-pending:${day}`;
}

function readPending(day: string) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(pendingKey(day)) ?? "[]") as DanmakuMessage[];
  } catch {
    return [];
  }
}

function writePending(day: string, messages: DanmakuMessage[]) {
  localStorage.setItem(
    pendingKey(day),
    JSON.stringify(messages.filter((message) => message.status !== "confirmed")),
  );
}

function readMessageStyle(message: DanmakuMessage): DanmakuStyle {
  const style = message.extensions?.style as Partial<DanmakuStyle> | undefined;
  return {
    color: styleColors.includes(style?.color ?? "") ? style!.color! : "#ffffff",
    size:
      style?.size === "small" || style?.size === "large" ? style.size : "medium",
    speed:
      style?.speed === "slow" || style?.speed === "fast" ? style.speed : "normal",
  };
}

function stageColors(minutes: number) {
  const hour = minutes / 60;
  if (hour < 5) {
    return {
      sky: "linear-gradient(180deg, #070b24 0%, #182a55 52%, #3c315f 100%)",
      sun: "#d8e7ff",
      sunTop: "16%",
      sunLeft: "78%",
      glow: "rgba(160, 190, 255, 0.22)",
      ground: "linear-gradient(180deg, rgba(28,44,65,0.2), rgba(8,35,39,0.72))",
    };
  }
  if (hour < 8) {
    return {
      sky: "linear-gradient(180deg, #7467b8 0%, #ff9a76 58%, #ffe3a3 100%)",
      sun: "#ffd56b",
      sunTop: "58%",
      sunLeft: "18%",
      glow: "rgba(255, 191, 92, 0.42)",
      ground: "linear-gradient(180deg, rgba(255,225,173,0.1), rgba(79,143,95,0.58))",
    };
  }
  if (hour < 17) {
    return {
      sky: "linear-gradient(180deg, #71c8ff 0%, #b9f1e7 62%, #fff4b8 100%)",
      sun: "#fff176",
      sunTop: "13%",
      sunLeft: "70%",
      glow: "rgba(255, 241, 118, 0.5)",
      ground: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(79,169,112,0.5))",
    };
  }
  if (hour < 20) {
    return {
      sky: "linear-gradient(180deg, #4256a8 0%, #ff8b6b 54%, #ffd18f 100%)",
      sun: "#ffb24f",
      sunTop: "62%",
      sunLeft: "82%",
      glow: "rgba(255, 139, 107, 0.46)",
      ground: "linear-gradient(180deg, rgba(255,181,104,0.08), rgba(63,107,92,0.62))",
    };
  }
  return {
    sky: "linear-gradient(180deg, #091231 0%, #192f5c 58%, #493763 100%)",
    sun: "#d8e7ff",
    sunTop: "18%",
    sunLeft: "76%",
    glow: "rgba(169, 194, 255, 0.26)",
    ground: "linear-gradient(180deg, rgba(34,42,76,0.2), rgba(7,36,44,0.72))",
  };
}

export function GithubDanmaku() {
  const t = useTranslations("GithubDanmaku");
  const tCommon = useTranslations("Common");
  const { navigate } = useAppNavigation();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<DanmakuMessage[]>([]);
  const [text, setText] = useState("");
  const [messageStyle, setMessageStyle] = useState<DanmakuStyle>({
    color: "#ffffff",
    size: "medium",
    speed: "normal",
  });
  const [day, setDay] = useState(() => localDay());
  const [cursorMinute, setCursorMinute] = useState(() => minuteOfDay());
  const [followNow, setFollowNow] = useState(true);
  const [status, setStatus] = useState(t("booting"));
  const [lastSync, setLastSync] = useState<string | null>(null);
  const syncTimer = useRef<number | null>(null);

  const visibleMessages = useMemo(
    () => {
      const windowStart = Math.max(0, cursorMinute - playbackWindowMinutes);
      const windowSeconds = Math.max(1, (cursorMinute - windowStart) * 60);
      return messages
        .filter((message) => {
          const minute = messageMinute(message);
          return (
            message.day === day &&
            minute <= cursorMinute &&
            minute >= windowStart
          );
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-120)
        .map((message, index) => {
          const secondsFromStart = Math.max(
            0,
            messageSecondOfDay(message) - windowStart * 60,
          );
          return {
            ...message,
            lane: index % laneCount,
            delay: -Math.min(0.95, secondsFromStart / windowSeconds) * 14,
          };
        });
    },
    [cursorMinute, day, messages],
  );
  const background = stageColors(cursorMinute);

  const syncMessages = useCallback(async () => {
    const response = await fetch(`/api/github-danmaku/messages?day=${day}`);
    const data = (await response.json()) as {
      messages?: DanmakuMessage[];
      missingWriteConfig?: boolean;
      error?: string;
    };
    if (!response.ok) throw new Error(data.error ?? "Sync failed");
    const remote = data.messages ?? [];
    const pending = readPending(day);
    const remoteClientIds = new Set(remote.map((message) => message.clientId));
    const stillPending = pending.filter(
      (message) => !remoteClientIds.has(message.clientId),
    );
    setMessages([...remote, ...stillPending]);
    writePending(day, stillPending);
    setLastSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setStatus(data.missingWriteConfig ? t("missingWrite") : t("synced"));
  }, [day, t]);

  useEffect(() => {
    fetch("/api/github-danmaku/me")
      .then((response) => response.json())
      .then((data: SessionInfo) => {
        setSession(data);
        setStatus(data.config.missing.auth ? t("missingAuth") : t("ready"));
      })
      .catch(() => setStatus(t("sessionFailed")));
  }, [t]);

  useEffect(() => {
    window.queueMicrotask(() => setMessages(readPending(day)));
    const initialSync = window.setTimeout(() => {
      syncMessages().catch((error) => setStatus(error.message));
    }, 0);

    if (syncTimer.current) window.clearInterval(syncTimer.current);
    syncTimer.current = window.setInterval(() => {
      syncMessages().catch((error) => setStatus(error.message));
    }, syncIntervalMs);

    return () => {
      window.clearTimeout(initialSync);
      if (syncTimer.current) window.clearInterval(syncTimer.current);
    };
  }, [day, syncMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      if (localDay(now) !== day && followNow) setDay(localDay(now));
      if (followNow) setCursorMinute(minuteOfDay(now));
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [day, followNow]);

  async function sendMessage() {
    if (!session?.user || !text.trim()) return;
    const createdAt = new Date();
    const optimistic: DanmakuMessage = {
      id: crypto.randomUUID(),
      clientId: crypto.randomUUID(),
      kind: "text",
      text: text.trim().slice(0, 140),
      createdAt: createdAt.toISOString(),
      day: localDay(createdAt),
      user: session.user,
      status: "pending",
      schemaVersion: 1,
      extensions: { style: messageStyle },
    };
    const nextMessages = [...messages, optimistic];
    setMessages(nextMessages);
    writePending(optimistic.day, [...readPending(optimistic.day), optimistic]);
    setText("");
    setStatus(t("sending"));

    try {
      const response = await fetch("/api/github-danmaku/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimistic),
      });
      const data = (await response.json()) as {
        message?: DanmakuMessage;
        error?: string;
      };
      if (!response.ok || !data.message) throw new Error(data.error ?? "Send failed");
      setMessages((current) =>
        current.map((message) =>
          message.clientId === optimistic.clientId ? data.message! : message,
        ),
      );
      writePending(
        optimistic.day,
        readPending(optimistic.day).filter(
          (message) => message.clientId !== optimistic.clientId,
        ),
      );
      setStatus(t("sent"));
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.clientId === optimistic.clientId
            ? { ...message, status: "failed" }
            : message,
        ),
      );
      const pending = readPending(optimistic.day).map((message) =>
        message.clientId === optimistic.clientId
          ? { ...message, status: "failed" as const }
          : message,
      );
      writePending(optimistic.day, pending);
      setStatus(error instanceof Error ? error.message : t("sendFailed"));
    }
  }

  return (
    <Cursor>
      <main className="min-h-svh px-4 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Button type="dashed" onClick={() => navigate("/")}>
            {tCommon("backToShelf")}
          </Button>
          <LocaleSwitch />
        </div>

        <section className="mx-auto mt-5 grid max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
          <Card color="app-teal" className="p-5">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Icon name="icon-chat" size={54} bounce />
                <div>
                  <p className="text-sm font-black text-[#087d76]">
                    {t("eyebrow")}
                  </p>
                  <h1 className="text-3xl font-black text-[#794f27]">
                    {t("title")}
                  </h1>
                </div>
              </div>
              <p className="text-sm font-bold leading-6 text-[#725d42]">
                {t("description")}
              </p>

              <div className="rounded-lg border-2 border-[#d4c9b4] bg-white/75 p-3 text-sm font-bold text-[#725d42]">
                <p>{t("syncNote")}</p>
                <p className="mt-2">
                  {t("repo")}: {session?.config.repo ?? "mowtwo/giggle-lab"}
                </p>
                <p>{lastSync ? t("lastSync", { time: lastSync }) : status}</p>
              </div>

              {session?.user ? (
                <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3">
                  <a href={session.user.htmlUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user.avatarUrl}
                      alt={session.user.login}
                      className="h-11 w-11 rounded-full border-2 border-[#794f27]"
                    />
                  </a>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#794f27]">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs font-bold text-[#8a7b66]">
                      @{session.user.login}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  type="primary"
                  disabled={session?.config.missing.auth}
                  onClick={() => {
                    window.location.href = `/api/github-danmaku/auth/start?returnTo=${encodeURIComponent(
                      window.location.pathname,
                    )}`;
                  }}
                >
                  {t("login")}
                </Button>
              )}

              <div className="grid gap-2">
                <textarea
                  value={text}
                  maxLength={140}
                  disabled={!session?.user}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={session?.user ? t("placeholder") : t("loginFirst")}
                  className="min-h-28 resize-none rounded-lg border-2 border-[#d4c9b4] bg-white p-3 text-sm font-bold text-[#473727] outline-none focus:border-[#19c8b9]"
                />
                <div className="grid gap-3 rounded-lg border-2 border-[#d4c9b4] bg-white/75 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-[#8a7b66]">
                      {t("color")}
                    </span>
                    {styleColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        className="h-7 w-7 rounded-full border-2"
                        style={{
                          background: color,
                          borderColor:
                            messageStyle.color === color ? "#794f27" : "#d4c9b4",
                        }}
                        onClick={() =>
                          setMessageStyle((current) => ({ ...current, color }))
                        }
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs font-black text-[#8a7b66]">
                      {t("fontSize")}
                      <select
                        value={messageStyle.size}
                        onChange={(event) =>
                          setMessageStyle((current) => ({
                            ...current,
                            size: event.target.value as DanmakuStyle["size"],
                          }))
                        }
                        className="rounded-md border-2 border-[#d4c9b4] bg-white px-2 py-1 text-[#473727]"
                      >
                        <option value="small">{t("small")}</option>
                        <option value="medium">{t("medium")}</option>
                        <option value="large">{t("large")}</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black text-[#8a7b66]">
                      {t("speed")}
                      <select
                        value={messageStyle.speed}
                        onChange={(event) =>
                          setMessageStyle((current) => ({
                            ...current,
                            speed: event.target.value as DanmakuStyle["speed"],
                          }))
                        }
                        className="rounded-md border-2 border-[#d4c9b4] bg-white px-2 py-1 text-[#473727]"
                      >
                        <option value="slow">{t("slow")}</option>
                        <option value="normal">{t("normal")}</option>
                        <option value="fast">{t("fast")}</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#8a7b66]">
                    {text.length}/140
                  </span>
                  <Button
                    type="primary"
                    disabled={!session?.user || !text.trim()}
                    onClick={sendMessage}
                  >
                    {t("send")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <section className="min-h-[70vh] rounded-xl border-4 border-[#794f27] bg-[#fffdf2] p-4 shadow-[0_4px_0_rgba(122,97,65,0.18)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#087d76]">{day}</p>
                <h2 className="text-4xl font-black text-[#794f27]">
                  {timeLabel(cursorMinute)}
                </h2>
              </div>
                  <div className="flex flex-wrap gap-2">
                <Button
                  type={followNow ? "primary" : "default"}
                  onClick={() => {
                    setFollowNow(true);
                    setDay(localDay());
                    setCursorMinute(minuteOfDay());
                  }}
                >
                  {t("followNow")}
                </Button>
                <Button type="default" onClick={() => syncMessages()}>
                  {t("syncNow")}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm font-black text-[#8a7b66]">
              {t("playbackWindow", { minutes: playbackWindowMinutes })}
            </p>

            <div className="mt-5">
              <input
                type="range"
                min={0}
                max={1439}
                value={cursorMinute}
                onChange={(event) => {
                  setFollowNow(false);
                  setCursorMinute(Number(event.target.value));
                }}
                className="w-full accent-[#19c8b9]"
              />
              <div className="mt-1 flex justify-between text-xs font-black text-[#8a7b66]">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>

            <div
              className="relative mt-6 h-[56vh] overflow-hidden rounded-lg transition-colors duration-1000"
              style={{ background: background.sky }}
            >
              <div
                className="absolute h-24 w-24 rounded-full blur-sm transition-all duration-1000"
                style={{
                  top: background.sunTop,
                  left: background.sunLeft,
                  background: background.sun,
                  boxShadow: `0 0 70px 30px ${background.glow}`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: background.ground }} />
              <div className="absolute left-[8%] top-[18%] h-2 w-2 animate-pulse rounded-full bg-white/80" />
              <div className="absolute left-[24%] top-[28%] h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
              <div className="absolute left-[86%] top-[34%] h-1.5 w-1.5 animate-pulse rounded-full bg-white/75" />
              <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/25" />
              {visibleMessages.length === 0 ? (
                <p className="grid h-full place-items-center px-6 text-center text-lg font-black text-[#8a7b66]">
                  {t("empty")}
                </p>
              ) : null}
              {visibleMessages.map((message: StageMessage) => {
                const style = readMessageStyle(message);
                return (
                  <div
                    key={message.clientId}
                    className={`github-danmaku-bullet absolute flex w-max max-w-[92%] items-center gap-2 rounded-full border-2 border-white/45 bg-black/38 px-3 py-2 font-black text-white shadow-[0_2px_0_rgba(0,0,0,0.18)] backdrop-blur-sm ${sizeClass[style.size]}`}
                    style={{
                      top: `${6 + message.lane * 11}%`,
                      color: style.color,
                      animationDuration: speedDuration[style.speed],
                      animationDelay: `${message.delay}s`,
                      opacity: message.status === "failed" ? 0.55 : 1,
                      textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                    }}
                  >
                    <a href={message.user.htmlUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={message.user.avatarUrl}
                        alt={message.user.login}
                        className="h-7 w-7 rounded-full"
                      />
                    </a>
                    <span className="min-w-0 truncate font-black">
                      {message.text}
                    </span>
                    {message.status !== "confirmed" ? (
                      <span className="text-xs font-black text-[#b16a00]">
                        {message.status}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </Cursor>
  );
}
