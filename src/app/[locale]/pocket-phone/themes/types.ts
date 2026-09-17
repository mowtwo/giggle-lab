// 手机主题描述符。
//
// 设计目标:新增一套主题 = 新增一个 `PhoneTheme` 字面量 + 在 themes/index.ts 里注册,
// 不改任何组件。因此这里把"各家系统长得不一样"的地方全部数据化成两类字段:
//
//   1. 枚举型变体(variant)——结构上真的不同,组件里有一个 switch 分支对应。
//      例如状态栏挖孔形态、导航模式、下拉面板是合并还是左右分屏。
//      复用已有变体的新主题不需要碰组件;要引入全新形态才需要加一个分支。
//   2. 标量 token——颜色、圆角、模糊、时长、字体栈等,统一转成 CSS 变量注入
//      手机根节点(见 themes/tokens.ts),组件只读变量。
//
// 约定:所有长度单位都是"屏幕逻辑像素"(以 390×844 的 CSS 像素画布为基准),
// 外壳整体通过 transform: scale() 适配容器,所以主题里可以放心写死数值。

export type ThemeId = "ios" | "hyperos" | "harmonyos" | "animal-island";

export type ColorScheme = "light" | "dark";

/** 状态栏顶部的挖孔形态。 */
export type CutoutVariant = "island" | "notch" | "punch-hole" | "none";

/** 导航形态。`both` 表示这套系统两种都支持,用户可在设置里切。 */
export type NavMode = "gesture" | "buttons";

/** 应用图标外形。 */
export type IconShape = "squircle" | "rounded" | "circle" | "sticker";

/** 下拉面板的组织方式:合并成一张抽屉,还是左右分屏(左通知 / 右控制中心)。 */
export type ShadeVariant = "unified" | "split";

/** 系统弹窗(alert / 权限申请)的视觉语言。 */
export type DialogVariant = "ios-alert" | "material" | "harmony-card" | "parchment";

/** 吐司的位置与形状。 */
export type ToastVariant = "pill-bottom" | "pill-center" | "capsule-top" | "parchment-bottom";

/** 打开应用的转场。 */
export type LaunchVariant = "zoom-from-icon" | "scale-fade" | "fold-up" | "bounce-in";

/** 电量图标画法。 */
export type BatteryVariant = "pill" | "bar" | "leaf";

export type ThemeFrame = {
  /** 机身圆角。 */
  bodyRadius: number;
  /** 边框(黑边)宽度。 */
  bezel: number;
  /** 屏幕圆角。 */
  screenRadius: number;
  /** 机身材质,直接当 CSS background 用。 */
  bodyBackground: string;
  /** 机身外沿的高光/描边。 */
  bodyBorder: string;
  /** 机身投影。 */
  bodyShadow: string;
  /** 侧键:相对屏幕顶部的偏移与长度,left 表示画在左侧。 */
  buttons: Array<{ side: "left" | "right"; top: number; length: number }>;
};

export type ThemeStatusBar = {
  height: number;
  cutout: CutoutVariant;
  /** 挖孔尺寸;`none` 时忽略。 */
  cutoutSize: { width: number; height: number };
  /** 是否在左侧显示运营商文字。 */
  carrier: string | null;
  /** 时间是否补零(iOS 不补零,安卓系普遍补零)。 */
  padHour: boolean;
  battery: BatteryVariant;
  /** 状态栏内容左右两侧的内边距。 */
  sidePadding: number;
  fontSize: number;
  fontWeight: number;
};

export type ThemeNavigation = {
  /** 这套系统默认用哪种导航。 */
  defaultMode: NavMode;
  /** 是否允许用户切换(设置里出现开关)。 */
  allowSwitch: boolean;
  /** 手势模式下的横条尺寸。 */
  indicator: { width: number; height: number; radius: number };
  /** 导航区高度(手势模式 / 按键模式)。 */
  height: { gesture: number; buttons: number };
  /** 三键顺序,决定左中右画什么。 */
  buttonOrder: Array<"back" | "home" | "recents">;
  /** 三键的图形语言。 */
  buttonGlyph: "miui" | "harmony" | "classic";
};

