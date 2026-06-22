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

// 运行时错误浮层(Error HUD)。
//
// 给测试者用:页面出错时,他们往往拿不到 console 输出。这个浮层只捕获"真正的
// 错误"——未捕获的异常(window.onerror)与未处理的 Promise 拒绝
// (unhandledrejection),以及渲染循环停摆(疑似卡死)。它**不**拦截
// console.error,因为 Laya 与原版游戏把 console.error 当普通日志用,拦截会误报。
//
// 平时完全隐藏;出错时右下角出现一个红色 "!" 图标(带计数)。点一下展开面板,
// 里面是完整的报错信息+堆栈,可一键复制,也可直接选中/截图。
function createErrorHud() {
  return `(() => {
  if (window.__ADOU_ERROR_HUD__) return;
  window.__ADOU_ERROR_HUD__ = true;

  var MAX = 50;
  var errors = [];        // { key, msg, stack, time, count }
  var icon, badge, panel, body;

  function two(n) { return (n < 10 ? "0" : "") + n; }
  function ts() {
    var d = new Date();
    return two(d.getHours()) + ":" + two(d.getMinutes()) + ":" + two(d.getSeconds());
  }
  function S(el, css) { el.setAttribute("style", css); return el; }

  function ensureIcon() {
    if (icon) return;
    icon = S(document.createElement("div"),
      "position:fixed;right:12px;bottom:12px;z-index:2147483647;width:46px;height:46px;" +
      "border-radius:50%;background:#d9342b;color:#fff;font:bold 28px/46px sans-serif;" +
      "text-align:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.45);" +
      "display:none;user-select:none;-webkit-user-select:none;");
    icon.textContent = "!";
    badge = S(document.createElement("span"),
      "position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;border-radius:10px;" +
      "background:#1b1b1b;color:#fff;font:bold 12px/20px sans-serif;text-align:center;padding:0 5px;");
    badge.textContent = "0";
    icon.appendChild(badge);
    icon.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    (document.body || document.documentElement).appendChild(icon);
  }

  function ensurePanel() {
    if (panel) return;
    panel = S(document.createElement("div"),
      "position:fixed;left:0;right:0;bottom:0;max-height:70%;z-index:2147483647;" +
      "background:#1b140e;color:#f3e7d2;border-top:3px solid #d9342b;display:none;" +
      "flex-direction:column;font:13px/1.5 -apple-system,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,.5);");
    var bar = S(document.createElement("div"),
      "display:flex;align-items:center;gap:8px;padding:8px 12px;background:#2a1f15;flex:0 0 auto;");
    var title = S(document.createElement("div"), "flex:1;font-weight:bold;color:#ffd98a;");
    title.textContent = "游戏运行时错误";
    var copyBtn = mkBtn("复制全部", function () { copyAll(copyBtn); });
    var closeBtn = mkBtn("关闭", function () { toggle(); });
    bar.appendChild(title); bar.appendChild(copyBtn); bar.appendChild(closeBtn);
    body = S(document.createElement("div"),
      "overflow:auto;padding:8px 12px;flex:1 1 auto;-webkit-overflow-scrolling:touch;" +
      "user-select:text;-webkit-user-select:text;white-space:pre-wrap;word-break:break-word;");
    panel.appendChild(bar); panel.appendChild(body);
    (document.body || document.documentElement).appendChild(panel);
  }

  function mkBtn(label, fn) {
    var b = S(document.createElement("button"),
      "background:#d9342b;color:#fff;border:0;border-radius:6px;padding:6px 12px;" +
      "font:bold 13px sans-serif;cursor:pointer;");
    b.textContent = label;
    b.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
    return b;
  }

  function render() {
    if (!body) return;
    var html = "";
    for (var i = 0; i < errors.length; i++) {
      var e = errors[i];
      html += '<div style="margin:0 0 12px;padding:8px;background:#0f0b07;border-radius:6px;border-left:3px solid #d9342b;">';
      html += '<div style="color:#ff9b8f;font-weight:bold;">' + esc(e.msg) +
        (e.count > 1 ? ' <span style="color:#caa;">×' + e.count + "</span>" : "") + "</div>";
      html += '<div style="color:#8a7a66;font-size:11px;margin:2px 0;">' + e.time + "</div>";
      if (e.stack) html += '<div style="color:#cdbfa8;font-size:12px;">' + esc(e.stack) + "</div>";
      html += "</div>";
    }
    body.innerHTML = html || '<div style="color:#8a7a66;">(暂无)</div>';
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function asText() {
    var out = "=== 阿斗游戏错误报告 ===\\n";
    out += "时间: " + new Date().toString() + "\\n";
    out += "页面: " + location.href + "\\n";
    out += "UA: " + navigator.userAgent + "\\n\\n";
    for (var i = 0; i < errors.length; i++) {
      var e = errors[i];
      out += "[" + (i + 1) + "] " + e.time + (e.count > 1 ? " (×" + e.count + ")" : "") + "\\n";
      out += e.msg + "\\n";
      if (e.stack) out += e.stack + "\\n";
      out += "\\n";
    }
    return out;
  }

  function copyAll(btn) {
    var text = asText();
    var done = function () { var t = btn.textContent; btn.textContent = "已复制!"; setTimeout(function () { btn.textContent = t; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }
  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("style", "position:fixed;left:-9999px;top:0;");
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta); done();
    } catch (err) { /* 复制失败也无所谓:文本可手动选中 */ }
  }

  function toggle() {
    ensurePanel();
    var open = panel.style.display === "flex";
    panel.style.display = open ? "none" : "flex";
    if (!open) render();
  }

  function record(msg, stack) {
    ensureIcon();
    var key = String(msg) + "||" + String(stack || "").slice(0, 200);
    for (var i = 0; i < errors.length; i++) {
      if (errors[i].key === key) { errors[i].count++; errors[i].time = ts(); refresh(); return; }
    }
    errors.push({ key: key, msg: String(msg), stack: stack ? String(stack) : "", time: ts(), count: 1 });
    if (errors.length > MAX) errors.shift();
    refresh();
  }
  function refresh() {
    ensureIcon();
    var total = 0;
    for (var i = 0; i < errors.length; i++) total += errors[i].count;
    badge.textContent = total > 99 ? "99+" : String(total);
    icon.style.display = "block";
    if (panel && panel.style.display === "flex") render();
  }

  window.addEventListener("error", function (ev) {
    // 资源加载错误(img/script onerror)没有 error 对象 —— 仍然记录但标注。
    if (ev && ev.error) record(ev.error.message || String(ev.error), ev.error.stack);
    else if (ev && ev.message) record(ev.message, (ev.filename || "") + ":" + (ev.lineno || "") + ":" + (ev.colno || ""));
  }, true);

  window.addEventListener("unhandledrejection", function (ev) {
    var r = ev ? ev.reason : null;
    if (r && r.stack) record("Unhandled Promise: " + (r.message || r), r.stack);
    else record("Unhandled Promise: " + (r && r.message ? r.message : String(r)), "");
  });

  // 渲染循环停摆看门狗:Laya 的主循环若因异常停止 requestAnimationFrame 回调,
  // 即视为"卡死"。心跳每帧刷新 lastTick;轮询发现长时间(页面可见时)无心跳即上报一次。
  var lastTick = 0, started = false, stalled = false;
  function beat() { lastTick = (window.performance && performance.now ? performance.now() : Date.now()); started = true; requestAnimationFrame(beat); }
  requestAnimationFrame(beat);
  setInterval(function () {
    if (!started) return;
    var now = (window.performance && performance.now ? performance.now() : Date.now());
    var hidden = document.hidden;
    if (!hidden && now - lastTick > 5000) {
      if (!stalled) { stalled = true; record("渲染循环停摆(疑似卡死):已 " + Math.round((now - lastTick) / 1000) + "s 无帧更新", ""); }
    } else if (now - lastTick < 1000) {
      stalled = false; // 恢复了
    }
  }, 2000);
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
        // 错误浮层要最先加载,才能捕获最早期的异常。
        '<script type="text/javascript" src="js/adou-error-hud.js"></script>',
        '    <script type="text/javascript" src="js/adou-local-bootstrap.js"></script>',
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
  writeFileSync(path.join(outDir, "js/adou-error-hud.js"), createErrorHud());
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
