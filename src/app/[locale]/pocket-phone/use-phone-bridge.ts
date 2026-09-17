"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  APP_STORAGE_PREFIX,
  type PhoneAction,
  type PhoneDialog,
  type PhoneState,
} from "./phone-state";
import {
  BRIDGE_TAG,
  PHONE_BRIDGE_VERSION,
  SDK_ERROR,
  type HostMessage,
  type SdkContext,
  type SdkEventName,
  type SdkEvents,
  type SdkPermissionKind,
  type SdkPermissionState,
  type SdkSafeArea,
  type SdkThemeInfo,
  isGuestMessage,
} from "./protocol";
import { getApp, PHONE_APPS } from "./registry";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./themes/tokens";
import type { PhoneTheme } from "./themes/types";

type FrameRecord = { window: Window; trusted: boolean };

type DialogTicket = {
  dialog: PhoneDialog;
  resolve: (index: number) => void;
};

export type PhoneBridge = {
  /** AppWindow 在 iframe load 之后调用;返回注销函数。 */
  registerFrame: (appId: string, frame: Window, trusted: boolean) => () => void;
  emit: <K extends SdkEventName>(appId: string, name: K, payload: SdkEvents[K]) => void;
  emitAll: <K extends SdkEventName>(name: K, payload: SdkEvents[K]) => void;
  /** 系统弹窗被用户点掉时调用,index = -1 表示取消。 */
  answerDialog: (index: number) => void;
  buildThemeInfo: () => SdkThemeInfo;
};

