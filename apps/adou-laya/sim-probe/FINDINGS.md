# 联机确定性 —— 去风险原型结论(M1 可行性)

> 目的:在投入"重写战斗为确定性核心"(NETPLAY.md M1,周级别工作量)之前,先证明
> 这条路在本工程**走得通**,并量化真实工作量。

## 1. 已验证:确定性地基成立 ✅

- `MathE` 加了可注入种子的 PRNG(mulberry32):默认 `Math.random`(单机手感不变),
  注入 `MathE.seedRandom(seed)` 后所有随机可复现;`MathE.rand()` 为统一随机源。
- headless 自检(`pnpm -C apps/adou-laya probe:determinism`,或 `node sim-probe/run.mjs`)全绿:
  - 同种子 ⇒ 逐项相同随机序列;异种子 ⇒ 不同。
  - **定步长玩具世界 600 帧,两次同种子模拟逐帧状态哈希完全相等**;异种子轨迹不同。
- 结论:**"种子 + 定步长 + 稳定遍历顺序 ⇒ 世界状态逐帧可复现"在本工程成立**。这是
  公平实时 lockstep 的硬地基,现已落定。

## 2. 量化:M1 把真实战斗确定性化的工作面(可行、机械、但量大)

扫描 `src/battle/*.ts` 得到需要改造的耦合点:

| 耦合点 | 数量 | M1 处理方式 |
|---|---|---|
| 直接 `Math.random`(MathE 之外) | 43 处 / 17 文件 | 收编为 `MathE.rand()`(机械) |
| `Date.now()` 用于逻辑计时 | 9 处 / 4 文件 | **换逻辑时钟**;重点:`BattleMgr.pX` 用 `Date.now()` 做攻击冷却,必须改 |
| 动画 `Laya.Event.STOPPED` 驱动战斗状态 | 24 处 | 改为 Sim 逻辑帧计时(如"动画剩余帧") |
| `Laya.timer.once/loop` 驱动逻辑 | 71 处 | 逻辑相关的改逻辑帧;纯表现的保留 |
| tween `.then/.onStart` 回调 | ~147 处 | 区分:驱动 Bw/mL/hp/changeState 的改 Sim;纯视觉的保留为表现层 |

关键确定性阻断点(必须改,否则两端必然分歧):
1. `BattleMgr.pX` 的攻击节奏基于 `Date.now()`(真实时钟)→ 必须基于逻辑帧。
2. `Bw`(可被瞄准)、`mL`(可行动)由 tween/STOPPED 按真实时间翻转 → 必须由 Sim 逻辑帧计时
   (上一轮加的 Bw/mL 看门狗届时由确定性计时取代)。
3. 17 个文件里的直接 `Math.random` → 全部走 `MathE.rand()`。
4. tween 驱动的击飞/冻结/出场位移影响判定坐标 → 位移要由 Sim 算,tween 仅插值表现。

## 3. 风险评估

- **可行性**:高。耦合点是**可枚举、模式化、集中在已知文件**的,没有发现"原理上无法确定性化"
  的死结(无多线程、JS 单线程、Map 按插入序遍历、浮点双端同引擎一致)。
- **主要成本**:把"tween/动画事件驱动状态"翻译为"Sim 逻辑帧计时" —— 量大但机械,可逐子系统
  推进(敌人 → 士兵 → 将领/武器 → 技能/buff/道具),每步用第 1 节的 headless 哈希自检守住不回归。
- **建议**:M1 分阶段,每阶段产出一个可 headless 跑、可哈希自检的子系统;全部子系统接入后,
  用"同种子同输入 ⇒ 整局逐帧哈希相等"做总验收,再进入 M2(NetMgr/lockstep)。

## 4. 怎么跑自检

```
pnpm -C apps/adou-laya probe:determinism
# 或
node apps/adou-laya/sim-probe/run.mjs
```
（`sim-probe/check.ts` 用真实 `MathE`;`run.mjs` 用 esbuild 内存打包后在 node 跑,不需浏览器。）
