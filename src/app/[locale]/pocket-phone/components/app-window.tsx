"use client";

import { useEffect, useRef, useState } from "react";

import { SDK_SCRIPT_PATH } from "../protocol";
import type { PhoneAppEntry } from "../registry";
import type { PhoneTheme } from "../themes/types";
import type { PhoneBridge } from "../use-phone-bridge";

const LAUNCH_ANIMATION: Record<PhoneTheme["motion"]["launch"], string> = {
  "zoom-from-icon": "pocket-phone-launch-zoom",
  "scale-fade": "pocket-phone-launch-scale",
  "fold-up": "pocket-phone-launch-fold",
  "bounce-in": "pocket-phone-launch-bounce",
};

type AppWindowProps = {
  app: PhoneAppEntry;
  theme: PhoneTheme;
  bridge: PhoneBridge;
  visible: boolean;
  loadingLabel: string;
};

/**
 * 一个 App 一个 iframe,进了最近任务就一直挂着不卸载——这样后台通知、角标
 * 这些行为才是真的(切回去状态还在)。
 *
 * 两种装载方式:
 *   - trusted:同源,iframe 加载完由宿主把 /phone-sdk.js 注入进 guest 文档,
 *     App 自己一行引入都不用写,靠 `phone:sdkready` 事件拿到 window.phone;
 *   - 非 trusted:sandbox 去掉 allow-same-origin,origin 变成 "null",宿主够不着
 *     它的 document,只能由 App 自己 <script src="/phone-sdk.js">。
 * 两条路之后走的是同一套 postMessage 协议。
 */
export function AppWindow({ app, theme, bridge, visible, loadingLabel }: AppWindowProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const unregisterRef = useRef<(() => void) | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    const frame = frameRef.current;
    const guest = frame?.contentWindow;
    if (!frame || !guest) {
      return;
    }

    // 必须先登记再注入:沙箱 App 的握手在 iframe load 之前就发出来了,
    // 宿主这边要是还没认下这个 window,那条 hello 会被直接丢掉。
    // (SDK 侧也会重试握手,两边都兜一层。)
    unregisterRef.current?.();
    unregisterRef.current = bridge.registerFrame(app.id, guest, app.trusted === true);
    setLoaded(true);

    if (app.trusted) {
      // 同源:直接把 SDK 塞进去。App 侧不需要任何引入语句。
      try {
        const doc = frame.contentDocument;
        if (doc && !doc.querySelector(`script[data-phone-sdk]`)) {
          const script = doc.createElement("script");
          script.src = SDK_SCRIPT_PATH;
          script.dataset.phoneSdk = "true";
          doc.head.appendChild(script);
        }
      } catch {
        // 跨源了(不该发生),退化成等 App 自己引入。
      }
    }
  };

  useEffect(
    () => () => {
      unregisterRef.current?.();
      unregisterRef.current = null;
    },
    [],
  );

  return (
    <div
      className="absolute inset-0"
      style={{
        display: visible ? "block" : "none",
        background: "var(--ph-surface)",
        animation: visible
          ? `${LAUNCH_ANIMATION[theme.motion.launch]} var(--ph-duration-launch) var(--ph-easing) both`
          : undefined,
      }}
      aria-hidden={!visible}
    >
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: "var(--ph-text-secondary)", fontSize: 13 }}
        >
          {loadingLabel}
        </div>
      )}
      <iframe
        ref={frameRef}
        title={app.id}
        src={app.url}
        onLoad={handleLoad}
        // 可信应用给同源(宿主要注入脚本);其余只给脚本执行权,origin 退化成 "null"。
        sandbox={
          app.trusted
            ? "allow-scripts allow-same-origin allow-forms"
            : "allow-scripts allow-forms"
        }
        className="block h-full w-full border-0"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 180ms linear",
          background: "transparent",
        }}
      />
    </div>
  );
}
