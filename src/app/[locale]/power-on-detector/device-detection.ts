export type DeviceInfo = {
  kind: "phone" | "tablet" | "computer" | "unknown";
  os: string;
  key: DeviceKey;
  renderer?: string;
};

export type DeviceKey =
  | "iphone"
  | "ipad"
  | "macbook"
  | "windowsPc"
  | "androidPhone"
  | "androidTablet"
  | "linuxPc"
  | "linuxDevice"
  | "appleDevice"
  | "computer"
  | "device";

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    platform?: string;
    mobile?: boolean;
  };
};

function getWebGlRenderer() {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl");

  if (!gl || !("getExtension" in gl)) {
    return undefined;
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

  if (!debugInfo) {
    return undefined;
  }

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

  return typeof renderer === "string" ? renderer : undefined;
}

function inferAppleKey(kind: DeviceInfo["kind"], ua: string): DeviceKey {
  if (/iPhone/i.test(ua)) {
    return "iphone";
  }

  if (/iPad/i.test(ua)) {
    return "ipad";
  }

  if (/Macintosh|Mac OS X/i.test(ua)) {
    return kind === "tablet" ? "ipad" : "macbook";
  }

  return kind === "phone" ? "iphone" : "appleDevice";
}

function inferKind(ua: string, mobileHint?: boolean): DeviceInfo["kind"] {
  if (/iPad|Tablet/i.test(ua)) {
    return "tablet";
  }

  if (/Mobi|iPhone|Android/i.test(ua) || mobileHint) {
    return /Android/i.test(ua) && !/Mobile/i.test(ua) ? "tablet" : "phone";
  }

  return "computer";
}

export function detectDevice(): DeviceInfo {
  const nav = navigator as NavigatorWithUAData;
  const ua = navigator.userAgent;
  const platform = nav.userAgentData?.platform || navigator.platform || "";
  const kind = inferKind(ua, nav.userAgentData?.mobile);
  const renderer = getWebGlRenderer();
  const haystack = `${ua} ${platform} ${renderer ?? ""}`;

  if (/iPhone|iPad|Mac|Apple/i.test(haystack)) {
    const key = inferAppleKey(kind, ua);

    return {
      kind,
      os: /iPhone|iPad/i.test(ua) ? "iOS/iPadOS" : "macOS",
      key,
      renderer,
    };
  }

  if (/Windows/i.test(haystack)) {
    return {
      kind: "computer",
      os: "Windows",
      key: "windowsPc",
      renderer,
    };
  }

  if (/Android/i.test(haystack)) {
    return {
      kind,
      os: "Android",
      key: kind === "tablet" ? "androidTablet" : "androidPhone",
      renderer,
    };
  }

  if (/Linux/i.test(haystack)) {
    return {
      kind,
      os: "Linux",
      key: kind === "computer" ? "linuxPc" : "linuxDevice",
      renderer,
    };
  }

  return {
    kind,
    os: "Unknown",
    key: kind === "computer" ? "computer" : "device",
    renderer,
  };
}
