import { DEFAULT_THEME_ID, getTheme, isThemeId } from "./themes";
import type { ColorScheme, NavMode, ThemeId } from "./themes/types";
import type { SdkPermissionKind, SdkPermissionState } from "./protocol";

export type PhoneView = "home" | "app" | "recents";

export type PhoneNotification = {
  id: string;
  appId: string;
  title: string;
  body: string;
  tag?: string;
  at: number;
};

export type PhoneToast = {
  id: string;
  text: string;
  icon: "none" | "success" | "error" | "loading";
  until: number;
};

export type PhoneDialog = {
  id: string;
  appId: string;
  kind: "alert" | "permission";
  title: string;
  message?: string;
  buttons: string[];
  destructiveIndex?: number;
  cancelable: boolean;
  /** kind === "permission" 时带上申请的权限种类。 */
  permission?: SdkPermissionKind;
};

export type StatusBarOverride = {
  style: "light" | "dark" | "auto";
  hidden: boolean;
  title: string | null;
};

export type QuickTileId = "wifi" | "cellular" | "bluetooth" | "airplane" | "torch" | "rotate";

export type PhoneState = {
  themeId: ThemeId;
  scheme: ColorScheme;
  wallpaperId: string;
  navMode: NavMode;
  locked: boolean;
  view: PhoneView;
  homePage: number;
  /** 最近任务:队首是最近用过的。 */
  stack: string[];
  foreground: string | null;
  shade: "closed" | "notifications" | "control";
  notifications: PhoneNotification[];
  toasts: PhoneToast[];
  dialog: PhoneDialog | null;
  /** key = `${appId}:${kind}` */
  permissions: Record<string, SdkPermissionState>;
  badges: Record<string, number>;
  statusBar: Record<string, StatusBarOverride>;
  backHandlers: Record<string, boolean>;
  tiles: Record<QuickTileId, boolean>;
  brightness: number;
  volume: number;
  battery: number;
  charging: boolean;
  /** 自增计数器,每次 +1 触发一次机身震动动画。 */
  hapticPulse: number;
  hapticStrength: "light" | "medium" | "heavy";
};

export type PhoneAction =
  | { type: "setTheme"; themeId: ThemeId }
  | { type: "setScheme"; scheme: ColorScheme }
  | { type: "setWallpaper"; wallpaperId: string }
  | { type: "setNavMode"; navMode: NavMode }
  | { type: "lock" }
  | { type: "unlock" }
  | { type: "goHome" }
  | { type: "setHomePage"; page: number }
  | { type: "openApp"; appId: string }
  | { type: "closeApp"; appId: string }
  | { type: "showRecents" }
  | { type: "back" }
  | { type: "setShade"; shade: PhoneState["shade"] }
  | { type: "toggleTile"; tile: QuickTileId }
  | { type: "setBrightness"; value: number }
  | { type: "setVolume"; value: number }
  | { type: "pushToast"; toast: PhoneToast }
  | { type: "expireToasts"; now: number }
  | { type: "pushNotification"; notification: PhoneNotification }
  | { type: "clearNotifications"; appId?: string; tag?: string }
  | { type: "dismissNotification"; id: string }
  | { type: "openDialog"; dialog: PhoneDialog }
  | { type: "closeDialog" }
  | { type: "setPermission"; appId: string; kind: SdkPermissionKind; state: SdkPermissionState }
  | { type: "setBadge"; appId: string; count: number }
  | { type: "setStatusBar"; appId: string; patch: Partial<StatusBarOverride> }
  | { type: "setBackHandler"; appId: string; enabled: boolean }
  | { type: "haptic"; strength: "light" | "medium" | "heavy" }
  | { type: "hydrate"; patch: Partial<PhoneState> };

export const DEFAULT_STATUS_BAR: StatusBarOverride = {
  style: "auto",
  hidden: false,
  title: null,
};

export function createInitialState(): PhoneState {
  const theme = getTheme(DEFAULT_THEME_ID);
  return {
    themeId: theme.id,
    scheme: "dark",
    wallpaperId: theme.wallpapers[0].id,
    navMode: theme.navigation.defaultMode,
    locked: true,
    view: "home",
    homePage: 0,
    stack: [],
    foreground: null,
    shade: "closed",
    notifications: [],
    toasts: [],
    dialog: null,
    permissions: {},
    badges: {},
    statusBar: {},
    backHandlers: {},
    tiles: {
      wifi: true,
      cellular: true,
      bluetooth: false,
      airplane: false,
      torch: false,
      rotate: false,
    },
    brightness: 0.72,
    volume: 0.5,
    battery: 78,
    charging: false,
    hapticPulse: 0,
    hapticStrength: "light",
  };
}

function withoutApp(stack: string[], appId: string) {
  return stack.filter((id) => id !== appId);
}

