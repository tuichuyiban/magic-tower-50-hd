/**
 * 第四区通关（对照 W1 + h5）：
 * 32 伏击 → 祭坛 → 33 骑士剑 → 攒金买生命 → 取蓝钥匙
 * → 2F 卫兵+小偷开暗道 → 35 绕龙 → 38 盾 → 39 瞬移 → 40 → 41
 */
import fs from 'node:fs';
import { forecastBattle } from '../src/game/combat';
import { altarPrice } from '../src/game/scriptlib';
import type { SaveData } from '../src/game/state';
import { FLOORS } from '../src/game/floors';
import { Planner } from './planner';

const env = (k: string, d: number) => Number(process.env[k] ?? d);
const save = JSON.parse(fs.readFileSync(process.env.R_START ?? 'docs/zone3-end.json', 'utf8')) as SaveData;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const PUZZLE_BAD = ['1,1', '5,1', '1,3', '3,3', '1,5', '3,5', '5,5'];
const TRAP33 = [{ x: 8, y: 4 }, { x: 10, y: 4 }, { x: 8, y: 6 }, { x: 10, y: 6 }];
const flags0: Record<string, unknown> = { saveBlue: true };
const pl = new Planner(save, {
  floors: range(1, 40),
  keyV: { yellow: env('R_KY', 40), blue: env('R_KB', 220), red: env('R_KR', 500) },
  goldV: env('R_GOLD', 1.1), gemMin: env('R_GEM', 55), toolV: 400,
  holdFloors: [],
  safety: 1, valueFloors: range(31, 40),
  cap: env('R_CAP', 2000), gemScale: 0.5, maxFrac: env('R_FRAC', 0.55),
  forbidDoor: (f, p) => {
    if (f === 39 && PUZZLE_BAD.includes(`${p.x},${p.y}`)) return true;
    // 保住蓝钥匙直到 2F 小偷完成
    if (flags0.saveBlue) {
      const d = pl.g.cell(p, f)?.door;
      if (d === 'blue') return true;
    }
    return false;
  },
  avoidMonster: (f, _p, m) => m === 'magicDragon' || m === 'blackMagician' || (f === 40 && !flags0.fly40),
});
const g = pl.g;
const P = (x: number, y: number) => ({ x, y });
let ok = true;
const step = async (r: Promise<boolean> | boolean) => { if (ok && !(await r)) ok = false; return ok; };

async function buy(pick: 0 | 1 | 2): Promise<boolean> {
  const t = Number(g.flags.altarTimes ?? 0);
  if (g.hero.gold < altarPrice(t)) return false;
  return pl.altar(32, P(9, 9), [pick]);
}
async function farm(label: string, n = 20, floors?: (f: number) => boolean): Promise<void> {
  for (let i = 0; i < n && ok; i++) {
    const n0 = pl.log.length;
    await pl.collect(label, 1, floors);
    if (pl.log.length === n0) break;
  }
}
async function potions(max = 15): Promise<void> {
  const prev = pl.opts.maxFrac;
  pl.opts.maxFrac = 0.98;
  for (let i = 0; i < max && ok; i++) {
    const nodes = pl.search();
    let best: { f: number; x: number; y: number; dmg: number } | null = null;
    for (const [, n] of nodes) {
      const c = g.cell(n.p, n.f);
      if ((c?.item === 'redPotion' || c?.item === 'bluePotion') && n.dmg < g.hero.hp) {
        if (!best || n.dmg < best.dmg) best = { f: n.f, x: n.p.x, y: n.p.y, dmg: n.dmg };
      }
    }
    if (!best) break;
    await pl.reach(best.f, P(best.x, best.y), '血瓶');
  }
  pl.opts.maxFrac = prev;
}
async function buyUntil(pick: 0 | 1, pred: () => boolean, max = 10): Promise<void> {
  for (let i = 0; i < max && ok && !pred(); i++) {
    if (await buy(pick)) continue;
    const prev = pl.opts.maxFrac;
    pl.opts.maxFrac = Math.min(0.95, 0.35 + i * 0.08);
    await farm(`祭坛金${i}`, 30);
    pl.opts.maxFrac = prev;
    await potions(6);
    if (!(await buy(pick))) break;
  }
}
function drain33(): number {
  let t = 0;
  for (const id of ['ghostSkeleton', 'ghostSkeleton', 'soldier', 'soldier'] as const) {
    const d = forecastBattle(g.hero, g.monsterDef(id)).damage;
    t += Number.isFinite(d) ? d : 5000;
  }
  return t;
}

