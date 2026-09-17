"use client";

import type { CSSProperties } from "react";

import type { PhoneDialog, PhoneToast } from "../phone-state";
import type { PhoneTheme } from "../themes/types";

/* ------------------------------------------------------------------ 吐司 */

function toastPosition(variant: PhoneTheme["surfaces"]["toast"]): CSSProperties {
  switch (variant) {
    case "pill-center":
      return { top: "50%", transform: "translate(-50%, -50%)" };
    case "capsule-top":
      return { top: 72 };
    case "pill-bottom":
    case "parchment-bottom":
    default:
      return { bottom: 92 };
  }
}

function toastSkin(
  variant: PhoneTheme["surfaces"]["toast"],
  theme: PhoneTheme,
): CSSProperties {
  switch (variant) {
    case "capsule-top":
      return {
        background: "var(--ph-accent)",
        color: "var(--ph-text-on-accent)",
        borderRadius: 999,
        boxShadow: "0 10px 24px -10px rgba(0,0,0,0.5)",
      };
    case "parchment-bottom":
      return {
        background: "var(--ph-surface-elevated)",
        color: "var(--ph-text)",
        borderRadius: 14,
        border: "2px solid var(--ph-glass-border)",
        boxShadow: "0 4px 0 rgba(121,79,39,0.3)",
      };
    case "pill-center":
      return {
        background: "rgba(20,20,22,0.88)",
        color: "#fff",
        borderRadius: theme.surfaces.tile.radius,
        backdropFilter: "blur(10px)",
      };
    case "pill-bottom":
    default:
      return {
        background: "rgba(20,20,22,0.82)",
        color: "#fff",
        borderRadius: 999,
        backdropFilter: "blur(14px)",
      };
  }
}

