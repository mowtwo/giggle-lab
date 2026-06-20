#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "../..");
const bundledSourceDir = path.join(
  rootDir,
  "apps/adou-laya/vendor/original/game",
);
const fallbackSourceDir =
  "/private/tmp/giggle-lab-4399-source-20260610/game";
const sourceDir = path.resolve(
  process.env.ADOU_ORIGINAL_SOURCE_DIR ??
    (existsSync(path.join(bundledSourceDir, "gameIndex.html"))
      ? bundledSourceDir
      : fallbackSourceDir),
);
const outDir = path.resolve(
  process.env.ADOU_ORIGINAL_OUT_DIR ?? path.join(rootDir, "public/adou-laya"),
);

const requiredFiles = [
  "gameIndex.html",
  "fileconfig.json",
  "js/bundle.js",
  "js/index.js",
  "libs/laya.core.js",
  "libs/laya.webgl_2D.js",
  "libs/laya.ui.js",
  "libs/laya.trailCommon.js",
  "libs/laya.trail2D.js",
  "libs/spine-core-3.7.js",
  "libs/laya.spine.js",
  "scene/LoadScene.ls",
  "scene/MainScene.ls",
  "scene/BattleScene.ls",
  "scene/MatchScene.ls",
  "scene/WeaponScene.ls",
  "scene/GameOverScene.ls",
  "dialog/DeckDialog.lh",
  "dialog/PauseDialog.lh",
  "dialog/UnitInfoDialog.lh",
  "dialog/WeaponIntroDialog.lh",
  "prefab/shopPropsItem.lh",
  "resources/sound/battle_end_gold_fly.mp3",
];

function assertSource() {
  for (const file of requiredFiles) {
    const fullPath = path.join(sourceDir, file);
    if (!existsSync(fullPath)) {
      throw new Error(`Missing original Adou file: ${fullPath}`);
    }
  }
}

function createLocalBootstrap() {
  return `(() => {
  window.__ADOU_STATIC_BUILD__ = true;

  const localApiPayload = (url) => {
    const requestUrl = new URL(String(url), window.location.href);
    const path = requestUrl.pathname.replace(/^\\/(zh|en)\\//, "/");
    const data = { code: 0, msg: "ok", message: "ok", success: true, data: null };

    if (path.endsWith("/sys/server/time")) {
      data.data = Date.now();
    } else if (path.endsWith("/sys/user/login")) {
      data.data = {
        authentication: "adou-static-local",
        userId: 1,
        attach: { province: "本地" },
      };
    } else if (path.endsWith("/sys/user/info")) {
      data.data = true;
    } else if (path.endsWith("/bestRank")) {
      data.data = [];
    } else if (path.includes("/zyyad/game/country/list")) {
      data.data = [];
    } else if (path.includes("/zyyad/game/province/detail/list")) {
      data.data = [];
    } else if (path.includes("/zyyad/game/start")) {
      data.data = { id: "local-battle" };
    } else if (path.includes("/zyyad/game/end")) {
      data.data = true;
    } else if (path.endsWith("/sys/oa/point/add/new")) {
      data.data = true;
    }

    return data;
  };

  const isLocalApiRequest = (url) => {
    try {
      const requestUrl = new URL(String(url), window.location.href);
      const path = requestUrl.pathname.replace(/^\\/(zh|en)\\//, "/");
      return (
        path.includes("/zyyad/game/") ||
        path.endsWith("/sys/user/login") ||
        path.endsWith("/sys/user/info") ||
        path.endsWith("/sys/server/time") ||
        path.endsWith("/sys/oa/point/add/new") ||
        path.endsWith("/bestRank")
      );
    } catch {
      return false;
    }
  };

  const NativeXMLHttpRequest = window.XMLHttpRequest;
  window.XMLHttpRequest = class AdouStaticXMLHttpRequest {
    constructor() {
      this.responseType = "";
      this.dataType = "";
      this.timeout = 0;
      this.withCredentials = false;
      this.readyState = 0;
      this.status = 0;
      this.statusText = "";
      this.responseURL = "";
      this.response = null;
      this.responseText = "";
      this.onload = null;
      this.onerror = null;
      this.onabort = null;
      this.onprogress = null;
      this._headers = {};
      this._native = null;
      this._localUrl = "";
    }

    open(method, url, async = true, user, password) {
      this._method = method;
      this._localUrl = isLocalApiRequest(url) ? String(url) : "";
      if (this._localUrl) {
        this.readyState = 1;
        this.responseURL = new URL(this._localUrl, window.location.href).href;
        return;
      }

      this._native = new NativeXMLHttpRequest();
      return this._native.open(method, url, async, user, password);
    }

    setRequestHeader(key, value) {
      if (this._native) {
        this._native.setRequestHeader(key, value);
      } else {
        this._headers[key] = value;
      }
    }

    send(body) {
      if (this._native) {
        const syncNativeState = () => {
          this.readyState = this._native.readyState;
          this.status = this._native.status;
          this.statusText = this._native.statusText;
          this.responseURL = this._native.responseURL;
          this.response = this._native.response;
          try {
            this.responseText = this._native.responseText;
          } catch {
            this.responseText = "";
          }
        };

        this._native.responseType = this.responseType;
        this._native.timeout = this.timeout;
        this._native.withCredentials = this.withCredentials;
        this._native.onerror = (event) => {
          syncNativeState();
          if (typeof this.onerror === "function") this.onerror(event);
        };
        this._native.onabort = (event) => {
          syncNativeState();
          if (typeof this.onabort === "function") this.onabort(event);
        };
        this._native.onprogress = (event) => {
          syncNativeState();
          if (typeof this.onprogress === "function") this.onprogress(event);
        };
        this._native.onload = (event) => {
          syncNativeState();
          if (typeof this.onload === "function") this.onload(event);
        };
        return this._native.send(body);
      }

      window.setTimeout(() => {
        const payload = localApiPayload(this._localUrl);
        const text = JSON.stringify(payload);
        this.readyState = 4;
        this.status = 200;
        this.statusText = "OK";
        this.responseText = text;
        this.response = this.responseType === "arraybuffer"
          ? new TextEncoder().encode(text).buffer
          : text;
        if (typeof this.onload === "function") {
          this.onload({ target: this });
        }
      }, 0);
    }

    abort() {
      if (this._native) {
        this._native.abort();
      } else if (typeof this.onabort === "function") {
        this.onabort({ target: this });
      }
    }

    getAllResponseHeaders() {
      return this._native ? this._native.getAllResponseHeaders() : "content-type: application/json\\r\\n";
    }

    getResponseHeader(name) {
      return this._native ? this._native.getResponseHeader(name) : (String(name).toLowerCase() === "content-type" ? "application/json" : null);
    }
  };

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch) {
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input && input.url;
      if (url && isLocalApiRequest(url)) {
        return Promise.resolve(new Response(JSON.stringify(localApiPayload(url)), {
          status: 200,
          headers: { "content-type": "application/json" },
        }));
      }
      return nativeFetch(input, init);
    };
  }

  // Provide the smallest 4399 SDK shape the original bundle expects. This makes
  // it select its 4399H5 config, which does not require privacy/login overlays,
  // while keeping ads and platform side effects local no-ops.
  window.h5api = {
    playAd(callback) {
      if (typeof callback === "function") {
        callback({ code: 10001, message: "static build reward granted" });
      }
    },
    playInterstitialAd() {},
  };
  delete window.gamebox;

  window.adouStaticPlatform = {
    playReward(success) {
      if (typeof success === "function") success();
    },
    playInterstitial(done) {
      if (typeof done === "function") done();
    },
    share(success) {
      if (typeof success === "function") success();
    },
  };
})();`;
}