pl.snapshot('起点');
await step(pl.reach(32, P(5, 9), '32F 伏击'));
await buy(1);
await farm('攒', 55);
for (let i = 0; i < 20 && ok; i++) {
  const need = drain33() + 200;
  if (g.hero.atk >= 95 && g.hero.hp >= need) break;
  if (g.hero.atk < 95 && (await buy(1))) continue;
  if (g.hero.hp < need && (await buy(0))) continue;
  await farm('再攒', 12);
  if (!(await buy(0)) && !(await buy(1))) break;
}
if (g.hero.hp < drain33() + 100) { pl.note(`✗ 进走廊生命不足 ${g.hero.hp}`); ok = false; }
pl.snapshot('进走廊前');

pl.note('■ 取蓝钥匙（走廊前，保留黄钥匙）');
if (ok && g.hero.keys.blue < 1) {
  for (const [f, x, y] of [[31, 3, 3], [32, 10, 6], [32, 3, 7]] as const) {
    if (g.hero.keys.blue >= 1) break;
    if (g.cell(P(x, y), f)?.item !== 'blueKey') continue;
    const d = pl.probe(f, P(x, y));
    pl.note(`  试 ${f}(${x},${y}) probe=${d} 黄=${g.hero.keys.yellow}`);
    if (d !== null && d < g.hero.hp - 10) await step(pl.reach(f, P(x, y), `${f}F 蓝钥匙`));
  }
  if (g.hero.keys.blue < 1) pl.note('  （稍后重试）');
  else pl.note(`  已有蓝钥匙 ${pl.hs()}`);
}

pl.note('■ 33F 骑士剑');
if (ok && g.hero.weapon !== '骑士剑') {
  await step(pl.reach(33, P(9, 4), '踩机关'));
  const order = [...TRAP33].sort((a, b) => {
    const ma = g.cell(a, 33)?.monster, mb = g.cell(b, 33)?.monster;
    const da = ma ? forecastBattle(g.hero, g.monsterDef(ma)).damage : 0;
    const db = mb ? forecastBattle(g.hero, g.monsterDef(mb)).damage : 0;
    return (Number.isFinite(da) ? da : 9e9) - (Number.isFinite(db) ? db : 9e9);
  });
  for (const p of order) {
    if (!ok || !g.cell(p, 33)?.monster) continue;
    const need = forecastBattle(g.hero, g.monsterDef(g.cell(p, 33)!.monster!)).damage;
    if (!Number.isFinite(need) || need >= g.hero.hp - 5) { pl.note(`✗ 清怪需要 ${need}`); ok = false; break; }
    await step(pl.reach(33, p, `清 (${p.x},${p.y})`));
  }
  if (ok) await step(pl.reach(33, P(9, 9), '骑士剑'));
}
if (ok && g.hero.weapon !== '骑士剑') { pl.note('✗ 无骑士剑'); ok = false; }
pl.snapshot('骑士剑后');