function ToastIcon({ icon }: { icon: PhoneToast["icon"] }) {
  if (icon === "none") {
    return null;
  }
  if (icon === "loading") {
    return (
      <span
        aria-hidden="true"
        className="inline-block shrink-0 rounded-full border-2 border-current border-t-transparent"
        style={{ width: 13, height: 13, animation: "pocket-phone-spin 720ms linear infinite" }}
      />
    );
  }
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="shrink-0">
      {icon === "success" ? (
        <path
          d="M3.4 8.4 6.6 11.6 12.8 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function ToastLayer({
  theme,
  toasts,
}: {
  theme: PhoneTheme;
  toasts: PhoneToast[];
}) {
  if (toasts.length === 0) {
    return null;
  }
  const variant = theme.surfaces.toast;
  const position = toastPosition(variant);

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[60] flex w-[82%] flex-col items-center gap-2"
      style={{ ...position, transform: position.transform ?? "translateX(-50%)" }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="inline-flex max-w-full items-center gap-2"
          style={{
            padding: "9px 15px",
            fontSize: 13,
            fontFamily: "var(--ph-font-ui)",
            letterSpacing: "var(--ph-tracking)",
            animation: "pocket-phone-toast-in 240ms var(--ph-easing) both",
            ...toastSkin(variant, theme),
          }}
          role="status"
        >
          <ToastIcon icon={toast.icon} />
          <span className="min-w-0 break-words">{toast.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ 弹窗 */

type DialogProps = {
  theme: PhoneTheme;
  dialog: PhoneDialog;
  appName: string;
  onAnswer: (index: number) => void;
};

function dialogBox(variant: PhoneTheme["surfaces"]["dialog"]): CSSProperties {
  switch (variant) {
    case "material":
      return {
        width: 300,
        borderRadius: 26,
        background: "var(--ph-surface-elevated)",
        padding: "22px 22px 12px",
        textAlign: "left",
      };
    case "harmony-card":
      return {
        width: 292,
        borderRadius: 30,
        background: "var(--ph-glass)",
        backdropFilter: "blur(24px)",
        padding: "24px 20px 0",
        textAlign: "center",
      };
    case "parchment":
      return {
        width: 288,
        borderRadius: 18,
        background: "var(--ph-surface-elevated)",
        border: "3px solid var(--ph-glass-border)",
        boxShadow: "0 6px 0 rgba(121,79,39,0.32)",
        padding: "20px 18px 16px",
        textAlign: "center",
      };
    case "ios-alert":
    default:
      return {
        width: 272,
        borderRadius: 14,
        background: "var(--ph-glass)",
        backdropFilter: "blur(22px) saturate(1.5)",
        padding: "19px 16px 0",
        textAlign: "center",
      };
  }
}

export function DialogLayer({ theme, dialog, appName, onAnswer }: DialogProps) {
  const variant = theme.surfaces.dialog;
  const buttons = dialog.buttons;
  // iOS / 鸿蒙:两个按钮并排且有分隔线;Material / 羊皮纸:右下角文字按钮 / 游戏按钮。
  const inlineButtons = variant === "ios-alert" || variant === "harmony-card";

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center"
      style={{
        background: "var(--ph-scrim)",
        animation: "pocket-phone-fade-in var(--ph-duration-dialog) linear both",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={dialog.title}
    >
      <div
        style={{
          color: "var(--ph-text)",
          fontFamily: "var(--ph-font-ui)",
          letterSpacing: "var(--ph-tracking)",
          animation: `pocket-phone-dialog-in var(--ph-duration-dialog) var(--ph-easing) both`,
          ...dialogBox(variant),
        }}
      >
        {dialog.kind === "permission" && (
          <div
            style={{
              fontSize: 11,
              color: "var(--ph-text-secondary)",
              marginBottom: 6,
            }}
          >
            {appName}
          </div>
        )}
        <div
          style={{
            fontSize: variant === "material" ? 17 : 16,
            fontWeight: 600,
            fontFamily: variant === "parchment" ? "var(--ph-font-display)" : undefined,
          }}
        >
          {dialog.title}
        </div>
        {dialog.message && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              marginTop: 6,
              color: "var(--ph-text-secondary)",
            }}
          >
            {dialog.message}
          </div>
        )}

        {inlineButtons ? (
          <div
            className="mt-4 flex"
            style={{ borderTop: `1px solid var(--ph-separator)`, marginInline: -16 }}
          >
            {buttons.map((label, index) => (
              <button
                key={label + index}
                type="button"
                onClick={() => onAnswer(index)}
                className="flex-1 transition-colors active:bg-[var(--ph-accent-soft)]"
                style={{
                  padding: "12px 6px",
                  fontSize: 16,
                  fontWeight: index === buttons.length - 1 ? 600 : 400,
                  color:
                    dialog.destructiveIndex === index ? "#ff3b30" : "var(--ph-accent)",
                  borderLeft:
                    index > 0 ? `1px solid var(--ph-separator)` : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div
            className="mt-5 flex items-center justify-end gap-2"
            style={{ flexWrap: "wrap" }}
          >
            {buttons.map((label, index) => {
              const primary = index === buttons.length - 1;
              return (
                <button
                  key={label + index}
                  type="button"
                  onClick={() => onAnswer(index)}
                  style={{
                    padding: variant === "parchment" ? "9px 16px" : "8px 14px",
                    fontSize: 14,
                    fontWeight: primary ? 700 : 500,
                    borderRadius: variant === "parchment" ? 12 : 20,
                    color:
                      dialog.destructiveIndex === index
                        ? "#ff3b30"
                        : primary
                          ? variant === "parchment"
                            ? "var(--ph-text-on-accent)"
                            : "var(--ph-accent)"
                          : "var(--ph-text-secondary)",
                    background:
                      variant === "parchment" && primary ? "var(--ph-accent)" : "transparent",
                    border:
                      variant === "parchment"
                        ? "2px solid var(--ph-glass-border)"
                        : "none",
                    boxShadow:
                      variant === "parchment" ? "0 3px 0 rgba(121,79,39,0.3)" : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