const PERMISSION_LABELS: SdkPermissionKind[] = [
  "camera",
  "microphone",
  "location",
  "contacts",
  "notification",
  "storage",
];

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function usePhoneBridge(options: {
  state: PhoneState;
  dispatch: (action: PhoneAction) => void;
  theme: PhoneTheme;
  locale: string;
  safeArea: SdkSafeArea;
  appName: (appId: string) => string;
  permissionPrompt: (kind: SdkPermissionKind, appName: string, reason?: string) => {
    title: string;
    message: string;
    allow: string;
    deny: string;
  };
}): PhoneBridge {
  const { dispatch, appName, permissionPrompt } = options;

  // 消息处理器要读到最新状态,但不能因为状态变化就重装 listener。
  // postMessage 的处理是异步的,提交之后再同步这份快照就够。
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const framesRef = useRef(new Map<string, FrameRecord>());
  const dialogQueueRef = useRef<DialogTicket[]>([]);
  const timersRef = useRef(new Set<number>());

  const buildThemeInfo = useCallback((): SdkThemeInfo => {
    const { theme, state } = latest.current;
    const palette = theme.palette[state.scheme];
    return {
      id: theme.id,
      label: theme.label,
      scheme: state.scheme,
      accent: palette.accent,
      surface: palette.surface,
      surfaceElevated: palette.surfaceElevated,
      text: palette.textPrimary,
      textSecondary: palette.textSecondary,
      separator: palette.separator,
      radius: theme.surfaces.tile.radius,
      fontFamily: theme.typography.ui,
      easing: theme.motion.easing,
    };
  }, []);

  const post = useCallback((appId: string, message: HostMessage) => {
    const record = framesRef.current.get(appId);
    if (!record) {
      return;
    }
    // 沙箱 iframe 的 origin 是 "null",没法指定具体 targetOrigin。
    const targetOrigin = record.trusted ? window.location.origin : "*";
    try {
      record.window.postMessage(message, targetOrigin);
    } catch {
      // iframe 已经被卸载。
    }
  }, []);

  const emit = useCallback<PhoneBridge["emit"]>(
    (appId, name, payload) => {
      post(appId, {
        tag: BRIDGE_TAG,
        v: PHONE_BRIDGE_VERSION,
        kind: "event",
        name,
        payload,
      });
    },
    [post],
  );

  const emitAll = useCallback<PhoneBridge["emitAll"]>(
    (name, payload) => {
      for (const appId of framesRef.current.keys()) {
        emit(appId, name, payload);
      }
    },
    [emit],
  );

  const buildContext = useCallback(
    (appId: string): SdkContext => {
      const { state, locale, safeArea, theme } = latest.current;
      const entry = getApp(appId);
      return {
        bridgeVersion: PHONE_BRIDGE_VERSION,
        appId,
        locale,
        theme: buildThemeInfo(),
        safeArea,
        screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        device: {
          model: theme.label,
          os: theme.label,
          osVersion: `${PHONE_BRIDGE_VERSION}.0`,
          battery: state.battery,
          charging: state.charging,
          navMode: state.navMode,
        },
        trusted: entry?.trusted === true,
      };
    },
    [buildThemeInfo],
  );

  /** 把队首弹窗推到 UI 上。 */
  const flushDialogs = useCallback(() => {
    const head = dialogQueueRef.current[0];
    if (head) {
      dispatch({ type: "openDialog", dialog: head.dialog });
    } else {
      dispatch({ type: "closeDialog" });
    }
  }, [dispatch]);

  const answerDialog = useCallback<PhoneBridge["answerDialog"]>(
    (index) => {
      const ticket = dialogQueueRef.current.shift();
      ticket?.resolve(index);
      flushDialogs();
    },
    [flushDialogs],
  );

  const enqueueDialog = useCallback(
    (dialog: PhoneDialog) =>
      new Promise<number>((resolve) => {
        dialogQueueRef.current.push({ dialog, resolve });
        if (dialogQueueRef.current.length === 1) {
          dispatch({ type: "openDialog", dialog });
        }
      }),
    [dispatch],
  );

  const storageKey = (appId: string, key: string) =>
    `${APP_STORAGE_PREFIX}${appId}:${key}`;

  const invoke = useCallback(
    async (appId: string, method: string, rawParams: unknown): Promise<unknown> => {
      const params = (rawParams ?? {}) as Record<string, unknown>;
      const { state } = latest.current;

      switch (method) {
        case "system.getContext":
          return buildContext(appId);

        case "system.setStatusBar": {
          dispatch({
            type: "setStatusBar",
            appId,
            patch: {
              ...(typeof params.style === "string"
                ? { style: params.style as "light" | "dark" | "auto" }
                : {}),
              ...(typeof params.hidden === "boolean" ? { hidden: params.hidden } : {}),
              ...("title" in params
                ? { title: typeof params.title === "string" ? params.title : null }
                : {}),
            },
          });
          return undefined;
        }

        case "system.setBackHandler":
          dispatch({ type: "setBackHandler", appId, enabled: params.enabled === true });
          return undefined;

        case "system.keepAwake":
          // 纯模拟:锁屏本来就得手动按电源键,这里只是让 API 表面完整。
          return undefined;

        case "ui.toast": {
          const text = String(params.text ?? "").slice(0, 120);
          if (!text) {
            throw badParams("text is required");
          }
          const duration = clampNumber(params.duration, 600, 6000, 1800);
          dispatch({
            type: "pushToast",
            toast: {
              id: randomId("toast"),
              text,
              icon: isToastIcon(params.icon) ? params.icon : "none",
              until: Date.now() + duration,
            },
          });
          return undefined;
        }

        case "ui.haptic": {
          const pattern = String(params.pattern ?? "light");
          const strength =
            pattern === "heavy" || pattern === "error"
              ? "heavy"
              : pattern === "medium" || pattern === "warning" || pattern === "success"
                ? "medium"
                : "light";
          dispatch({ type: "haptic", strength });
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(strength === "heavy" ? 40 : strength === "medium" ? 22 : 10);
          }
          return undefined;
        }

        case "ui.dialog": {
          const title = String(params.title ?? "").slice(0, 80);
          if (!title) {
            throw badParams("title is required");
          }
          const buttons = Array.isArray(params.buttons)
            ? params.buttons.slice(0, 3).map((item) => String(item).slice(0, 24))
            : ["OK"];
          const index = await enqueueDialog({
            id: randomId("dialog"),
            appId,
            kind: "alert",
            title,
            message:
              typeof params.message === "string" ? params.message.slice(0, 400) : undefined,
            buttons: buttons.length > 0 ? buttons : ["OK"],
            destructiveIndex:
              typeof params.destructiveIndex === "number" ? params.destructiveIndex : undefined,
            cancelable: params.cancelable !== false,
          });
          return { index };
        }

        case "ui.getPermission": {
          const kind = asPermissionKind(params.kind);
          return { state: state.permissions[`${appId}:${kind}`] ?? "prompt" };
        }

        case "ui.requestPermission": {
          const kind = asPermissionKind(params.kind);
          const existing = state.permissions[`${appId}:${kind}`];
          if (existing === "granted" || existing === "denied") {
            return { state: existing };
          }
          const copy = permissionPrompt(
            kind,
            appName(appId),
            typeof params.reason === "string" ? params.reason.slice(0, 160) : undefined,
          );
          const index = await enqueueDialog({
            id: randomId("perm"),
            appId,
            kind: "permission",
            permission: kind,
            title: copy.title,
            message: copy.message,
            buttons: [copy.deny, copy.allow],
            cancelable: true,
          });
          const nextState: SdkPermissionState = index === 1 ? "granted" : "denied";
          dispatch({ type: "setPermission", appId, kind, state: nextState });
          return { state: nextState };
        }

        case "nav.exit":
          dispatch({ type: "goHome" });
          return undefined;

        case "nav.recents":
          dispatch({ type: "showRecents" });
          return undefined;

        case "nav.openApp": {
          const target = String(params.appId ?? "");
          if (!getApp(target)) {
            throw new BridgeError(SDK_ERROR.notFound, `no such app: ${target}`);
          }
          dispatch({ type: "openApp", appId: target });
          return undefined;
        }

        case "notify.post": {
          const title = String(params.title ?? "").slice(0, 60);
          if (!title) {
            throw badParams("title is required");
          }
          const id = randomId("note");
          const notification = {
            id,
            appId,
            title,
            body: String(params.body ?? "").slice(0, 200),
            tag: typeof params.tag === "string" ? params.tag.slice(0, 40) : undefined,
            at: Date.now(),
          };
          const delay = clampNumber(params.delay, 0, 30000, 0);
          if (delay > 0) {
            const timer = window.setTimeout(() => {
              timersRef.current.delete(timer);
              dispatch({ type: "pushNotification", notification: { ...notification, at: Date.now() } });
            }, delay);
            timersRef.current.add(timer);
          } else {
            dispatch({ type: "pushNotification", notification });
          }
          return { id };
        }

        case "notify.clear":
          dispatch({
            type: "clearNotifications",
            appId,
            tag: typeof params.tag === "string" ? params.tag : undefined,
          });
          return undefined;

        case "notify.setBadge":
          dispatch({
            type: "setBadge",
            appId,
            count: clampNumber(params.count, 0, 999, 0),
          });
          return undefined;

        case "storage.get": {
          const key = requireKey(params.key);
          return { value: window.localStorage.getItem(storageKey(appId, key)) };
        }

        case "storage.set": {
          const key = requireKey(params.key);
          const value = String(params.value ?? "");
          if (value.length > 20000) {
            throw new BridgeError(SDK_ERROR.quota, "value too large (20KB max)");
          }
          try {
            window.localStorage.setItem(storageKey(appId, key), value);
          } catch {
            throw new BridgeError(SDK_ERROR.quota, "localStorage write failed");
          }
          return undefined;
        }

        case "storage.remove": {
          const key = requireKey(params.key);
          window.localStorage.removeItem(storageKey(appId, key));
          return undefined;
        }

        case "storage.keys": {
          const prefix = `${APP_STORAGE_PREFIX}${appId}:`;
          const keys: string[] = [];
          for (let i = 0; i < window.localStorage.length; i += 1) {
            const full = window.localStorage.key(i);
            if (full?.startsWith(prefix)) {
              keys.push(full.slice(prefix.length));
            }
          }
          return { keys };
        }

        case "apps.list":
          return {
            apps: PHONE_APPS.map((app) => ({
              id: app.id,
              name: appName(app.id),
              canOpen: app.id !== appId,
            })),
          };

        default:
          throw new BridgeError(SDK_ERROR.unknownMethod, `unknown method: ${method}`);
      }
    },
    [appName, buildContext, dispatch, enqueueDialog, permissionPrompt],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isGuestMessage(event.data)) {
        return;
      }
      // 只认 source window:沙箱 App 的 origin 是 "null",origin 不能当凭据。
      let appId: string | null = null;
      for (const [id, record] of framesRef.current) {
        if (record.window === event.source) {
          appId = id;
          break;
        }
      }
      if (!appId) {
        return;
      }

      const message = event.data;
      if (message.kind === "hello") {
        post(appId, {
          tag: BRIDGE_TAG,
          v: PHONE_BRIDGE_VERSION,
          kind: "ready",
          context: buildContext(appId),
        });
        return;
      }

      const { id, method, params } = message;
      void invoke(appId, method, params)
        .then((data) => {
          post(appId as string, {
            tag: BRIDGE_TAG,
            v: PHONE_BRIDGE_VERSION,
            kind: "reply",
            id,
            ok: true,
            data: data ?? null,
          });
        })
        .catch((error: unknown) => {
          const bridgeError =
            error instanceof BridgeError
              ? error
              : new BridgeError(SDK_ERROR.badParams, String(error));
          post(appId as string, {
            tag: BRIDGE_TAG,
            v: PHONE_BRIDGE_VERSION,
            kind: "reply",
            id,
            ok: false,
            error: { code: bridgeError.code, message: bridgeError.message },
          });
        });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [buildContext, invoke, post]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const registerFrame = useCallback<PhoneBridge["registerFrame"]>(
    (appId, frame, trusted) => {
      framesRef.current.set(appId, { window: frame, trusted });
      return () => {
        const current = framesRef.current.get(appId);
        if (current?.window === frame) {
          framesRef.current.delete(appId);
        }
        // App 卸载时,它排队里的弹窗一并作废。
        const remaining = dialogQueueRef.current.filter((ticket) => {
          if (ticket.dialog.appId !== appId) {
            return true;
          }
          ticket.resolve(-1);
          return false;
        });
        if (remaining.length !== dialogQueueRef.current.length) {
          dialogQueueRef.current = remaining;
          flushDialogs();
        }
      };
    },
    [flushDialogs],
  );

  return useMemo(
    () => ({ registerFrame, emit, emitAll, answerDialog, buildThemeInfo }),
    [registerFrame, emit, emitAll, answerDialog, buildThemeInfo],
  );
}

class BridgeError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "BridgeError";
  }
}

function badParams(message: string) {
  return new BridgeError(SDK_ERROR.badParams, message);
}

function requireKey(value: unknown): string {
  const key = String(value ?? "");
  if (!key || key.length > 64) {
    throw badParams("key must be 1-64 chars");
  }
  return key;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function isToastIcon(value: unknown): value is "none" | "success" | "error" | "loading" {
  return value === "none" || value === "success" || value === "error" || value === "loading";
}

function asPermissionKind(value: unknown): SdkPermissionKind {
  const kind = String(value ?? "");
  if (!PERMISSION_LABELS.includes(kind as SdkPermissionKind)) {
    throw badParams(`unknown permission: ${kind}`);
  }
  return kind as SdkPermissionKind;
}