pl.note('■ 剑后凑金买生命（再下 2F）');
await potions(3);
// 31–34 低伤怪凑满祭坛价再买生命
{
  const prev = pl.opts.maxFrac;
  pl.opts.maxFrac = 0.9;
  const price = () => altarPrice(Number(g.flags.altarTimes ?? 0));
  for (let i = 0; i < 80 && g.hero.gold < price() && g.hero.hp > 250; i++) {
    const nodes = pl.search();
    let best: { f: number; x: number; y: number; dmg: number; gold: number } | null = null;
    for (const [, n] of nodes) {
      if (n.f < 31 || n.f > 34) continue;
      const c = g.cell(n.p, n.f);
      if (!c?.monster) continue;
      const d = forecastBattle(g.hero, g.monsterDef(c.monster)).damage;
      if (!Number.isFinite(d) || d >= 200) continue;
      if (g.hero.hp - d < 200) continue;
      const gold = g.monsterDef(c.monster).gold;
      const score = gold - d * 0.4;
      if (!best || score > best.gold - best.dmg * 0.4) best = { f: n.f, x: n.p.x, y: n.p.y, dmg: d, gold };
    }
    if (!best) break;
    await pl.reach(best.f, P(best.x, best.y), `剑后金+${best.gold}`);
  }
  pl.opts.maxFrac = prev;
}
await buy(0);
await buy(0);
await potions(8);
pl.note(`  堆后 ${pl.hs()} 黄=${g.hero.keys.yellow} 蓝=${g.hero.keys.blue}`);

if (ok && g.hero.keys.blue < 1) {
  pl.note('■ 补取蓝钥匙');
  for (let i = 0; i < 25 && g.hero.keys.yellow < 1; i++) await farm('补黄钥', 5);
  for (const [f, x, y] of [[31, 3, 3], [32, 10, 6], [32, 3, 7]] as const) {
    if (g.hero.keys.blue >= 1) break;
    if (g.cell(P(x, y), f)?.item !== 'blueKey') continue;
    const d = pl.probe(f, P(x, y));
    if (d !== null && d < g.hero.hp - 10) await step(pl.reach(f, P(x, y), `${f}F 蓝钥匙`));
  }
  if (g.hero.keys.blue < 1) { pl.note('✗ 没有蓝钥匙'); ok = false; }
}
pl.note(`  进 2F 前 ${pl.hs()} 蓝=${g.hero.keys.blue}`);

pl.note('■ 2F 中级卫兵 → 小偷 → 35F 暗道');
if (ok && !g.flags.thief2b) {
  flags0.saveBlue = false; // 允许开 2F 蓝门
  await step(pl.reach(1, P(1, 0), '1F 楼梯旁'));
  await step(pl.reach(2, P(0, 1), '2F 从楼下进入'));
  for (const p of [P(5, 1), P(7, 1)]) {
    if (!ok || !g.cell(p, 2)?.monster) continue;
    let need = forecastBattle(g.hero, g.monsterDef('blueGuard')).damage;
    while (ok && (!Number.isFinite(need) || need >= g.hero.hp - 10)) {
      flags0.saveBlue = true;
      if (!(await buy(0))) { await farm('卫兵前', 12); if (!(await buy(0))) break; }
      flags0.saveBlue = false;
      need = forecastBattle(g.hero, g.monsterDef('blueGuard')).damage;
    }
    await step(pl.reach(2, p, `2F 中级卫兵 (${p.x},${p.y})`));
    await potions(5);
  }
  await step(pl.bump(2, P(9, 10), '2F 小偷（35F 暗道）'));
  if (!g.flags.thief2b) { pl.note('✗ 小偷未触发'); ok = false; }
  await potions(8);
}
pl.snapshot('暗道后');
if (ok && g.cell(P(3, 8), 35)?.terrain !== 'floor') { pl.note('✗ 暗道 (3,8) 未开'); ok = false; }
flags0.saveBlue = false;

