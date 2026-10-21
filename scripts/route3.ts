/**
 * 第三区（21F–30F）可通关性：以第二区路线终局（docs/zone2-end.json，由 `M_END=docs/zone2-end.json npm run route2` 生成）为起点，
 * 按攻略的流程在真实引擎上执行（scripts/planner.ts）。第三区是剧情区：没有宝石，主要是 23F 隐形迷宫（纯净版：全部撞出后
 * 29F 小偷才打通暗道）、29F 暗道、30F 六只史莱姆机关门。
 * 输出 docs/zone3-route.txt 与 docs/zone3-end.json（第四区起点）。运行：npm run route3
 */
import fs from 'node:fs';
import { Planner } from './planner';
import type { SaveData } from '../src/game/state';

const save = JSON.parse(fs.readFileSync(process.env.Z3_FROM ?? 'docs/zone2-end.json', 'utf8')) as SaveData;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const pl = new Planner(save, {
  floors: range(1, 31),
  keyV: { yellow: 30, blue: 150, red: 400 },
  goldV: 0.5, gemMin: 50, toolV: 100,
  holdFloors: range(1, 20), // 第一、二区剩下的怪留给幸运金币
  safety: 1,
});
const g = pl.g;
const P = (x: number, y: number) => ({ x, y });
let ok = true;
const step = async (r: Promise<boolean> | boolean) => { if (ok && !(await r)) ok = false; };

pl.snapshot('起点（第二区路线终局，20F 吸血鬼已击败）');
await step(pl.reach(23, P(0, 1), '上楼到 23F'));
// 23F 隐形迷宫：把 43 堵看不见的墙全部撞出来（每次走到最近的一堵旁边去撞）
for (let i = 0; ok && i < 60; i++) {
  const left: Array<{ x: number; y: number }> = [];
  g.floors[23].forEach((r, y) => r.forEach((c, x) => { if (c.terrain === 'mazeWall') left.push({ x, y }); }));
  if (!left.length) break;
  const nodes = pl.search();
  let best: { k: number; to: { x: number; y: number } } | null = null;
  for (const w of left) for (const d of [P(0, 1), P(0, -1), P(1, 0), P(-1, 0)]) {
    const k = pl.key(23, P(w.x + d.x, w.y + d.y));
    const n = nodes.get(k);
    if (n && (!best || n.dist < nodes.get(best.k)!.dist)) best = { k, to: w };
  }
  if (!best) { pl.fail(`23F 还剩 ${left.length} 堵隐形墙够不着`); ok = false; break; }
  await step(pl.bump(23, best.to, `23F 撞出隐形墙 (${best.to.x},${best.to.y})`));
}
pl.note(`  23F 隐形墙计数 flags.maze23 = ${g.flags.maze23}`);
await step(pl.bump(23, P(10, 10), '23F 老人'));
await step(pl.collect('沿途', 50));
await step(pl.bump(29, P(5, 1), '29F 小偷（暗道完成）'));
await step(pl.collect('30F 史莱姆', 20, (f) => f === 30));
await step(pl.reach(31, P(5, 1), '上楼到 31F'));
const end = pl.snapshot('第三区结束（到达 31F）');
const pass = ok && g.floorId === 31 && !!g.flags.thief29 && !!g.flags.door30;
pl.note(pass ? '✅ 第三区真实引擎执行通过' : '❌ 第三区未通过');
fs.writeFileSync('docs/zone3-route.txt', `第三区通关路线（scripts/route3.ts，真实引擎执行）\n\n${pl.log.join('\n')}\n`);
if (pass) fs.writeFileSync('docs/zone3-end.json', JSON.stringify(g.serialize()));
console.log(pl.log.join('\n'));
console.log(end);
process.exitCode = pass ? 0 : 1;