export function phoneReducer(state: PhoneState, action: PhoneAction): PhoneState {
  switch (action.type) {
    case "setTheme": {
      if (!isThemeId(action.themeId) || action.themeId === state.themeId) {
        return state;
      }
      const theme = getTheme(action.themeId);
      return {
        ...state,
        themeId: theme.id,
        // 壁纸和导航模式是跟着主题走的,换主题时回落到新主题的默认值。
        wallpaperId: theme.wallpapers[0].id,
        navMode: theme.navigation.defaultMode,
        shade: "closed",
      };
    }

    case "setScheme":
      return { ...state, scheme: action.scheme };

    case "setWallpaper":
      return { ...state, wallpaperId: action.wallpaperId };

    case "setNavMode":
      return { ...state, navMode: action.navMode };

    case "lock":
      return { ...state, locked: true, shade: "closed", view: state.view };

    case "unlock":
      return { ...state, locked: false };

    case "goHome":
      return { ...state, view: "home", foreground: null, shade: "closed" };

    case "setHomePage":
      return { ...state, homePage: action.page };

    case "openApp": {
      if (state.dialog) {
        return state;
      }
      return {
        ...state,
        view: "app",
        foreground: action.appId,
        shade: "closed",
        stack: [action.appId, ...withoutApp(state.stack, action.appId)],
        badges: { ...state.badges, [action.appId]: 0 },
      };
    }

    case "closeApp": {
      const stack = withoutApp(state.stack, action.appId);
      const foreground = state.foreground === action.appId ? null : state.foreground;
      return {
        ...state,
        stack,
        foreground,
        view: foreground ? state.view : state.view === "app" ? "home" : state.view,
        backHandlers: { ...state.backHandlers, [action.appId]: false },
        statusBar: { ...state.statusBar, [action.appId]: DEFAULT_STATUS_BAR },
      };
    }

    case "showRecents":
      return { ...state, view: "recents", shade: "closed" };

    case "back": {
      if (state.shade !== "closed") {
        return { ...state, shade: "closed" };
      }
      if (state.view === "recents") {
        return { ...state, view: state.foreground ? "app" : "home" };
      }
      if (state.view === "app") {
        return { ...state, view: "home", foreground: null };
      }
      return state;
    }

    case "setShade":
      return { ...state, shade: action.shade };

    case "toggleTile": {
      const next = !state.tiles[action.tile];
      const tiles = { ...state.tiles, [action.tile]: next };
      // 飞行模式和 WiFi / 蜂窝互斥,给控制中心一点真实感。
      if (action.tile === "airplane" && next) {
        tiles.wifi = false;
        tiles.cellular = false;
        tiles.bluetooth = false;
      }
      if ((action.tile === "wifi" || action.tile === "cellular") && next) {
        tiles.airplane = false;
      }
      return { ...state, tiles };
    }

    case "setBrightness":
      return { ...state, brightness: Math.min(1, Math.max(0.15, action.value)) };

    case "setVolume":
      return { ...state, volume: Math.min(1, Math.max(0, action.value)) };

    case "pushToast":
      return { ...state, toasts: [...state.toasts.slice(-2), action.toast] };

    case "expireToasts": {
      const toasts = state.toasts.filter((toast) => toast.until > action.now);
      return toasts.length === state.toasts.length ? state : { ...state, toasts };
    }

    case "pushNotification": {
      const tag = action.notification.tag;
      const rest = tag
        ? state.notifications.filter(
            (item) => !(item.appId === action.notification.appId && item.tag === tag),
          )
        : state.notifications;
      return {
        ...state,
        notifications: [action.notification, ...rest].slice(0, 20),
      };
    }

    case "clearNotifications": {
      const notifications = state.notifications.filter((item) => {
        if (action.appId && item.appId !== action.appId) {
          return true;
        }
        if (action.tag && item.tag !== action.tag) {
          return true;
        }
        return false;
      });
      return { ...state, notifications };
    }

    case "dismissNotification":
      return {
        ...state,
        notifications: state.notifications.filter((item) => item.id !== action.id),
      };

    case "openDialog":
      return { ...state, dialog: action.dialog, shade: "closed" };

    case "closeDialog":
      return { ...state, dialog: null };

    case "setPermission":
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [`${action.appId}:${action.kind}`]: action.state,
        },
      };

    case "setBadge":
      return {
        ...state,
        badges: { ...state.badges, [action.appId]: Math.max(0, Math.floor(action.count)) },
      };

    case "setStatusBar": {
      const current = state.statusBar[action.appId] ?? DEFAULT_STATUS_BAR;
      return {
        ...state,
        statusBar: { ...state.statusBar, [action.appId]: { ...current, ...action.patch } },
      };
    }

    case "setBackHandler":
      return {
        ...state,
        backHandlers: { ...state.backHandlers, [action.appId]: action.enabled },
      };

    case "haptic":
      return {
        ...state,
        hapticPulse: state.hapticPulse + 1,
        hapticStrength: action.strength,
      };

    case "hydrate":
      return { ...state, ...action.patch };

    default:
      return state;
  }
}

export function permissionKey(appId: string, kind: SdkPermissionKind) {
  return `${appId}:${kind}`;
}

/** 只有这几项值得记进 localStorage;运行时状态每次都从头开始。 */
export type PersistedPrefs = Pick<
  PhoneState,
  "themeId" | "scheme" | "wallpaperId" | "navMode"
>;

export const PREFS_STORAGE_KEY = "giggle-pocket-phone:prefs";
export const APP_STORAGE_PREFIX = "giggle-pocket-phone:app:";

export function readPrefs(): Partial<PersistedPrefs> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
    return isThemeId(parsed.themeId) ? parsed : {};
  } catch {
    return {};
  }
}

export function writePrefs(prefs: PersistedPrefs) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 无痕模式之类,忽略。
  }
}
