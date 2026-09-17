/*!
 * 口袋手机 SDK —— 跑在 iframe 里的 App 用它跟手机壳说话。
 *
 * 两种到达方式,最终暴露的东西完全一样:
 *   1. 可信应用:宿主在 iframe 加载完后把这个脚本注入进来,App 一行引入都不用写;
 *   2. 沙箱应用:App 自己 <script src="/phone-sdk.js"></script>。
 *
 * 因为注入是在文档加载之后发生的,App 不能假设 `window.phone` 一开始就在。
 * 统一的等待姿势:
 *
 *   function withPhone(run) {
 *     if (window.phone) { window.phone.ready.then(run); return; }
 *     addEventListener("phone:sdkready", function () { window.phone.ready.then(run); }, { once: true });
 *   }
 *   withPhone(function (ctx) { ... });
 *
 * 协议定义见 src/app/[locale]/pocket-phone/protocol.ts,改动要两边一起改。
 */
(function () {
  "use strict";

  var TAG = "giggle-phone";
  var VERSION = 1;

  if (window.phone && window.phone.__tag === TAG) {
    return;
  }
  if (window.parent === window) {
    // 不在 iframe 里,没有宿主可说话。
    return;
  }

  var host = window.parent;
  // 握手之前不知道宿主 origin;拿到 ready 之后就钉死,不再广播。
  var hostOrigin = "*";

  var seq = 0;
  var pending = Object.create(null);
  var listeners = Object.create(null);
  var readyResolve;
  var readyReject;
  var readyPromise = new Promise(function (resolve, reject) {
    readyResolve = resolve;
    readyReject = reject;
  });
  var settled = false;

  function send(message) {
    try {
      host.postMessage(message, hostOrigin);
    } catch {
      /* 宿主没了 */
    }
  }

  function invoke(method, params) {
    seq += 1;
    var id = "c" + seq;
    return new Promise(function (resolve, reject) {
      pending[id] = { resolve: resolve, reject: reject };
      send({ tag: TAG, v: VERSION, kind: "invoke", id: id, method: method, params: params || {} });
    });
  }

  function emit(name, payload) {
    var handlers = listeners[name];
    if (!handlers) {
      return;
    }
    for (var i = 0; i < handlers.length; i += 1) {
      try {
        handlers[i](payload);
      } catch (error) {
        if (window.console) {
          window.console.error("[phone-sdk] listener failed for " + name, error);
        }
      }
    }
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.tag !== TAG || data.v !== VERSION) {
      return;
    }
    // 只认宿主窗口发来的消息。
    if (event.source !== host) {
      return;
    }

    if (data.kind === "ready") {
      if (event.origin && event.origin !== "null") {
        hostOrigin = event.origin;
      }
      phone.context = data.context;
      phone.theme = data.context.theme;
      phone.safeArea = data.context.safeArea;
      phone.appId = data.context.appId;
      if (!settled) {
        settled = true;
        readyResolve(data.context);
        window.dispatchEvent(
          new CustomEvent("phone:ready", { detail: data.context }),
        );
      }
      return;
    }

    if (data.kind === "reply") {
      var slot = pending[data.id];
      if (!slot) {
        return;
      }
      delete pending[data.id];
      if (data.ok) {
        slot.resolve(data.data);
      } else {
        var error = new Error((data.error && data.error.message) || "bridge error");
        error.code = (data.error && data.error.code) || "E_UNKNOWN";
        slot.reject(error);
      }
      return;
    }

    if (data.kind === "event") {
      if (data.name === "theme.change") {
        phone.theme = data.payload;
        if (phone.context) {
          phone.context.theme = data.payload;
        }
      }
      if (data.name === "safearea.change") {
        phone.safeArea = data.payload;
        if (phone.context) {
          phone.context.safeArea = data.payload;
        }
      }
      emit(data.name, data.payload);
    }
  });

  var phone = {
    __tag: TAG,
    version: VERSION,
    /** 握手完成后 resolve 成 SdkContext。 */
    ready: readyPromise,
    context: null,
    theme: null,
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    appId: null,

    /** 底层调用;方法名见协议文件。 */
    invoke: invoke,

    on: function (name, handler) {
      (listeners[name] || (listeners[name] = [])).push(handler);
      return function () {
        phone.off(name, handler);
      };
    },
    off: function (name, handler) {
      var handlers = listeners[name];
      if (!handlers) {
        return;
      }
      var index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    },

    /* ---------------------------------------------------------- 系统 */
    getContext: function () {
      return invoke("system.getContext");
    },
    setStatusBar: function (options) {
      return invoke("system.setStatusBar", options || {});
    },
    setBackHandler: function (enabled) {
      return invoke("system.setBackHandler", { enabled: enabled !== false });
    },
    keepAwake: function (enabled) {
      return invoke("system.keepAwake", { enabled: enabled !== false });
    },

    /* ---------------------------------------------------------- 界面 */
    toast: function (text, options) {
      var params = typeof text === "string" ? { text: text } : text || {};
      if (options) {
        if (options.duration) params.duration = options.duration;
        if (options.icon) params.icon = options.icon;
      }
      return invoke("ui.toast", params);
    },
    haptic: function (pattern) {
      return invoke("ui.haptic", { pattern: pattern || "light" });
    },
    dialog: function (options) {
      return invoke("ui.dialog", options || {}).then(function (result) {
        return result.index;
      });
    },
    requestPermission: function (kind, reason) {
      return invoke("ui.requestPermission", { kind: kind, reason: reason }).then(
        function (result) {
          return result.state;
        },
      );
    },
    getPermission: function (kind) {
      return invoke("ui.getPermission", { kind: kind }).then(function (result) {
        return result.state;
      });
    },

    /* ---------------------------------------------------------- 导航 */
    exit: function () {
      return invoke("nav.exit");
    },
    openApp: function (appId) {
      return invoke("nav.openApp", { appId: appId });
    },
    recents: function () {
      return invoke("nav.recents");
    },

    /* ---------------------------------------------------------- 通知 */
    notify: {
      post: function (options) {
        return invoke("notify.post", options || {});
      },
      clear: function (tag) {
        return invoke("notify.clear", { tag: tag });
      },
      setBadge: function (count) {
        return invoke("notify.setBadge", { count: count });
      },
    },

    /* ---------------------------------------------------------- 存储 */
    storage: {
      get: function (key) {
        return invoke("storage.get", { key: key }).then(function (result) {
          return result.value;
        });
      },
      set: function (key, value) {
        return invoke("storage.set", { key: key, value: value });
      },
      remove: function (key) {
        return invoke("storage.remove", { key: key });
      },
      keys: function () {
        return invoke("storage.keys").then(function (result) {
          return result.keys;
        });
      },
    },

    /* ---------------------------------------------------------- 其它 App */
    apps: {
      list: function () {
        return invoke("apps.list").then(function (result) {
          return result.apps;
        });
      },
    },
  };

  window.phone = phone;
  window.PhoneSDK = phone;

  // 握手。宿主收到后回 ready + 上下文。
  //
  // 沙箱应用的这条 hello 会在 iframe 的 load 事件之前发出去,而宿主是在 load
  // 之后才认下这个 window 的,第一条必然被丢。所以要重试,直到 ready 到达。
  var handshakeTimer = window.setInterval(function () {
    if (settled) {
      window.clearInterval(handshakeTimer);
      return;
    }
    send({ tag: TAG, v: VERSION, kind: "hello" });
  }, 120);
  send({ tag: TAG, v: VERSION, kind: "hello" });

  // 宿主一直不回话就别让 App 傻等。
  window.setTimeout(function () {
    window.clearInterval(handshakeTimer);
    if (!settled) {
      settled = true;
      readyReject(new Error("phone host did not answer"));
    }
  }, 8000);
  // 避免未处理的 rejection 警告(App 自己 catch 才是正经处理)。
  readyPromise.catch(function () {});

  // 注入模式下 App 早就跑完了,靠这个事件回头接上。
  window.dispatchEvent(new CustomEvent("phone:sdkready", { detail: phone }));
})();