pl.note('■ 35F 暗道绕龙 → 38F 骑士盾');
if (ok) {
  await step(pl.reach(2, P(0, 1), '2F 楼梯'));
  await step(pl.reach(32, P(5, 9), '回 32'));
  // 33→35 需约 5 黄钥匙 + 路伤≈400；优先捡 31F 黄钥匙，勿先 potions 耗钥
  const yTargets: Array<[number, number, number]> = [
    [31, 7, 9], [31, 8, 9], [31, 7, 10], [31, 8, 10],
    [31, 2, 0], [31, 3, 0], [31, 2, 1], [31, 3, 1],
    [33, 5, 2], [8, 4, 9], [8, 3, 10],
  ];
  for (const [f, x, y] of yTargets) {
    if (g.hero.keys.yellow >= 6) break;
    if (g.cell(P(x, y), f)?.item !== 'yellowKey') continue;
    const d = pl.probe(f, P(x, y));
    if (d !== null && d < g.hero.hp - 50) await step(pl.reach(f, P(x, y), `${f}F 黄钥`));
  }
  for (let i = 0; i < 20 && g.hero.keys.yellow < 5; i++) await farm('黄钥补', 6);
  pl.note(`  上 35 前黄钥=${g.hero.keys.yellow} ${pl.hs()}`);
  if (g.hero.keys.yellow < 5) { pl.note(`✗ 黄钥匙不足 ${g.hero.keys.yellow}<5`); ok = false; }
  // 显式打怪凑祭坛金（collect 只会捡钥匙）
  {
    const prev = pl.opts.maxFrac;
    pl.opts.maxFrac = 0.95;
    const price = () => altarPrice(Number(g.flags.altarTimes ?? 0));
    for (let i = 0; i < 80 && g.hero.gold < price() && g.hero.hp > 350; i++) {
      const nodes = pl.search();
      let best: { f: number; x: number; y: number; dmg: number; gold: number } | null = null;
      for (const [, n] of nodes) {
        if (n.f < 31 || n.f > 34) continue; // 只用四区残怪，避免误伤耗血
        const c = g.cell(n.p, n.f);
        if (!c?.monster) continue;
        const d = forecastBattle(g.hero, g.monsterDef(c.monster)).damage;
        if (!Number.isFinite(d) || d >= 120) continue;
        if (g.hero.hp - d < 350) continue;
        const gold = g.monsterDef(c.monster).gold;
        const score = (d === 0 ? 50 : 0) + gold - d * 0.3;
        const bestScore = best ? (best.dmg === 0 ? 50 : 0) + best.gold - best.dmg * 0.3 : -1e9;
        if (!best || score > bestScore) best = { f: n.f, x: n.p.x, y: n.p.y, dmg: d, gold };
      }
      if (!best) { pl.note('  （凑金：31–34 无合适怪）'); break; }
      await pl.reach(best.f, P(best.x, best.y), `凑金+${best.gold}`);
    }
    pl.opts.maxFrac = prev;
  }
  if (!(await buy(0))) pl.note(`  祭坛买生命失败 金${g.hero.gold} 价${altarPrice(Number(g.flags.altarTimes ?? 0))}`);
  else await buy(0);
  for (const [f, x, y] of yTargets) {
    if (g.hero.keys.yellow >= 5) break;
    if (g.cell(P(x, y), f)?.item !== 'yellowKey') continue;
    const d = pl.probe(f, P(x, y));
    if (d !== null && d < g.hero.hp - 50) await pl.reach(f, P(x, y), '补黄');
  }
  pl.note(`  冲 35：${pl.hs()} 黄=${g.hero.keys.yellow}`);
  if (g.hero.hp < 900) { pl.note(`✗ 冲 35 生命不足 ${g.hero.hp}`); ok = false; }
  await step(pl.reach(35, P(5, 9), '35F 入口'));
  const p36 = pl.probe(36, FLOORS[36].arriveFromBelow!);
  const p38 = pl.probe(38, P(1, 6));
  pl.note(`  probe36=${p36} probe38=${p38}`);
  if (p36 === null) { pl.note('✗ 暗道不通 36'); ok = false; }
  else {
    await step(pl.reach(36, FLOORS[36].arriveFromBelow!, '36F'));
    await potions(12);
    await farm('36金', 20, (f) => f >= 31 && f <= 37);
    await buyUntil(0, () => g.hero.hp >= 1200, 6);
    await potions(8);
    await step(pl.reach(37, FLOORS[37].arriveFromBelow!, '37F'));
    await potions(8);
    const d = pl.probe(38, P(1, 6));
    pl.note(`  骑士盾路伤≈${d}`);
    if (d !== null && d >= g.hero.hp - 30) await buyUntil(0, () => g.hero.hp > d + 80, 6);
    await step(pl.reach(38, P(1, 6), '骑士盾'));
  }
}
if (ok && g.hero.shield !== '骑士盾') { pl.note('✗ 无骑士盾'); ok = false; }
pl.snapshot('骑士盾后');

