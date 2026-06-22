# 《赵云与阿斗》扩展开发指南

> 本文基于对反编译重写后整套战斗系统的审计整理。目标:让后续新增**武器 / 技能 /
> 武将 / boss / 关卡 / 小兵**有章可循,并为**无尽模式 / 联网对抗 / 动态资源 / 皮肤**
> 等大型玩法预留架构思路。**每节都标注需要的非代码资源(图片 / Spine / 音频 /
> 数据),方便用 codex 等工具准备素材。**

---

## 0. 整体架构(扩展前必读)

- **单例管理器**:`class X extends Singleton` + `X.instance()`。中枢是 `GameMgr`
  (`src/core/game-mgr.ts`),持有 `player`(SaveMgr 存档)、`props`(PropsMgr)、
  `rank`、`map`(MapMgr)、`weaponData`、`generals` 等;战斗期有 `BattleMgr`、
  `EnemySpatialMgr`、`EntityRegistry`、`BoardMgr`、`BattlePropsMgr`、`BuffMgr` 等。
- **工厂 + id 注册**:`EnemyFactory` / `WeaponFactory` / `PropsFactory` /
  `PrefabFactory` / `HitStrategyFactory` / `BulletFactory` 等。注册写在模块**顶层**:
  `SomeFactory.instance().register(id, () => Laya.Pool.createByClass(Cls))`。
  **这些注册靠 `src/Main.ts` 的 side-effect import 触发**——新增类的模块若没被
  Main.ts(直接或间接)import,注册不会执行,运行时会报"未为类型 X 注册创建器"。
- **数据驱动**:数值/文本多来自 `vendor/original/game/data/*.json`(weapon.json /
  weaponTxt.json / rank.json)与代码常量表(`PropsMgr.Ue`、`MapMgr.MAP*`、
  `GeneralMgr`、`game-config.ts`)。
- **场景/对话框**:`@regClass("uuid")` 把 `.ls`/`.lh` 资源绑定到 TS 类。
- **帧循环/事件**:`UpdateMgr.instance().register(name, this, this.update)` /
  `EventMgr.instance.on/event`。
- **资源根**:源头改 **`vendor/original/game/resources/`**;`public/adou-laya/` 是
  构建产物(每次 build 从 vendor 覆盖,**不要直接改 public**)。
- **构建**:`pnpm build:adou:rebuilt`(产出带 `?v=<size>` 版本号,避免缓存)。

### ⚠️ 两条反复踩到的坑(新增代码务必遵守)
1. **de-mangle 名字要一致**:跨类调用 `someAny.method()` 时,因对象多为 `any`,
   TS 编译器抓不到名字不匹配,只有运行到那条路径才崩("x is not a function")。
   新增方法/字段名要和调用处完全一致。
2. **别在模块顶层用 `const X = SomeMgr` 别名**:模块循环求值时会被捕获为
   `undefined`,运行时 `X.instance()` 崩。**方法体内直接用类名**(如
   `EnemySpatialMgr.instance()`)。
3. **工厂注册用箭头函数**才会进对象池:`register(id, () => Laya.Pool.createByClass(Cls))`。
   直接传类(`register(id, Cls)`)会绕过池化(弓系武器目前就是这样,属遗留)。

---

## 1. 武器

**代码**
- `vendor/.../data/weapon.json` 加一行(`id` / `type` 0-3 / `rarity` 0-4 / `txt` /
  `intro` / `fragmentNum` / `addAttPower` …)。`weaponTxt.json` 加对应文案。
- 对应 `src/battle/weapon-{bow|knife|pike|cavalry}.ts` 加一个 `WeaponComponent` 子类。
- `WeaponFactory.instance().register(type, id, () => Laya.Pool.createByClass(Cls))`。
- 确认该 `weapon-*.ts` 被 `Main.ts` import(现有 4 个已 import)。