function createIndexHtml() {
  const original = readFileSync(path.join(sourceDir, "gameIndex.html"), "utf8");
  return original
    .replace("<title>赵云与阿斗</title>", "<title>阿斗</title>")
    .replace(
      /\s*<script src="https:\/\/h\.api\.4399\.com\/h5mini-2\.0\/h5api-interface\.php"><\/script>\s*/g,
      "\n",
    )
    .replace(
      '<script type="text/javascript" src="js/bundle.js"></script>',
      [
        '<script type="text/javascript" src="js/adou-local-bootstrap.js"></script>',
        '    <script type="text/javascript" src="js/bundle.js"></script>',
      ].join("\n"),
    );
}

function createIndexJs() {
  const original = readFileSync(path.join(sourceDir, "js/index.js"), "utf8");
  return original
    .replace(/"scaleMode":"fixedwidth"/, "\"scaleMode\":\"showall\"")
    .replace(/"screenMode":"vertical"/, "\"screenMode\":\"none\"")
    .replace(/"alignV":"top"/, "\"alignV\":\"middle\"")
    .replace(/"alignH":"left"/, "\"alignH\":\"center\"")
    .replace(/"backgroundColor":"#888888"/, "\"backgroundColor\":\"#17110d\"");
}

function main() {
  assertSource();

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(sourceDir, outDir, {
    recursive: true,
    filter(source) {
      return path.basename(source) !== "download-report.json";
    },
  });

  writeFileSync(path.join(outDir, "index.html"), createIndexHtml());
  writeFileSync(path.join(outDir, "js/index.js"), createIndexJs());
  writeFileSync(
    path.join(outDir, "js/adou-local-bootstrap.js"),
    createLocalBootstrap(),
  );
  writeFileSync(
    path.join(outDir, "adou-build-info.json"),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        source: path.relative(rootDir, sourceDir),
        mode: "original-static",
      },
      null,
      2,
    ),
  );

  console.log(`Synced original Adou package to ${path.relative(rootDir, outDir)}`);
}

main();
