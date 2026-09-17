"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { useAppNavigation } from "@/components/navigation-provider";

import { AppSwitcher } from "./components/app-switcher";
import { AppWindow } from "./components/app-window";
import { DeviceFrame } from "./components/device-frame";
import { HomeScreen } from "./components/home-screen";
import { LockScreen } from "./components/lock-screen";
import { NavBar } from "./components/nav-bar";
import { DialogLayer, ToastLayer } from "./components/overlays";
import { SettingsApp } from "./components/settings-app";
import { Shade } from "./components/shade";
import { SquircleDefs } from "./components/app-icon";
import { StatusBar } from "./components/status-bar";
import {
  createInitialState,
  DEFAULT_STATUS_BAR,
  phoneReducer,
  readPrefs,
  writePrefs,
  type QuickTileId,
} from "./phone-state";
import type { SdkPermissionKind } from "./protocol";
import { getApp, PHONE_APPS } from "./registry";
import { getTheme, PHONE_THEMES } from "./themes";
import { themeToCssVars } from "./themes/tokens";
import type { ColorScheme, NavMode, ThemeId } from "./themes/types";
import { isFlick, useSwipe } from "./use-gesture";
import { usePhoneBridge } from "./use-phone-bridge";

export function PocketPhone() {
  const t = useTranslations("PocketPhone");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { navigate } = useAppNavigation();

  const [state, dispatch] = useReducer(phoneReducer, undefined, createInitialState);
  const [now, setNow] = useState(() => new Date());

  // 偏好在客户端挂载后再补,避免 SSR 与首帧不一致。
  useEffect(() => {
    const prefs = readPrefs();
    if (Object.keys(prefs).length > 0) {
      dispatch({ type: "hydrate", patch: prefs });
    }
  }, []);

  useEffect(() => {
    writePrefs({
      themeId: state.themeId,
      scheme: state.scheme,
      wallpaperId: state.wallpaperId,
      navMode: state.navMode,
    });
  }, [state.navMode, state.scheme, state.themeId, state.wallpaperId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (state.toasts.length === 0) {
      return undefined;
    }
    const timer = window.setInterval(
      () => dispatch({ type: "expireToasts", now: Date.now() }),
      200,
    );
    return () => window.clearInterval(timer);
  }, [state.toasts.length]);

  const theme = useMemo(() => getTheme(state.themeId), [state.themeId]);
  const cssVars = useMemo(
    () => themeToCssVars(theme, state.scheme),
    [state.scheme, theme],
  );

  const appName = useCallback(
    (appId: string) => {
      const entry = getApp(appId);
      return entry ? t(`apps.${entry.nameKey}`) : appId;
    },
    [t],
  );

  const wallpaper = useMemo(() => {
    const found =
      theme.wallpapers.find((item) => item.id === state.wallpaperId) ?? theme.wallpapers[0];
    return found[state.scheme];
  }, [state.scheme, state.wallpaperId, theme.wallpapers]);

  const navHeight = theme.navigation.height[state.navMode === "gesture" ? "gesture" : "buttons"];
  const statusOverride =
    (state.foreground ? state.statusBar[state.foreground] : undefined) ?? DEFAULT_STATUS_BAR;
  const statusHidden = state.view === "app" && statusOverride.hidden;

  const safeArea = useMemo(
    () => ({
      top: statusHidden ? 0 : theme.statusBar.height,
      right: 0,
      bottom: navHeight,
      left: 0,
    }),
    [navHeight, statusHidden, theme.statusBar.height],
  );

  const permissionPrompt = useCallback(
    (kind: SdkPermissionKind, name: string, reason?: string) => ({
      title: t("permissionPrompt.title", { app: name, permission: t(`permissions.${kind}`) }),
      message: reason ?? t("permissionPrompt.message"),
      allow: t("permissionPrompt.allow"),
      deny: t("permissionPrompt.deny"),
    }),
    [t],
  );

  const bridge = usePhoneBridge({
    state,
    dispatch,
    theme,
    locale,
    safeArea,
    appName,
    permissionPrompt,
  });

  /* ---------------------------------------------------- 系统事件广播 */

  const { emitAll, emit } = bridge;

  useEffect(() => {
    emitAll("theme.change", bridge.buildThemeInfo());
  }, [bridge, emitAll, state.scheme, state.themeId]);

  useEffect(() => {
    emitAll("safearea.change", safeArea);
  }, [emitAll, safeArea]);

  const previousForeground = useRef<string | null>(null);
  useEffect(() => {
    const current = state.view === "app" ? state.foreground : null;
    const previous = previousForeground.current;
    if (previous === current) {
      return;
    }
    if (previous) {
      emit(previous, "pause", {
        reason: state.locked ? "lock" : state.view === "recents" ? "recents" : "home",
      });
    }
    if (current) {
      emit(current, "resume", undefined);
    }
    previousForeground.current = current;
  }, [emit, state.foreground, state.locked, state.view]);

  /* ---------------------------------------------------- 导航 */

  const handleBack = useCallback(() => {
    if (state.shade !== "closed" || state.view !== "app" || !state.foreground) {
      dispatch({ type: "back" });
      return;
    }
    // App 自己声明要接管返回键时,只发事件不退出。
    if (state.backHandlers[state.foreground]) {
      emit(state.foreground, "back", undefined);
      return;
    }
    dispatch({ type: "back" });
  }, [emit, state.backHandlers, state.foreground, state.shade, state.view]);

  const handleHome = useCallback(() => dispatch({ type: "goHome" }), []);
  const handleRecents = useCallback(() => dispatch({ type: "showRecents" }), []);

  /* ---------------------------------------------------- 顶部下拉手势 */

  const pullHostRef = useRef(0);
  const pullWidthRef = useRef(1);
  const pullStripRef = useRef<HTMLDivElement>(null);

  /** 按下拉起点落在屏幕左半边还是右半边,决定拉出通知还是控制中心。 */
  const openShadeAt = useCallback(
    (x: number) => {
      if (theme.surfaces.shade === "unified") {
        dispatch({ type: "setShade", shade: "notifications" });
        return;
      }
      const ratio = (x - pullHostRef.current) / pullWidthRef.current;
      dispatch({ type: "setShade", shade: ratio < 0.5 ? "notifications" : "control" });
    },
    [theme.surfaces.shade],
  );

  const pullDown = useSwipe({
    onSwipeEnd: (delta, velocity, origin) => {
      if (isFlick(delta, velocity, "y", 40, 260) > 0) {
        openShadeAt(origin.x);
      }
    },
    // 轻点状态栏也能拉开,和真机一致。
    onTap: (point) => openShadeAt(point.x),
  });

  useEffect(() => {
    const strip = pullStripRef.current;
    if (!strip) {
      return undefined;
    }
    const measure = () => {
      const rect = strip.getBoundingClientRect();
      pullHostRef.current = rect.left;
      pullWidthRef.current = Math.max(1, rect.width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [state.themeId]);

  /* ---------------------------------------------------- 渲染 */

  // 面板拉开时状态栏压在面板上,得用面板自己的前景色,否则浅色面板上白字会消失。
  const barTint =
    state.shade !== "closed"
      ? theme.palette[state.scheme].textPrimary
      : statusOverride.style === "auto"
        ? theme.defaultBarStyle[state.scheme] === "light"
          ? "#ffffff"
          : "#1b1b1f"
        : statusOverride.style === "light"
          ? "#ffffff"
          : "#1b1b1f";

  const weekday = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long" }).format(now),
    [locale, now],
  );
  const lockDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(now),
    [locale, now],
  );

  const shadeLabels = useMemo(
    () => ({
      notifications: t("shade.notifications"),
      controlCenter: t("shade.controlCenter"),
      empty: t("shade.empty"),
      clearAll: t("shade.clearAll"),
      brightness: t("shade.brightness"),
      volume: t("shade.volume"),
      close: common("close"),
      tiles: {
        wifi: t("tiles.wifi"),
        cellular: t("tiles.cellular"),
        bluetooth: t("tiles.bluetooth"),
        airplane: t("tiles.airplane"),
        torch: t("tiles.torch"),
        rotate: t("tiles.rotate"),
      } as Record<QuickTileId, string>,
    }),
    [common, t],
  );

  const webApps = PHONE_APPS.filter((app) => app.kind === "web");
  const mountedApps = webApps.filter((app) => state.stack.includes(app.id));

  return (
    // h-svh + overflow-hidden:机身靠 DeviceFrame 等比缩放塞进剩余空间,页面本身不滚。
    // overscroll-none 挡掉移动端的橡皮筋回弹。
    <main className="flex h-svh flex-col overflow-hidden overscroll-none bg-[#101318] text-[#e9edf2]">
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[13px] transition-colors hover:bg-white/16 sm:px-3 sm:text-sm"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path
              d="M10 3 5 8l5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {common("backToShelf")}
        </button>

        <h1 className="shrink-0 text-[13px] font-semibold tracking-wide sm:text-sm">
          {t("title")}
        </h1>

        {/* 窄屏时这一组整体换到第二行,主题条自己横向滚动。 */}
        <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full bg-white/8 p-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-none [&::-webkit-scrollbar]:hidden">
            {PHONE_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => dispatch({ type: "setTheme", themeId: item.id })}
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors"
                style={{
                  background: item.id === state.themeId ? "#ffffff" : "transparent",
                  color: item.id === state.themeId ? "#101318" : "rgba(233,237,242,0.72)",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <LocaleSwitch />
        </div>
      </header>

      <div className="min-h-0 flex-1 px-2 pb-2 sm:px-4 sm:pb-3">
        <DeviceFrame
          theme={theme}
          hapticPulse={state.hapticPulse}
          hapticStrength={state.hapticStrength}
          brightness={state.brightness}
        >
          <div
            className="relative flex h-full w-full flex-col"
            style={{
              ...cssVars,
              // 只写 background 简写:再补一个 backgroundSize 会和它冲突,
              // React 每次重渲染都会警告(而且渐变本来就铺满)。
              background: wallpaper,
              fontFamily: "var(--ph-font-ui)",
            }}
          >
            <SquircleDefs />

            {!statusHidden && (
              <StatusBar
                theme={theme}
                tint={barTint}
                now={now}
                battery={state.battery}
                charging={state.charging}
                wifi={state.tiles.wifi}
                cellular={state.tiles.cellular}
                airplane={state.tiles.airplane}
                title={state.view === "app" ? statusOverride.title : null}
              />
            )}

            {/* 顶部下拉热区:指针拖拽和触控板双指下滑都能拉开面板。 */}
            <div
              ref={pullStripRef}
              {...pullDown}
              className="absolute inset-x-0 top-0 z-[46]"
              style={{
                height: Math.max(theme.statusBar.height, 40),
                pointerEvents: state.locked || state.shade !== "closed" ? "none" : "auto",
                touchAction: "none",
              }}
              aria-hidden="true"
            />

            {/* 锁屏时只留壁纸,桌面和应用都不该透出来。 */}
            <div
              className="relative min-h-0 flex-1"
              style={{ visibility: state.locked ? "hidden" : "visible" }}
            >
              <div
                className="absolute inset-0"
                style={{ display: state.view === "home" ? "block" : "none" }}
              >
                <HomeScreen
                  theme={theme}
                  scheme={state.scheme}
                  now={now}
                  badges={state.badges}
                  page={state.homePage}
                  appName={appName}
                  weekdayLabel={weekday}
                  widgetHint={t("home.widgetHint")}
                  onSetPage={(page) => dispatch({ type: "setHomePage", page })}
                  onOpen={(appId) => dispatch({ type: "openApp", appId })}
                />
              </div>

              {mountedApps.map((app) => (
                <AppWindow
                  key={app.id}
                  app={app}
                  theme={theme}
                  bridge={bridge}
                  visible={state.view === "app" && state.foreground === app.id}
                  loadingLabel={t("appLoading")}
                />
              ))}

              {state.foreground === "settings" && (
                <div
                  className="absolute inset-0"
                  style={{
                    display: state.view === "app" ? "block" : "none",
                    animation: `pocket-phone-launch-${
                      theme.motion.launch === "zoom-from-icon"
                        ? "zoom"
                        : theme.motion.launch === "scale-fade"
                          ? "scale"
                          : theme.motion.launch === "fold-up"
                            ? "fold"
                            : "bounce"
                    } var(--ph-duration-launch) var(--ph-easing) both`,
                  }}
                >
                  <SettingsApp
                    theme={theme}
                    state={state}
                    appName={appName}
                    onSetTheme={(themeId: ThemeId) => dispatch({ type: "setTheme", themeId })}
                    onSetScheme={(scheme: ColorScheme) => dispatch({ type: "setScheme", scheme })}
                    onSetWallpaper={(wallpaperId) =>
                      dispatch({ type: "setWallpaper", wallpaperId })
                    }
                    onSetNavMode={(navMode: NavMode) => dispatch({ type: "setNavMode", navMode })}
                    onRevokePermission={(appId, kind) =>
                      dispatch({ type: "setPermission", appId, kind, state: "prompt" })
                    }
                  />
                </div>
              )}

              {state.view === "recents" && (
                <AppSwitcher
                  theme={theme}
                  stack={state.stack}
                  appName={appName}
                  labels={{
                    title: t("recents.title"),
                    empty: t("recents.empty"),
                    closeAll: t("recents.closeAll"),
                    hint: t("recents.hint"),
                  }}
                  onResume={(appId) => dispatch({ type: "openApp", appId })}
                  onKill={(appId) => dispatch({ type: "closeApp", appId })}
                  onKillAll={() => {
                    for (const appId of state.stack) {
                      dispatch({ type: "closeApp", appId });
                    }
                    dispatch({ type: "goHome" });
                  }}
                />
              )}
            </div>

            <NavBar
              theme={theme}
              mode={state.locked ? "gesture" : state.navMode}
              tint={barTint}
              labels={{
                back: t("nav.back"),
                home: t("nav.home"),
                recents: t("nav.recents"),
              }}
              onBack={handleBack}
              onHome={handleHome}
              onRecents={handleRecents}
            />

            <Shade
              theme={theme}
              mode={state.shade}
              notifications={state.notifications}
              tiles={state.tiles}
              brightness={state.brightness}
              volume={state.volume}
              labels={shadeLabels}
              appName={appName}
              onClose={() => dispatch({ type: "setShade", shade: "closed" })}
              onToggleTile={(tile) => dispatch({ type: "toggleTile", tile })}
              onBrightness={(value) => dispatch({ type: "setBrightness", value })}
              onVolume={(value) => dispatch({ type: "setVolume", value })}
              onDismiss={(id) => dispatch({ type: "dismissNotification", id })}
              onClearAll={() => dispatch({ type: "clearNotifications" })}
              onOpenApp={(appId) => dispatch({ type: "openApp", appId })}
            />

            <ToastLayer theme={theme} toasts={state.toasts} />

            {state.dialog && (
              <DialogLayer
                theme={theme}
                dialog={state.dialog}
                appName={appName(state.dialog.appId)}
                onAnswer={bridge.answerDialog}
              />
            )}

            {state.locked && (
              <LockScreen
                theme={theme}
                now={now}
                notifications={state.notifications}
                appName={appName}
                labels={{
                  unlock: t("lock.unlock"),
                  dateFormat: lockDate,
                  notifications: t("lock.notifications"),
                }}
                onUnlock={() => dispatch({ type: "unlock" })}
              />
            )}
          </div>
        </DeviceFrame>
      </div>

      <footer className="shrink-0 px-14 pb-3 text-center text-[11px] leading-relaxed text-white/45 sm:px-4 sm:pb-4">
        {/* 触控板那句在手机上是噪音,窄屏换成触屏版提示。 */}
        <span className="hidden sm:inline">{t("hint")}</span>
        <span className="sm:hidden">{t("hintTouch")}</span>
      </footer>
    </main>
  );
}
