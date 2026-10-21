/**
 * 第一区：祭坛 0 次。硬里程碑强制到达（不依赖「价值−伤害」贪心，早期攻防不够时贪心会卡住）。
 * 对照攻略 W1 第二区起点约 620/30/30。
 */
import fs from 'node:fs';
import { forecastBattle } from '../src/game/combat';
import { MONSTERS } from '../src/game/entities';
import { Game } from '../src/game/state';
import { Planner } from './planner';

const env = (k: string, d: number) => Number(process.env[k] ?? d);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const pl = new Planner(new Game().serialize(), {
  floors: range(1, 10),
  keyV: { yellow: env('Z_KY', 80), blue: env('Z_KB', 200), red: 600 },
  goldV: env('Z_GOLD', 2),
  gemMin: env('Z_GEM', 120),
  toolV: 100,
  safety: 1,
  valueFloors: range(1, 10),
  cap: 600,
  gemScale: 1,
  maxFrac: 0.95, // 早期允许高伤路径，靠里程碑控制
  avoidMonster: (f, _p, m) => f === 2 && m === 'blueGuard',
});
const g = pl.g;
const P = (x: number, y: number) => ({ x, y });
let ok = true;

async function force(f: number, x: number, y: number, label: string, frac = 0.95): Promise<boolean> {
  if (!ok) return false;
  for (let i = 0; i < 40; i++) {
    const d = pl.probe(f, P(x, y));
    if (d !== null && d < g.hero.hp * frac) {
      const r = await pl.reach(f, P(x, y), label);
      if (!r) ok = false;
      return r;
    }
    // 先捡当前连通块里能捡的
    const n0 = pl.log.length;
    await pl.collect('铺路', 2);
    if (pl.log.length === n0) {
      // 强制打一只最低伤可达怪，换钥匙/金币
      const nodes = pl.search();
      let best: { f: number; x: number; y: number; dmg: number } | null = null;
      for (const [, n] of nodes) {
        const c = g.cell(n.p, n.f);
        if (!c?.monster) continue;
        const dmg = forecastBattle(g.hero, MONSTERS[c.monster]).damage;
        if (!Number.isFinite(dmg) || dmg >= g.hero.hp - 5) continue;
        if (!best || dmg < best.dmg || (dmg === best.dmg && n.dist < 10)) best = { f: n.f, x: n.p.x, y: n.p.y, dmg };
      }
      if (!best) break;
      await pl.reach(best.f, P(best.x, best.y), `铺路打怪(-${best.dmg})`);
    }
  }
  const d = pl.probe(f, P(x, y));
  if (d !== null && d < g.hero.hp) {
    const r = await pl.reach(f, P(x, y), label);
    if (!r) ok = false;
    return r;
  }
  pl.note(`  ✗ 强制失败 ${label}（${pl.hs()}）`);
  ok = false;
  return false;
}

pl.snapshot('开局');
await pl.collect('伏击前', 1, (f) => f === 1);
await pl.reach(3, P(4, 8), '3F 魔王伏击');
ok = !!g.flags.ambush3 && g.floorId === 2;
pl.note(`  → 监狱：${pl.hs()}`);
if (!(await pl.bump(2, P(2, 6), '2F 小偷'))) ok = false;

// 先囤钥匙与血，再取剑（避免剑后 0 黄钥匙困死）
pl.note('■ 囤资源');
for (let i = 0; i < 25 && ok; i++) {
  const n0 = pl.log.length;
  await pl.collect('囤', 1);
  if (pl.log.length === n0) break;
  if (g.hero.keys.yellow >= 6 && g.hero.hp >= 700) break;
}
pl.snapshot('囤后');

// 铁剑：必要时先撞暗墙 (8,10)/(9,10)
pl.note('■ 铁剑');
if (g.cell(P(8, 10), 5)?.terrain === 'hiddenWall') await force(5, 8, 10, '5F 暗墙');
await force(5, 10, 10, '5F 铁剑');
pl.snapshot('铁剑后');

// 继续囤到能上 9F
pl.note('■ 再囤');
for (let i = 0; i < 40 && ok; i++) {
  if (pl.probe(9, P(8, 6)) !== null) break;
  // 商人
  for (const [f, x, y, label] of [[7, 5, 0, '7F 商人'], [6, 7, 3, '6F 商人']] as const) {
    if (!g.flags[`trader${f}`] && g.hero.gold >= 50 && g.visited.has(f)) {
      const d = pl.probe(f, P(x, y + 1)) ?? pl.probe(f, P(x - 1, y));
      if (d !== null && d < g.hero.hp * 0.4) await pl.trade(f, P(x, y), label);
    }
  }
  const n0 = pl.log.length;
  await pl.collect('再囤', 1);
  if (pl.log.length === n0) {
    // 强制最低伤怪
    const nodes = pl.search();
    let best: { f: number; x: number; y: number; dmg: number } | null = null;
    for (const [, n] of nodes) {
      const c = g.cell(n.p, n.f);
      if (!c?.monster && !c?.item) continue;
      if (c.monster) {
        const dmg = forecastBattle(g.hero, MONSTERS[c.monster]).damage;
        if (!Number.isFinite(dmg) || dmg >= g.hero.hp * 0.5) continue;
        if (!best || dmg < best.dmg) best = { f: n.f, x: n.p.x, y: n.p.y, dmg };
      } else if (c.item && n.dmg < g.hero.hp * 0.5) {
        await pl.reach(n.f, n.p, `捡 ${c.item}`);
        best = { f: n.f, x: n.p.x, y: n.p.y, dmg: n.dmg };
        break;
      }
    }
    if (!best) break;
    if (g.cell(P(best.x, best.y), best.f)?.monster) await pl.reach(best.f, P(best.x, best.y), `再囤打怪(-${best.dmg})`);
  }
}
pl.snapshot('上9F前');

