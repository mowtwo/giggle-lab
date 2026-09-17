// 宿主(手机壳) <-> 客体(iframe 里的 App) 的 postMessage 协议。
//
// 这份文件是唯一的事实来源;`public/phone-sdk.js` 是它的运行时镜像(纯 JS,
// 因为要被静态 App 直接 <script src> 引用)。改协议时两边一起改,并把
// PHONE_BRIDGE_VERSION 加一。
//
// 消息永远带 `tag: "giggle-phone"` 和 `v`,宿主据此过滤掉页面上其它来源的
// postMessage(Next 的 HMR、第三方脚本等)。宿主还会用 `event.source` 严格
// 比对当前活着的 iframe window——沙箱 App 的 origin 是 "null",不能靠 origin 鉴权。

export const BRIDGE_TAG = "giggle-phone";
export const PHONE_BRIDGE_VERSION = 1;

/** SDK 脚本在 public 下的路径;可信 App 由宿主自动注入,沙箱 App 自己引。 */
export const SDK_SCRIPT_PATH = "/phone-sdk.js";

// ---------------------------------------------------------------- 上下文

export type SdkSafeArea = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/** App 启动时拿到的一次性上下文,之后靠事件增量更新。 */
export type SdkContext = {
  bridgeVersion: number;
  /** 当前 App 在注册表里的 id。 */
  appId: string;
  /** 宿主页面的语言(zh / en)。 */
  locale: string;
  theme: SdkThemeInfo;
  safeArea: SdkSafeArea;
  screen: { width: number; height: number };
  device: SdkDeviceInfo;
  /** 这个 App 是以可信模式(同源)还是沙箱模式跑的。 */
  trusted: boolean;
};

/** 交给 App 的主题信息——只给"够它自己换肤"的那一层,不暴露完整描述符。 */
export type SdkThemeInfo = {
  id: string;
  label: string;
  scheme: "light" | "dark";
  accent: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  separator: string;
  radius: number;
  fontFamily: string;
  /** 建议 App 用的缓动曲线,和系统转场保持一致。 */
  easing: string;
};

export type SdkDeviceInfo = {
  model: string;
  os: string;
  osVersion: string;
  /** 模拟电量 0-100。 */
  battery: number;
  charging: boolean;
  navMode: "gesture" | "buttons";
};

// ---------------------------------------------------------------- 方法表

export type SdkMethods = {
  /** 握手后重新取一次上下文。 */
  "system.getContext": { params: void; result: SdkContext };
  /** 覆盖状态栏:前景色、是否隐藏、左上角标题(部分主题会显示)。 */
  "system.setStatusBar": {
    params: { style?: "light" | "dark" | "auto"; hidden?: boolean; title?: string | null };
    result: void;
  };
  /** 声明 App 想自己处理返回键/返回手势;true 之后宿主只发 `back` 事件不退出。 */
  "system.setBackHandler": { params: { enabled: boolean }; result: void };
  /** 请求保持屏幕常亮(纯模拟,只影响锁屏计时)。 */
  "system.keepAwake": { params: { enabled: boolean }; result: void };

  "ui.toast": {
    params: { text: string; duration?: number; icon?: "none" | "success" | "error" | "loading" };
    result: void;
  };
  /** 系统级弹窗,按主题渲染。返回被点按钮的下标;取消返回 -1。 */
  "ui.dialog": {
    params: {
      title: string;
      message?: string;
      buttons?: string[];
      destructiveIndex?: number;
      cancelable?: boolean;
    };
    result: { index: number };
  };
  /** 权限申请弹窗。 */
  "ui.requestPermission": {
    params: { kind: SdkPermissionKind; reason?: string };
    result: { state: SdkPermissionState };
  };
  "ui.getPermission": {
    params: { kind: SdkPermissionKind };
    result: { state: SdkPermissionState };
  };
  /** 震动。宿主没有真实马达时退化成屏幕抖动 + Vibration API。 */
  "ui.haptic": {
    params: { pattern?: "light" | "medium" | "heavy" | "success" | "warning" | "error" };
    result: void;
  };

  /** 退回桌面。 */
  "nav.exit": { params: void; result: void };
  /** 打开另一个已安装的 App。 */
  "nav.openApp": { params: { appId: string }; result: void };
  /** 进入多任务。 */
  "nav.recents": { params: void; result: void };

  /** 发一条系统通知,落进下拉通知栏。 */
  "notify.post": {
    params: { title: string; body?: string; tag?: string; delay?: number };
    result: { id: string };
  };
  "notify.clear": { params: { tag?: string }; result: void };
  /** 设置桌面角标。 */
  "notify.setBadge": { params: { count: number }; result: void };

  /** 每个 App 一个命名空间的持久化 KV,宿主存在 localStorage。 */
  "storage.get": { params: { key: string }; result: { value: string | null } };
  "storage.set": { params: { key: string; value: string }; result: void };
  "storage.remove": { params: { key: string }; result: void };
  "storage.keys": { params: void; result: { keys: string[] } };

  /** 已安装 App 列表(给启动器类 App 用)。 */
  "apps.list": {
    params: void;
    result: { apps: Array<{ id: string; name: string; canOpen: boolean }> };
  };
};

export type SdkMethodName = keyof SdkMethods;

export type SdkPermissionKind =
  | "camera"
  | "microphone"
  | "location"
  | "contacts"
  | "notification"
  | "storage";

export type SdkPermissionState = "granted" | "denied" | "prompt";

// ---------------------------------------------------------------- 事件表

export type SdkEvents = {
  /** 主题或深色模式变了。 */
  "theme.change": SdkThemeInfo;
  /** 用户按了返回,且 App 声明过 setBackHandler(true)。 */
  back: void;
  /** App 被切到后台(回桌面 / 进多任务 / 息屏)。 */
  pause: { reason: "home" | "recents" | "lock" | "switch" };
  /** App 回到前台。 */
  resume: void;
  /** 安全区变了(例如切换手势/三键导航)。 */
  "safearea.change": SdkSafeArea;
  /** 权限状态被用户在设置里改了。 */
  "permission.change": { kind: SdkPermissionKind; state: SdkPermissionState };
};

export type SdkEventName = keyof SdkEvents;

// ---------------------------------------------------------------- 信封

type Envelope<K extends string> = {
  tag: typeof BRIDGE_TAG;
  v: number;
  kind: K;
};

/** 客体 -> 宿主 */
export type GuestMessage =
  | (Envelope<"hello"> & { appId?: string })
  | (Envelope<"invoke"> & { id: string; method: string; params?: unknown });

/** 宿主 -> 客体 */
export type HostMessage =
  | (Envelope<"ready"> & { context: SdkContext })
  | (Envelope<"reply"> & { id: string; ok: true; data: unknown })
  | (Envelope<"reply"> & { id: string; ok: false; error: { code: string; message: string } })
  | (Envelope<"event"> & { name: string; payload: unknown });

export function isGuestMessage(value: unknown): value is GuestMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.tag === BRIDGE_TAG &&
    record.v === PHONE_BRIDGE_VERSION &&
    (record.kind === "hello" || record.kind === "invoke")
  );
}

export const SDK_ERROR = {
  unknownMethod: "E_UNKNOWN_METHOD",
  badParams: "E_BAD_PARAMS",
  denied: "E_DENIED",
  notFound: "E_NOT_FOUND",
  quota: "E_QUOTA",
} as const;
