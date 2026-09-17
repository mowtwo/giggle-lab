import type { ColorScheme, PhoneTheme } from "./types";

/**
 * 把主题描述符压成一组 CSS 变量,挂在手机根节点上。
 * 组件一律读 `var(--ph-xxx)`,不直接 import 主题对象——这样换主题只是换变量,
 * 过渡动画也能直接吃 transition。
 */
export function themeToCssVars(
  theme: PhoneTheme,
  scheme: ColorScheme,
): Record<string, string> {
  const palette = theme.palette[scheme];

  return {
    "--ph-accent": palette.accent,
    "--ph-accent-soft": palette.accentSoft,
    "--ph-surface": palette.surface,
    "--ph-surface-elevated": palette.surfaceElevated,
    "--ph-surface-sunken": palette.surfaceSunken,
    "--ph-text": palette.textPrimary,
    "--ph-text-secondary": palette.textSecondary,
    "--ph-text-on-accent": palette.textOnAccent,
    "--ph-separator": palette.separator,
    "--ph-scrim": palette.scrim,
    "--ph-glass": palette.glass,
    "--ph-glass-border": palette.glassBorder,

    "--ph-font-ui": theme.typography.ui,
    "--ph-font-display": theme.typography.display,
    "--ph-tracking": theme.typography.tracking,

    "--ph-radius-tile": `${theme.surfaces.tile.radius}px`,
    "--ph-gap-tile": `${theme.surfaces.tile.gap}px`,
    "--ph-blur": `${theme.surfaces.blur}px`,

    "--ph-easing": theme.motion.easing,
    "--ph-duration-launch": `${theme.motion.launchDuration}ms`,
    "--ph-duration-shade": `${theme.motion.shadeDuration}ms`,
    "--ph-duration-dialog": `${theme.motion.dialogDuration}ms`,

    "--ph-screen-radius": `${theme.frame.screenRadius}px`,
    "--ph-statusbar-h": `${theme.statusBar.height}px`,
  };
}

/** 屏幕逻辑画布尺寸,所有主题共用;外壳整体缩放来适配容器。 */
export const SCREEN_WIDTH = 390;
export const SCREEN_HEIGHT = 844;