**资源**(每把武器约 1–2 张图,均进图集)
- 展示图:`resources/img/weapon/weapon_<id>.png`(背包/匹配界面显示)。
- 子弹/特效图(远程武器):`resources/img/weapon/`(图集 `AutoAtlas`)。
- 稀有度框复用现成 `resources/img/weaponBag/rarity<0-4>.png`。
- **无 Spine**(武器的挥舞动画由持有它的武将 Spine 表现)。
- 注意:`img/weapon` 是 `AutoAtlas` 图集,新增图需用 LayaIDE 重打图集,或临时放松散
  PNG 并保持引用路径一致。

**难度**:低。纯图标 + json,逻辑可仿现有武器子类。

---

## 2. 技能(道具 / props)

**代码**
- `src/data/props-mgr.ts` 的 `Ue` 数组加一个 `PropDef`(`name` 英文键 / `txt` 中文 /
  `intro` / `Fe` 价格 / `cd`(**-1=被动,≥0=主动**)/ `rarity` / 掉落权重 `Oe`/`Ye`;
  可升级再加 `Xe`/`Ge`/`He`/`We`)。
- `src/battle/props.ts` 加一个 `Prop` 子类,覆盖 `Nv`(或 `tk`)实现效果。
- `PropsFactory.instance().register(<id>, () => Laya.Pool.createByClass(Cls))`。

**资源**(每个技能 1–3 张松散图)
- 图标:`resources/img/props/<name>_1.png`。可升级技能再加 `_2.png`/`_3.png`。
- 技能背包/商店里的稀有度底框复用 `resources/img/shop/itemBg{0|1}_<rarity>.png`。

**注意**
- 战斗技能栏只有 **2 个主动槽 + 6 个被动槽**(改造后的硬上限);技能背包会自动按
  主动/被动分区展示新技能(`skill-bag-dialog.ts` 自动遍历 `Ue`,只跳过 0/1/23)。
- id 0/1/23(铲子/推土车/行军丹)是特殊道具,已被刻意排除。

**难度**:低。

---

## 3. 武将

**代码**
- `src/battle/general-types.ts` 加 `General` 子类;`GeneralFactory`(文件内 `de`)
  `register(<索引>, Cls)`。
- `src/data/general-mgr.ts` 补数据:名字、对应武器 id、家族名、合并候选、数值等表。
- 确认 `general-types.ts` 被 Main.ts import(已 import)。

**资源**(较重)
- **Spine 骨骼动画**:`resources/anim/<name>/`,含 `skeleton.json` + `skeleton.atlas`
  + 贴图 PNG(图集)。需要 idle / attack 等动作。
- 在 `src/core/preload-mgr.ts` 的预加载列表登记 `skeleton.json`。

**注意**:Spine 资源需骨骼工具制作,**codex 不易直接生成**;建议基于现有武将
Spine 改造,或保证 `.atlas` 坐标与贴图严格对应(否则动画错位)。

**难度**:高(因 Spine)。

---

## 4. Boss

**代码**
- `src/battle/enemy-bosses.ts` 加 `Boss` 子类:技能逻辑在 `oP`,动画 id/播放在
  `CP`/`FP`,继承 boss 基类。
- `EnemyFactory.instance().register("<BossName>", () => Laya.Pool.createByClass(Cls))`,
  并把名字加入 `EnemyTypes.ug`(boss 名单)。
- 配置该 boss 在哪些波次/难度出现(对照现有 boss 的出现逻辑)。
- `enemy-bosses.ts` 已被 Main.ts import。

**资源**(较重)
- **Spine 动画**:`resources/anim/<boss>/`(skeleton.json + atlas + png),含技能动作。
- 预加载登记同上。

**难度**:高(Spine + 技能逻辑)。

---

## 5. 关卡(地图)

**代码**
- `src/data/map-id.ts` 的 `MapId` 枚举加一项。
- `src/battle/map-mgr.ts` 加 `MAP<n>`:8×10 网格(元素 `"类型_皮肤"`)+ 锚点
  (`te`/`se`/`ie`/`ee`/`ae` 起终点)+ 检查点 `ne`;敌我路径由内置 A* 自动算。
