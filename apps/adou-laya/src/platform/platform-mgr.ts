// PlatformMgr — static-safe platform layer.
//
// The original game shipped a 4399 platform manager (`Mt`/`bt` =
// Plat4399H5) handling login, ads, share, exit and analytics. Per the porting
// rules (apps/adou-laya/README.md) all platform/network glue is removed for the
// static web build; the matching no-ops live in js/adou-local-bootstrap.js.
//
// This stub exposes only the methods reconstructed callers actually invoke, and
// grows as more call sites are ported. Each method documents the original
// minified name it stands in for.

import { Singleton } from "../core/singleton";

export class PlatformMgr extends Singleton {
  /**
   * Exit the game (`ku`). The original closed the 4399 container; a static web
   * page cannot close its own tab, so this is a logged no-op. Only reachable on
   * privacy rejection, which never happens on the 4399h5 (static) config.
   */
  exit(): void {
    console.warn("[PlatformMgr] exit() is a no-op in the static web build.");
  }

  /**
   * Preload platform tasks during LoadScene (`ou`). The original ran 4399 SDK
   * preload work and reported progress(loaded, total); the static build has no
   * platform tasks, so report complete and resolve immediately.
   */
  preloadTasks(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    if (onProgress) onProgress(1, 1);
    return Promise.resolve();
  }

  /**
   * Startup platform tasks after the privacy gate (`lu`) — login / server time
   * / config in the original. Removed for the static build; resolves immediately.
   */
  startupTasks(): Promise<void> {
    return Promise.resolve();
  }
}
