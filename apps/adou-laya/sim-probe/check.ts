// 确定性去风险原型 —— headless 自检(M1 的硬验收基础,见 NETPLAY.md §9 L0)。
//
// 验证联机 lockstep 的地基:把随机源换成可注入种子的 PRNG 后,
//   "同种子 ⇒ 同随机序列 ⇒ 同世界状态(逐帧哈希相等)"
// 是否成立。这里用真实的 MathE(不是另写一份),并用一个定步长玩具世界模拟,
// 证明"种子 + 定步长 ⇒ 可复现"这条确定性路径在本工程里走得通。
//
// 不依赖 Laya(只调用 MathE 的纯随机/数学方法)。由 run.mjs 用 esbuild 打包后跑。

import { MathE } from "../src/core/math-e";

let failures = 0;
function check(name: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

// FNV-1a 32bit,用于把一串数字压成一个可比较的哈希。
function hashNums(nums: number[]): number {
  let h = 0x811c9dc5;
  for (const n of nums) {
    // 量化到 1e6 精度后逐字节混入(浮点同值同结果)。
    let q = Math.round(n * 1e6) | 0;
    for (let b = 0; b < 4; b++) {
      h ^= q & 0xff;
      h = Math.imul(h, 0x01000193);
      q >>>= 8;
    }
  }
  return h >>> 0;
}

// 采集一串随机调用(覆盖 MathE 主要随机入口)。
function sampleSequence(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(MathE.rand());
    out.push(MathE.range(0, 100, true) as number);
    out.push(MathE.weightedIndex([1, 3, 3, 2]) as number);
    out.push(MathE.sample([1, 2, 3, 4, 5, 6], 3).reduce((a, b) => a + b, 0));
  }
  return out;
}

console.log("== 确定性随机自检 ==");

// 1) 同种子 ⇒ 同序列
MathE.seedRandom(12345);
const seqA = sampleSequence(2000);
MathE.seedRandom(12345);
const seqB = sampleSequence(2000);
check("同种子 ⇒ 逐项相同序列", hashNums(seqA) === hashNums(seqB), `hash=${hashNums(seqA)}`);

// 2) 异种子 ⇒ 不同序列
MathE.seedRandom(999);
const seqC = sampleSequence(2000);
check("异种子 ⇒ 不同序列", hashNums(seqA) !== hashNums(seqC));

// 3) isSeeded 状态正确
check("seedRandom 后 isSeeded=true", MathE.isSeeded === true);
MathE.clearSeedRandom();
check("clearSeedRandom 后 isSeeded=false(恢复 Math.random)", MathE.isSeeded === false);

// 4) 未注入种子 ⇒ 非确定(两次不同),确保没把单机也变成确定性
const u1 = sampleSequence(500);
const u2 = sampleSequence(500);
check("未注入种子 ⇒ 走 Math.random(两次不同)", hashNums(u1) !== hashNums(u2));

// == 定步长玩具世界:证明"种子 + 定步长 ⇒ 世界逐帧哈希可复现" ==
// 模拟一批"单位",每帧用种子随机决定移动/受击,纯逻辑、定步长。这不是真实战斗,
// 但复刻了真实战斗的确定性骨架(种子随机 + 固定 dt + 稳定遍历顺序)。
interface Unit { x: number; y: number; hp: number; }
function runWorld(seed: number, frames: number): number[] {
  MathE.seedRandom(seed);
  const units: Unit[] = [];
  for (let i = 0; i < 30; i++) units.push({ x: (MathE.range(0, 800) as number), y: (MathE.range(0, 1200) as number), hp: 100 });
  const dtFixed = 33; // 固定步长
  const frameHashes: number[] = [];
  for (let f = 0; f < frames; f++) {
    for (const u of units) {
      // 移动:朝随机方向走固定步
      const dir = MathE.range(0, 360) as number;
      u.x += Math.cos((dir * Math.PI) / 180) * 0.05 * dtFixed;
      u.y += Math.sin((dir * Math.PI) / 180) * 0.05 * dtFixed;
      // 受击:按权重随机扣血
      if ((MathE.weightedIndex([7, 3]) as number) === 1) u.hp -= MathE.range(1, 5) as number;
      if (u.hp < 0) u.hp = 100; // 复活,保持单位数稳定
    }
    const snap: number[] = [];
    for (const u of units) snap.push(u.x, u.y, u.hp);
    frameHashes.push(hashNums(snap));
  }
  MathE.clearSeedRandom();
  return frameHashes;
}

console.log("== 定步长世界可复现自检 ==");
const w1 = runWorld(0xC0FFEE, 600);
const w2 = runWorld(0xC0FFEE, 600);
let allEqual = w1.length === w2.length;
let firstDiff = -1;
for (let i = 0; i < w1.length; i++) if (w1[i] !== w2[i]) { allEqual = false; firstDiff = i; break; }
check("同种子两次模拟 ⇒ 每一帧世界哈希都相等", allEqual, firstDiff >= 0 ? `首个分歧帧=${firstDiff}` : `共 ${w1.length} 帧全等`);
const w3 = runWorld(0xBADBAD, 600);
check("异种子 ⇒ 世界轨迹不同", w1[w1.length - 1] !== w3[w3.length - 1]);

console.log(failures === 0 ? "\n全部通过 ✅ 确定性地基成立" : `\n${failures} 项失败 ❌`);
// @ts-expect-error node 环境
if (typeof process !== "undefined") process.exit(failures === 0 ? 0 : 1);