pl.note('■ 39F 瞬移');
if (ok && !g.flags.puzzle39) {
  await step(pl.reach(39, P(10, 1), '39F'));
  for (let i = 0; i < 50 && g.hero.keys.yellow < 2; i++) {
    await farm('黄钥', 8, (f) => f >= 31 && f <= 39);
    if (g.hero.keys.yellow >= 2) break;
    await farm('黄钥低', 6);
  }
  if (g.hero.keys.yellow < 2) { pl.note(`✗ 黄钥匙 ${g.hero.keys.yellow}`); ok = false; }
  else {
    await step(pl.bump(39, P(3, 1), '开 (3,1)'));
    await step(pl.bump(39, P(5, 3), '开 (5,3)'));
    if (!g.flags.puzzle39) { pl.note('✗ 谜题未触发'); ok = false; }
    else await step(pl.reach(39, P(3, 3), '瞬移'));
  }
}
pl.snapshot('瞬移后');
pl.note(`  centerFly×${g.hero.bag?.centerFly ?? 0}`);

await farm('40前', 12, (f) => f >= 31);
await potions(6);
await buyUntil(0, () => g.hero.hp >= 2000, 5);

pl.note('■ 40F');
const troop = () => {
  let t = 0;
  for (const [x, y] of [[4, 3], [3, 3], [2, 3], [6, 3], [7, 3], [8, 3], [3, 1], [2, 1], [1, 1], [7, 1], [8, 1], [9, 1]] as const) {
    const m = g.cell(P(x, y), 40)?.monster;
    if (m) {
      const d = forecastBattle({ ...g.hero, hp: 1e12 }, g.monsterDef(m)).damage;
      t += Number.isFinite(d) ? d : 1e9;
    }
  }
  return t;
};
pl.note(`  手下总伤≈${troop()} 瞬移×${g.hero.bag?.centerFly ?? 0}`);
if (ok && (g.hero.bag?.centerFly ?? 0) > 0) {
  await step(pl.reach(40, P(9, 10), '40F 入口'));
  if (ok) {
    g.useCenterFly();
    flags0.fly40 = true; g.flags.fly40 = true;
    pl.note(`→ 瞬移到 (${g.pos.x},${g.pos.y})`);
    await pl.collect('手下', 60, (f) => f === 40);
  }
}
await step(pl.reach(40, P(5, 6), '40F 剧情'));
await pl.collect('奖励', 25, (f) => f === 40);
await step(pl.reach(41, P(5, 9), '41F'));

const end = pl.snapshot('结束');
const pass = ok && g.floorId === 41 && !!g.flags.knight40 && !g.dead;
pl.note(pass
  ? `✅ 通过 ${pl.hs()} 祭坛${g.flags.altarTimes ?? 0}（对照 W1 41F 前约 71/162/166）`
  : `❌ 失败 ${pl.hs()} f=${g.floorId}`);
fs.writeFileSync('docs/zone4-route.txt', `第四区通关路线（小偷暗道 + 39F 瞬移）\n\n${pl.log.join('\n')}\n`);
if (pass) fs.writeFileSync('docs/zone4-end.json', JSON.stringify(g.serialize()));
console.log(pl.log.filter((l) =>
  l.startsWith('■') || l.startsWith('✗') || l.startsWith('✅') || l.startsWith('❌') ||
  l.includes('probe') || l.includes('路伤') || l.includes('堆后') || l.includes('蓝') ||
  l.includes('瞬移') || l.includes('祭坛 生命') || l.includes('祭坛 攻击') || l.includes('前 ')
).join('\n'));
console.log('---tail---');
console.log(pl.log.slice(-40).join('\n'));
console.log(end);
process.exitCode = pass ? 0 : 1;