export type ThemeIcons = {
  shape: IconShape;
  /** 图标边长。 */
  size: number;
  /** squircle/rounded 的圆角(sticker/circle 忽略)。 */
  radius: number;
  /** 图标是否带高光描边(iOS/HarmonyOS 有,HyperOS 更扁平)。 */
  gloss: boolean;
  /** 图标投影。 */
  shadow: string;
  grid: { cols: number; rows: number; gapX: number; gapY: number };
  /** 桌面网格的外边距。 */
  padding: { top: number; bottom: number; x: number };
  label: {
    show: boolean;
    size: number;
    weight: number;
    gap: number;
    /** 图标文字压在壁纸上,亮暗两套壁纸要各给一个颜色。 */
    color: Record<ColorScheme, string>;
    shadow: Record<ColorScheme, string>;
  };
  badge: {
    shape: "circle" | "rounded";
    background: string;
    color: string;
    size: number;
    /** 徽标相对图标右上角的偏移。 */
    offset: number;
  };
};

export type ThemeDock = {
  show: boolean;
  /** dock 背板的圆角与模糊;show=false 时忽略。 */
  radius: number;
  blur: number;
  background: string;
  border: string;
  paddingY: number;
  marginX: number;
  /** dock 和导航区之间的间距。 */
  marginBottom: number;
};

export type ThemeMotion = {
  launch: LaunchVariant;
  /** 应用打开/关闭时长(ms)。 */
  launchDuration: number;
  /** 通用缓动曲线。 */
  easing: string;
  /** 下拉面板时长(ms)。 */
  shadeDuration: number;
  /** 弹窗时长(ms)。 */
  dialogDuration: number;
};

export type ThemeSurfaces = {
  shade: ShadeVariant;
  dialog: DialogVariant;
  toast: ToastVariant;
  /** 控制中心磁贴的形状。 */
  tile: { radius: number; gap: number };
  /** 面板模糊强度(px)。 */
  blur: number;
};

/** 会被写成 CSS 变量的调色板。键名即 `--ph-<kebab(key)>`。 */
export type ThemePalette = {
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  textPrimary: string;
  textSecondary: string;
  textOnAccent: string;
  separator: string;
  scrim: string;
  /** 面板/弹窗的玻璃底色。 */
  glass: string;
  glassBorder: string;
};

export type ThemeTypography = {
  /** UI 字体栈。 */
  ui: string;
  /** 大标题字体栈(锁屏时钟、设置大标题)。 */
  display: string;
  /** 全局字距。 */
  tracking: string;
};

export type ThemeWallpaper = {
  id: string;
  /** 直接作为 CSS background。 */
  light: string;
  dark: string;
};

export type PhoneTheme = {
  id: ThemeId;
  /** 设置里显示的名字(不走 i18n:系统名本身不翻译)。 */
  label: string;
  /** 一句话风格说明的 i18n key,位于 PocketPhone.themes.<id>。 */
  blurbKey: string;
  frame: ThemeFrame;
  statusBar: ThemeStatusBar;
  navigation: ThemeNavigation;
  icons: ThemeIcons;
  dock: ThemeDock;
  motion: ThemeMotion;
  surfaces: ThemeSurfaces;
  typography: ThemeTypography;
  /** 亮/暗两套调色板。 */
  palette: Record<ColorScheme, ThemePalette>;
  /** 这套主题自带的壁纸,第一个是默认。 */
  wallpapers: ThemeWallpaper[];
  /** 状态栏/导航栏前景色跟随壁纸时的默认取值。 */
  defaultBarStyle: Record<ColorScheme, "light" | "dark">;
};
