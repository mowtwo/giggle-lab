const MB = 1024 * 1024;

export class ByteLimitError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super("byte-limit");
    this.name = "ByteLimitError";
    this.limit = limit;
  }
}

function fallbackByteLimit() {
  if (typeof navigator === "undefined") return 200 * MB;
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  if (mobile) return 80 * MB;
  const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
  if (safari) return 100 * MB;
  return 200 * MB;
}

export async function resolveByteLimit() {
  const cap = fallbackByteLimit();
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota || estimate.usage === undefined) return cap;
    const room = Math.max(0, estimate.quota - estimate.usage);
    const quarter = Math.floor(room * 0.25);
    if (quarter < 8 * MB) return Math.max(quarter, 0);
    return Math.min(cap, quarter);
  } catch {
    return cap;
  }
}

export async function readStorageEstimate() {
  try {
    const estimate = await navigator.storage?.estimate?.();
    return {
      usage: estimate?.usage ?? null,
      quota: estimate?.quota ?? null,
    };
  } catch {
    return { usage: null, quota: null };
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / (1024 * MB)).toFixed(2)} GB`;
}
