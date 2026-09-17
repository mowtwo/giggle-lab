# 口袋手机(pocket-phone)

一台跑在浏览器里的手机:外面是可换主题的系统外壳,里面用 `<iframe>` 装应用,
宿主通过 postMessage 给应用提供一套"系统 API"(SDK)。

- 页面:`src/app/[locale]/pocket-phone/`
- SDK(给客体用的运行时):`public/phone-sdk.js`
- 内置应用:`public/phone-apps/<slug>/index.html`

## 分层

```
DeviceFrame            机身 + 等比缩放(屏幕内部恒为 390×844 逻辑像素)
└ 屏幕容器             主题 CSS 变量 + 壁纸挂在这里
  ├ StatusBar          挖孔 / 运营商 / 电量画法都由主题决定
  ├ 顶部下拉热区        指针拖拽 + 触控板双指下滑 → 通知栏 / 控制中心
  ├ 内容区
  │ ├ HomeScreen       小部件 + 图标网格(可翻页) + dock
  │ ├ AppWindow × N    每个已启动应用一个常驻 iframe(切后台不卸载)
  │ ├ SettingsApp      原生应用,直接改系统状态
  │ └ AppSwitcher      最近任务
  ├ NavBar             手势横条 / 三键
  ├ Shade              unified 或 split(左通知 / 右控制中心)
  └ 覆盖层             吐司、系统弹窗、权限框、锁屏
```

状态集中在 `phone-state.ts` 的 reducer 里;只有主题、深浅色、壁纸、导航方式
会写进 localStorage,其余运行时状态每次重来。

## 加一套主题

主题是纯数据。新增一套系统只需要:

1. 新建 `themes/<id>.ts`,导出一个 `PhoneTheme` 字面量;
2. 在 `themes/index.ts` 里 import 并塞进 `PHONE_THEMES`;
3. 在 `themes/types.ts` 的 `ThemeId` 联合类型里加上这个 id;
4. 在 `messages/zh.json` 与 `messages/en.json` 的 `PocketPhone.themes` 下
   补一句风格说明,壁纸名补进 `PocketPhone.wallpapers`。

组件一行都不用改。描述符里的字段分两类:

- **枚举变体**——结构上真的不一样,组件里各有一个 `switch` 分支:
  `statusBar.cutout`(island / notch / punch-hole / none)、
  `navigation.defaultMode`、`icons.shape`(squircle / rounded / circle / sticker)、
  `surfaces.shade`(unified / split)、`surfaces.dialog`、`surfaces.toast`、
  `motion.launch`、`statusBar.battery`。
  复用已有变体不用碰组件;要引入全新形态才需要加一个分支
  (转场再配一条 `globals.css` 里的 `@keyframes pocket-phone-launch-*`)。
- **标量 token**——颜色、圆角、模糊、时长、字体栈,经 `themes/tokens.ts`
  统一转成 `--ph-*` CSS 变量注入屏幕根节点,组件只读变量。

亮/暗两套调色板是必填的(`palette.light` / `palette.dark`),压在壁纸上的
图标文字颜色也要按深浅各给一个——深色壁纸配深色文字是最常见的翻车点。

现有四套:`ios`、`hyperos`、`harmonyos`、`animal-island`。最后一套是主题层的
压力测试,用的是另外三套没出现过的变体组合。

## SDK

协议的事实来源是 `protocol.ts`;`public/phone-sdk.js` 是它的运行时镜像(纯 JS,
要被静态页面直接 `<script src>`)。**改协议两边一起改,并把 `PHONE_BRIDGE_VERSION` 加一。**

### 两种装载方式

注册表 `registry.tsx` 里的 `trusted` 决定:

| | `trusted: true` | `trusted: false` |
|---|---|---|
| iframe sandbox | `allow-scripts allow-same-origin allow-forms` | `allow-scripts allow-forms` |
| 文档 origin | 同源 | `null`(opaque) |
| SDK 怎么来 | 宿主在 iframe load 后注入 `/phone-sdk.js`,应用不写一行引入 | 应用自己 `<script src="/phone-sdk.js">` |
| localStorage | 可用 | **不可用**,存档只能走 `phone.storage` |

两条路之后走的是同一套 postMessage 协议。宿主只认 `event.source`(沙箱应用的
origin 是 `"null"`,不能当凭据)。

### 应用侧的引导姿势

注入是在文档加载完之后发生的,所以不能假设 `window.phone` 一开始就在:

```js
function withPhone(run) {
  function start() {
    window.phone.ready.then(function () { run(window.phone); });
  }
  if (window.phone) { start(); return; }
  addEventListener("phone:sdkready", start, { once: true });
}

withPhone(function (phone) {
  phone.toast("你好");
  phone.on("theme.change", repaint);
});
```

握手会重试到宿主应答为止——沙箱应用的第一条 `hello` 一定早于宿主登记这个 iframe。

### 能力一览

```
system.getContext / setStatusBar / setBackHandler / keepAwake
ui.toast / haptic / dialog / requestPermission / getPermission
nav.exit / openApp / recents
notify.post / clear / setBadge
storage.get / set / remove / keys   // 按 appId 隔离,存在宿主的 localStorage
apps.list
```

事件:`theme.change`、`back`、`pause`、`resume`、`safearea.change`、`permission.change`。

`setBackHandler(true)` 之后,返回键只发 `back` 事件,不再退出应用。

## 加一个应用

1. 写 `public/phone-apps/<slug>/index.html`(自带样式与脚本);
2. 在 `registry.tsx` 的 `PHONE_APPS` 里加一项(id、`nameKey`、`url`、`trusted`、
   `slot`、底色、图标 glyph);
3. 在两份 `messages` 的 `PocketPhone.apps` 下补名字。

想让应用跟着系统换肤,就在 `theme.change` 里把 `phone.theme` 的颜色写进自己的
CSS 变量——三个内置应用都是这么做的。

## 手势层

`use-gesture.ts` 把三种输入合成同一条手势流:指针拖拽、**触控板双指滑动(wheel)**、
触屏。两个已经踩过的坑写在注释里,改动时留意:

- 不要用 `setPointerCapture`:一抢,后续 `click` 会被重定向到手势元素,
  内部按钮全点不动;
- `pointermove` / `pointerup` 必须挂在 `window` 上:只在元素上监听的话,
  指针在元素外松开就收不到,手势结束不了,那块区域之后彻底失灵。

`wheel` 没有结束事件,用空闲计时器(110ms)补;位移没超过阈值(8px)算点击。