- 自选地图已支持:把新地图中文名加进 `src/scenes/main-scene.ts` 的
  `createMapSelector` 里 `maps` 数组(现为 `["巨鹿","云梦泽","虎牢关","赤壁"]`),
  `SaveMgr.selectedMapId` 的范围与 `clampMap`/`GameMgr.mapIndexForDay` 的 0-3 上限
  也要相应放宽。
- `rank.json` 的 `map` 字段(可选,影响段位默认地图)。

**资源**(每个关卡多张图)
- 背景视差层:`resources/img/map/mapBg/mapBg<n>/`(`MapBg` 组件用,多层 PNG)。
- 大背景:`resources/img/map/mapBg_<n>.png`、`bg_<n>.png`。
- 地块皮肤:`resources/img/map/space_<n>.png`、刷新区 `refresh_<n>_{0,1}.png`、
  标题 `mapBg/mapBg<n>/title.png`。
- 背景音乐(可选):`resources/music/`。

**注意**:网格约定 8×10(改尺寸要同步渲染逻辑);路径锚点要落在可通行格,否则 A*
找不到路。

**难度**:中(多图 + 网格设计,但无 Spine,codex 可生成背景/地块图)。

---

## 6. 小兵(mob)

**代码**
- `src/battle/enemy-mobs.ts` 加 `Mob` 子类;`EnemyFactory.register("Mob<N>", …)`,
  名字加入 `EnemyTypes.lg`(小兵名单)。
- 出兵配置:`enemy` 数据(波次数量 `nh` / 出兵表 `wh` / 权重 `mh`)。
- `enemy-mobs.ts` 已被 Main.ts import。

**资源**(每个 1–几张图)
- 帧图:`resources/img/gameObject/enemy/mob_<n>.png`(图集 `gameObject/AutoAtlas`)。
- 简单小兵用帧图即可;复杂小兵可走 Spine(像 boss)。

**难度**:中。

---

## 7. 资源量速查表(给 codex 备素材参考)

| 内容 | 图片(可由 codex 生成) | Spine 动画(需骨骼工具,codex 难) | 数据 |
|------|------|------|------|
| 武器 | 1–2 张(图集) | 无 | weapon.json 行 |
| 技能 | 1–3 张(松散 PNG) | 无 | PropsMgr.Ue 表 |
| 小兵 | 1–几张(图集) | 可选 | enemy 出兵表 |
| 关卡 | 多张(背景+地块+标题) | 背景视差(可用静态层近似) | MAP<n> 网格(代码) |
| 武将 | 头像 | **是(idle/attack…)** | GeneralMgr 表 |
| Boss | — | **是(技能动作)** | boss 数值+出现配置 |

> 经验:**武器 / 技能 / 关卡 / 小兵** 主要是位图 + 数据,适合用 codex 批量出图;
> **武将 / Boss** 依赖 Spine 骨骼动画,建议复用或改造现有骨骼,纯生成新骨骼成本高。

---

## 8. 大型玩法的架构建议

### A. 无尽模式
- 规则集中在 `BattleMgr`(波次状态机 `uX`/`fX`/`yX`)+ `BattleState`(`ci` 波数上限、
  `Li`/`Si` 双方生命)+ `game-config.ts`/`PropsMgr` 数值表。
- 改造点:波数无限递增、难度随波 scaling、敌人上限(已有 `ENEMY_LIMIT`)、奖励曲线。
- 建议:加一个 `GameMgr.gameMode` 标志,`BattleMgr` 内按模式分支(或子类
  `EndlessBattleMgr`),**不要直接改经典模式的波次逻辑**。难度曲线集中在配置表,便于调参。
- 资源:基本复用;如需无尽专属 UI/背景另出图。