pl.note('■ 铁盾');
for (const [x, y] of [[8, 5], [7, 6], [9, 6]] as const) {
  if (g.cell(P(x, y), 9)?.terrain === 'hiddenWall') await force(9, x, y, '9F 暗墙');
}
await force(9, 8, 6, '9F 铁盾');
pl.snapshot('铁盾后');

// 宝石优先，直到攻≥23 且防≥20 再打初级卫兵
pl.note('■ 攒攻防');
for (let i = 0; i < 80 && ok; i++) {
  if (g.hero.atk >= 25 && g.hero.def >= 22) break;
  const n0 = pl.log.length;
  await pl.collect('攒', 1);
  if (pl.log.length === n0) {
    const nodes = pl.search();
    let got = false;
    for (const [, n] of nodes) {
      const c = g.cell(n.p, n.f);
      if (c?.item && (c.item === 'redGem' || c.item === 'blueGem' || c.item.includes('Potion')) && n.dmg < g.hero.hp * 0.5) {
        await pl.reach(n.f, n.p, c.item);
        got = true;
        break;
      }
    }
    if (!got) break;
  }
}
pl.snapshot('攒后');

pl.note('■ 红钥匙');
for (let i = 0; i < 30 && ok && g.cell(P(9, 1), 8)?.item === 'redKey'; i++) {
  let progress = false;
  for (const x of [8, 10]) {
    if (g.cell(P(x, 4), 8)?.monster === 'yellowGuard') {
      const dmg = forecastBattle(g.hero, MONSTERS.yellowGuard).damage;
      if (Number.isFinite(dmg) && dmg < g.hero.hp * 0.45) {
        if (await force(8, x, 4, `8F 卫兵(${x},4)`, 0.5)) progress = true;
      }
    }
  }
  if (g.cell(P(9, 1), 8)?.item === 'redKey' && pl.probe(8, P(9, 1)) !== null) {
    await force(8, 9, 1, '8F 红钥匙');
    break;
  }
  if (!progress) {
    await pl.collect('钥前', 3);
    if (g.hero.atk < 23) break;
  }
}
pl.snapshot('红钥匙后');

pl.note('■ 10F');
for (let i = 0; i < 120 && ok && !g.flags.captainDefeated; i++) {
  for (const [f, x, y, label] of [[7, 5, 0, '7F 商人'], [6, 7, 3, '6F 商人']] as const) {
    if (!g.flags[`trader${f}`] && g.hero.gold >= 50 && g.visited.has(f)) {
      const d = pl.probe(f, P(x, y + 1)) ?? pl.probe(f, P(x - 1, y));
      if (d !== null && d < g.hero.hp * 0.3) await pl.trade(f, P(x, y), label);
    }
  }
  if (!g.flags.ambush10 && g.hero.keys.red > 0) {
    let hp = g.hero.hp;
    let can = true;
    for (const id of ['skeleton', 'skeleton', 'skeleton', 'skeleton', 'skeleton', 'skeleton', 'skeletonSoldier', 'skeletonSoldier', 'skeletonCaptain'] as const) {
      const fc = forecastBattle(g.hero, MONSTERS[id]);
      if (!fc.winnable) { can = false; break; }
      hp -= fc.damage;
    }
    const d = pl.probe(10, P(5, 4));
    if (can && hp > 50 && d !== null && d < g.hero.hp * 0.4) {
      await pl.reach(10, P(5, 4), '10F 伏击');
      if (g.flags.ambush10) {
        await pl.collect('包围圈', 50, (f) => f === 10);
        if (!g.flags.captainDefeated) await pl.reach(10, P(5, 1), '挑战队长');
        continue;
      }
    }
  }
  const n0 = pl.log.length;
  await pl.collect('终局攒', 1);
  if (pl.log.length === n0) {
    // 强制宝石/血
    const nodes = pl.search();
    let got = false;
    for (const [, n] of nodes) {
      const c = g.cell(n.p, n.f);
      if (c?.item && n.dmg < g.hero.hp * 0.55) {
        await pl.reach(n.f, n.p, c.item);
        got = true;
        break;
      }
    }
    if (!got) break;
  }
}

pl.snapshot('结束');
const pass = ok && !!g.flags.captainDefeated && !g.dead && (g.flags.altarTimes ?? 0) === 0;
pl.note(pass ? `✅ 通过 ${pl.hs()}（W1 对照 620/30/30）` : `❌ 未通过 ${pl.hs()} captain=${!!g.flags.captainDefeated} redKey=${g.hero.keys.red}`);
fs.writeFileSync('docs/zone1-route-planner.txt', `第一区路线（scripts/route1.ts，祭坛 0 次）\n\n${pl.log.join('\n')}\n`);
if (pass) fs.writeFileSync('docs/zone1-end-planner.json', JSON.stringify(g.serialize()));
console.log(pl.log.slice(-80).join('\n'));
process.exitCode = pass ? 0 : 1;
