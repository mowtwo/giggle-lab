"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { PhoneState } from "../phone-state";
import { PHONE_BRIDGE_VERSION, type SdkPermissionKind } from "../protocol";
import { PHONE_APPS } from "../registry";
import { PHONE_THEMES } from "../themes";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../themes/tokens";
import type { ColorScheme, NavMode, PhoneTheme, ThemeId } from "../themes/types";

const PERMISSION_KINDS: SdkPermissionKind[] = [
  "camera",
  "microphone",
  "location",
  "contacts",
  "notification",
  "storage",
];

type SettingsAppProps = {
  theme: PhoneTheme;
  state: PhoneState;
  appName: (appId: string) => string;
  onSetTheme: (id: ThemeId) => void;
  onSetScheme: (scheme: ColorScheme) => void;
  onSetWallpaper: (id: string) => void;
  onSetNavMode: (mode: NavMode) => void;
  onRevokePermission: (appId: string, kind: SdkPermissionKind) => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h2
        className="mb-2 px-1"
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ph-text-secondary)",
        }}
      >
        {title}
      </h2>
      <div
        className="overflow-hidden"
        style={{
          borderRadius: "var(--ph-radius-tile)",
          background: "var(--ph-surface-elevated)",
          border: "1px solid var(--ph-separator)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  hint,
  right,
  onClick,
  selected,
}: {
  label: string;
  hint?: string;
  right?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const content = (
    <div
      className="flex w-full items-center justify-between gap-3 text-left"
      style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--ph-separator)",
      }}
    >
      <span className="min-w-0">
        <span className="block" style={{ fontSize: 14 }}>
          {label}
        </span>
        {hint && (
          <span
            className="mt-0.5 block"
            style={{ fontSize: 11, color: "var(--ph-text-secondary)", lineHeight: 1.45 }}
          >
            {hint}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {right}
        {selected && (
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <path
              d="M3 8.6 6.3 12 13 4.8"
              fill="none"
              stroke="var(--ph-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </div>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className="block w-full">
      {content}
    </button>
  ) : (
    content
  );
}

export function SettingsApp({
  theme,
  state,
  appName,
  onSetTheme,
  onSetScheme,
  onSetWallpaper,
  onSetNavMode,
  onRevokePermission,
}: SettingsAppProps) {
  const t = useTranslations("PocketPhone");

  const grantedPermissions = PHONE_APPS.flatMap((app) =>
    PERMISSION_KINDS.filter(
      (kind) => state.permissions[`${app.id}:${kind}`] === "granted",
    ).map((kind) => ({ app, kind })),
  );

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{
        background: "var(--ph-surface)",
        color: "var(--ph-text)",
        fontFamily: "var(--ph-font-ui)",
        letterSpacing: "var(--ph-tracking)",
        padding: "14px 14px 28px",
      }}
    >
      <h1
        className="mb-4 px-1"
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "var(--ph-font-display)",
        }}
      >
        {t("apps.settings")}
      </h1>

      <Section title={t("settings.themeSection")}>
        {PHONE_THEMES.map((item) => (
          <Row
            key={item.id}
            label={item.label}
            hint={t(`themes.${item.blurbKey}`)}
            selected={item.id === state.themeId}
            onClick={() => onSetTheme(item.id)}
            right={
              <span
                aria-hidden="true"
                className="inline-block"
                style={{
                  width: 34,
                  height: 22,
                  borderRadius: 6,
                  background: item.wallpapers[0][state.scheme],
                  border: "1px solid var(--ph-separator)",
                }}
              />
            }
          />
        ))}
      </Section>

      <Section title={t("settings.appearance")}>
        {(["light", "dark"] as ColorScheme[]).map((scheme) => (
          <Row
            key={scheme}
            label={t(`settings.scheme.${scheme}`)}
            selected={state.scheme === scheme}
            onClick={() => onSetScheme(scheme)}
          />
        ))}
      </Section>

      <Section title={t("settings.wallpaper")}>
        {theme.wallpapers.map((wallpaper) => (
          <Row
            key={wallpaper.id}
            label={t(`wallpapers.${wallpaper.id}`)}
            selected={state.wallpaperId === wallpaper.id}
            onClick={() => onSetWallpaper(wallpaper.id)}
            right={
              <span
                aria-hidden="true"
                className="inline-block"
                style={{
                  width: 34,
                  height: 22,
                  borderRadius: 6,
                  background: wallpaper[state.scheme],
                  border: "1px solid var(--ph-separator)",
                }}
              />
            }
          />
        ))}
      </Section>

      {theme.navigation.allowSwitch && (
        <Section title={t("settings.navigation")}>
          {(["gesture", "buttons"] as NavMode[]).map((mode) => (
            <Row
              key={mode}
              label={t(`settings.navMode.${mode}`)}
              selected={state.navMode === mode}
              onClick={() => onSetNavMode(mode)}
            />
          ))}
        </Section>
      )}

      <Section title={t("settings.permissions")}>
        {grantedPermissions.length === 0 ? (
          <Row label={t("settings.noPermissions")} />
        ) : (
          grantedPermissions.map(({ app, kind }) => (
            <Row
              key={`${app.id}:${kind}`}
              label={`${appName(app.id)} · ${t(`permissions.${kind}`)}`}
              hint={t("settings.tapToRevoke")}
              onClick={() => onRevokePermission(app.id, kind)}
              right={
                <span style={{ fontSize: 12, color: "var(--ph-accent)" }}>
                  {t("settings.granted")}
                </span>
              }
            />
          ))
        )}
      </Section>

      <Section title={t("settings.about")}>
        <Row label={t("settings.model")} right={<Value>{theme.label}</Value>} />
        <Row
          label={t("settings.resolution")}
          right={<Value>{`${SCREEN_WIDTH} × ${SCREEN_HEIGHT}`}</Value>}
        />
        <Row
          label={t("settings.bridgeVersion")}
          right={<Value>{`v${PHONE_BRIDGE_VERSION}`}</Value>}
        />
        <Row
          label={t("settings.installedApps")}
          right={<Value>{`${PHONE_APPS.length}`}</Value>}
        />
      </Section>
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>{children}</span>
  );
}