### B. 真实联网对抗
- **现状**:`ServerReportMgr`(`src/battle/server-report-mgr.ts`,别名 `st`)就是联网
  接口(登录 / 对局开始结束 / 排行,走 `Laya.HttpRequest`),但其 `path=""`(无后端),
  且被 `public/adou-laya/js/adou-local-bootstrap.js` 这层垫片 hook `XMLHttpRequest`/
  `fetch` **拦截成本地假数据**(纯单机)。
- **联网改造路径**:
  1. 给 `ServerReportMgr` 配置真实服务器地址(现在 `path` 恒空;改成从配置/启动参数
     读 base url)。
  2. 让 `adou-local-bootstrap.js` 在联网模式下**不拦截**(或只在请求失败时兜底),
     由 `sync-adou-original.mjs` 按构建模式生成不同 bootstrap。
  3. 实时对抗需要**新增网络层**:目前只有 HTTP 上报,做实时对战要上 WebSocket +
     状态/操作同步协议(建议抽一个 `NetworkMgr` 统一连接/收发,`ServerReportMgr` 改
     走它)。
- **客户端只做基础逻辑 + 兜底**(你的设想):核心引擎(Laya)、基础玩法规则、UI 兜底
  本地内置;**关卡/武将/技能等内容数据与资源从服务器拉**。这与现有"工厂 + id 注册 +
  数据表"架构天然契合——服务器下发数据,运行时 `register`/填表即可扩展内容。

### C. 动态资源 / 脚本(从服务器拉取)
- **资源**:Laya 支持远程根路径——`js/index.js` 的引导 config 里 `pkgs[].remoteUrl`
  / `Laya.URL.basePath` 可指向服务器;`Laya.loader.load(远程url)` 动态加载图集/Spine/
  json。**协议化资源**:定义一个清单格式(json 描述 + 资源 url + 类型),客户端写一个
  加载器解析后调 `Laya.loader`。
- **脚本**:可加载远程 JS(`<script>` 注入或 `fetch`+`Function`)。**安全提醒**:执行
  远程任意代码风险高。更稳的做法是**协议化而非任意脚本**——服务器只下发"数据 + 受限
  规则描述"(如技能的数值/触发条件用 DSL/JSON 表达),客户端用内置解释器执行;真要跑
  远程代码,务必限定受信服务器 + 沙箱。
- 与现有架构契合度:**数据驱动的内容(武器/技能/小兵/关卡数值)非常适合动态下发**;
  **依赖 Spine/自定义类逻辑的内容(武将/boss 特殊技能)难纯数据化**,需要约定能力边界。

### D. 皮肤系统(单机)
- 皮肤 = 一套替换资源(图集/Spine 贴图)。
- 机制建议:`皮肤id → 资源路径前缀`映射;加载时按当前皮肤拼路径走 `Laya.loader`;
  选中皮肤存 `SaveMgr`(仿照新加的 `selectedMapId` 写一个 `selectedSkinId`)。
- **注意**:皮肤贴图的**尺寸 / 图集坐标 / Spine atlas 必须与原版一致**,否则 UI 错位、
  动画跑偏。Spine 可用其原生 skin 机制做换肤。
- 资源:每套皮肤 = 一整套对应图集/Spine,体量大。

---

## 9. 通用 checklist(每次扩展后)

- [ ] 资源放到 `vendor/original/game/resources/` 源头(不是 public)。
- [ ] 新类的模块被 `src/Main.ts`(直接或间接)import,确保工厂注册执行。
- [ ] 跨类调用的方法/字段名与定义一致(避免 `any` 漏检导致运行时崩)。
- [ ] 方法体内用类名直接调,别在模块顶层 `const X = Mgr` 别名(循环依赖会变 undefined)。
- [ ] `pnpm typecheck:adou` + `pnpm lint` + `pnpm build:adou:rebuilt` 通过。
- [ ] 真机/浏览器实玩走到新内容的触发路径验证(自动化只能覆盖部分)。
