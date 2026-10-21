/**
 * 第二区可通关性的「贪心规划启发式」（束搜索之外的独立估算，结果记入 docs/research.md §12.10）。
 *
 * 从第一区路线终局（docs/zone1-end.json）出发，在真实地图 / 楼梯落点上反复做以伤害为代价的 Dijkstra
 * （怪物伤害用游戏自己的 forecastBattle；开门按钥匙价值折算，没钥匙不能过）：
 *   1. 收集：挑「价值 − 路上伤害」最大且为正的道具（血瓶按回血量、宝石/装备按 M_GEM、钥匙按 M_KY/M_KB），走过去；
 *   2. 没有划算的道具时，若能拿十字架（19F 暗墙后）就去拿；有十字架后若能安全打吸血鬼就去 20F (5,7) 并结算吸血鬼；
 * 沿路线逐格结算伤害 / 钥匙 / 拾取，路线中途属性变化会立即生效。
 * 不使用：祭坛、商人、镐、圣水以外的背包道具（圣水只在打吸血鬼前喝）。机关门按 scripts2.ts 的守卫对处理。
 * 余量 = 击败吸血鬼后剩余生命。
 * 运行：npx tsx scripts/margin2.ts（M_KY / M_KB / M_GEM 可调）
 */
import fs from 'node:fs';
import { forecastBattle } from '../src/game/combat';
import { ITEMS, MONSTERS } from '../src/game/entities';
import { FLOORS } from '../src/game/floors';
import { Game, type SaveData } from '../src/game/state';
import { Director, type ScriptHost } from '../src/game/director';
import { DIR_VEC, type Dir, type HeroStats, type Point } from '../src/game/types';

/** M_FROM：第一区终局存档（默认 docs/zone1-end.json；用户策略链用 docs/zone1-end-noaltar.json） */
const FROM = process.env.M_FROM ?? 'docs/zone1-end.json';
const save = JSON.parse(fs.readFileSync(FROM, 'utf8')) as SaveData;
/** M_MAXALTAR：第二区最多供奉几次（用户策略：≤ 4） */
const MAXALTAR = Number(process.env.M_MAXALTAR ?? 99);
const g = new Game();
g.deserialize(save);
const hero: HeroStats = structuredClone(g.hero);
/**
 * M_START=noLastAltar：第一区路线的最后一步是 4F 祭坛「140 金币 → 生命 +400」（docs/zone1-route.txt 第 229 步，
 * 发生在击败骷髅队长之后，属可选操作）。去掉这一步即得到同一条第一区路线的另一个合法终局：
 * 生命 754、金币 141、祭坛已供奉 3 次——把 140 金币留到 12F 祭坛（第二区倍率 2）去用。
 */
const START = process.env.M_START ?? 'routeEnd';
if (START === 'noLastAltar') { hero.hp -= 400; hero.gold += 140; save.flags = { ...save.flags, altarTimes: 3 }; }
const K = (f: number, p: Point) => `${f}:${p.x},${p.y}`;
/** 机关门 → 打开它需要击败的守卫 */
const GUARDS: Record<string, Point[]> = {
  '11:1,3': [{ x: 0, y: 4 }, { x: 2, y: 4 }],
  '17:1,6': [{ x: 0, y: 7 }, { x: 2, y: 7 }],
  '17:1,3': [{ x: 0, y: 4 }, { x: 2, y: 4 }],
  '17:9,6': [{ x: 8, y: 7 }, { x: 10, y: 7 }],
  '17:9,3': [{ x: 8, y: 4 }, { x: 10, y: 4 }],
};
const fight = (m: Parameters<typeof forecastBattle>[1]) => forecastBattle({ ...hero, hp: 1e9 }, m).damage;
const KEYV = { yellow: Number(process.env.M_KY ?? 40), blue: Number(process.env.M_KB ?? 150), red: 400 } as const;
const GEMV = Number(process.env.M_GEM ?? 120);
const SAFETY = Number(process.env.M_SAFE ?? 1);

function stepCost(f: number, p: Point): number | null {
  const c = g.cell(p, f);
  if (!c) return null;
  if (c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2') return 0;
  // 15F 小偷：对话后打开 (7,0) 的封墙并离开（scripts2.ts）
  if (f === 15 && p.y === 0 && (p.x === 8 || p.x === 7)) return 0;
  if (c.terrain !== 'floor' || c.npc) return null;
  if (c.door === 'special') {
    const gs = GUARDS[K(f, p)];
    if (!gs) return null;
    return gs.reduce((s, q) => { const m = g.cell(q, f)?.monster; return s + (m ? fight(MONSTERS[m]) : 0); }, 0);
  }
  if (c.door === 'iron') return null;
  if (c.door) return hero.keys[c.door as 'yellow'] > 0 ? KEYV[c.door as 'yellow'] : null; // 钥匙按价值折算
  if (c.monster) { const d = fight(MONSTERS[c.monster]); return Number.isFinite(d) ? d : null; }
  return 0;
}

function arrival(f: number, t: 'stairsUp' | 'stairsDown') {
  const to = f + (t === 'stairsUp' ? 1 : -1);
  if (to < 1 || to > 20) return null;
  const fl = FLOORS[to];
  return { f: to, p: t === 'stairsUp' ? fl.arriveFromBelow! : fl.arriveFromAbove! };
}



type Node = { f: number; p: Point };
type Step = { kind: 'walk'; from: Node; path: Node[] } | { kind: 'altar'; opt: 1 | 2 } | { kind: 'trader'; f: number; at: Point } | { kind: 'drink' } | { kind: 'vampire' };
const trace: Step[] = [];
function dijkstra(): { dist: Map<string, number>; dmg: Map<string, number>; prev: Map<string, string>; nodes: Map<string, Node> } {
  const dist = new Map<string, number>([[K(cur.f, cur.p), 0]]);
  const dmg = new Map<string, number>([[K(cur.f, cur.p), 0]]);
  const doorsUsed = new Map<string, { yellow: number; blue: number; red: number }>([[K(cur.f, cur.p), { yellow: 0, blue: 0, red: 0 }]]);
  const prev = new Map<string, string>();
  const nodes = new Map<string, Node>([[K(cur.f, cur.p), cur]]);
  const open: Array<[number, string]> = [[0, K(cur.f, cur.p)]];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [d, k] = open[bi];
    open[bi] = open[open.length - 1]; open.pop();
    if (d > dist.get(k)!) continue;
    const n0 = nodes.get(k)!;
    for (const dv of Object.values(DIR_VEC)) {
      let n: Node = { f: n0.f, p: { x: n0.p.x + dv.x, y: n0.p.y + dv.y } };
      const c = g.cell(n.p, n.f);
      if (!c) continue;
      let cost: number | null;
      if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
        const a = arrival(n.f, c.terrain);
        if (!a) continue;
        n = a; cost = 0;
      } else cost = stepCost(n.f, n.p);
      if (cost === null) continue;
      const cc = g.cell(n.p, n.f)!;
      const isKey = !!cc.door && cc.door !== 'special' && cc.terrain === 'floor';
      const hit = isKey ? 0 : cost;
      const du = { ...doorsUsed.get(k)! };
      if (isKey && cc.door !== 'iron') { const kd = cc.door as 'yellow'; du[kd]++; if (du[kd] > hero.keys[kd]) continue; }
      if (n.f === 20 && n.p.y >= 3 && n.p.y <= 7 && n.p.x >= 3 && n.p.x <= 7) cost = n.p.x === 5 && n.p.y === 7 ? cost : null; // 20F 包围圈：只到触发点
      if (cost === null) continue;
      const nk = K(n.f, n.p);
      if (d + cost < (dist.get(nk) ?? Infinity)) { dist.set(nk, d + cost); dmg.set(nk, dmg.get(k)! + hit); doorsUsed.set(nk, du); prev.set(nk, k); nodes.set(nk, n); open.push([d + cost, nk]); }
    }
  }
  return { dist, dmg, prev, nodes };
}

let steps = 0;
function walk(name: string, tk: string, D: ReturnType<typeof dijkstra>): boolean {
  const path: Node[] = [];
  for (let k: string | undefined = tk; k && k !== K(cur.f, cur.p); k = D.prev.get(k)) path.unshift(D.nodes.get(k)!);
  trace.push({ kind: 'walk', from: { ...cur }, path: path.map((n) => ({ f: n.f, p: { ...n.p } })) });
  let dmg = 0; const got: string[] = []; let kills = 0; const h0 = hero.hp;
  for (const n of path) {
    const c = g.cell(n.p, n.f)!;
    if (c.door === 'special') {
      for (const q of GUARDS[K(n.f, n.p)]) { const qc = g.cell(q, n.f)!; if (qc.monster) { const x = fight(MONSTERS[qc.monster]); dmg += x; hero.hp -= x; kills++; hero.gold += MONSTERS[qc.monster].gold; qc.monster = undefined; } }
      c.door = undefined;
    } else if (c.door) { const kd = c.door as 'yellow'; if (hero.keys[kd] <= 0) { out.push(`❌ ${name}：${n.f}F 缺钥匙`); return false; } hero.keys[kd]--; used[kd]++; c.door = undefined; }
    if (c.monster) { const x = fight(MONSTERS[c.monster]); dmg += x; hero.hp -= x; kills++; hero.gold += MONSTERS[c.monster].gold; c.monster = undefined; }
    if (hero.hp <= 0) { out.push(`❌ ${name}：生命耗尽于 ${n.f}F (${n.p.x},${n.p.y})`); return false; }
    if (c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2' || c.terrain === 'sealedWall') c.terrain = 'floor';
    if (c.npc === 'thief') c.npc = undefined;
    if (c.item) {
      if (c.item === 'superPotion') holy++;
      else ITEMS[c.item].apply(hero, FLOORS[n.f].ratio);
      got.push(`${n.f}F${ITEMS[c.item].name}`); c.item = undefined;
    }
  }
  // 14F 自动事件：三只兽人武士都被消灭后，牢墙 (0,2) 打开并出现红钥匙（scripts2.ts）
  if (!redKey14 && [[0, 0], [2, 0], [1, 1]].every(([x, y]) => !g.cell({ x, y }, 14)?.monster)) {
    redKey14 = true;
    const c = g.cell({ x: 0, y: 2 }, 14)!;
    c.terrain = 'floor'; c.item = 'redKey';
    got.push('（14F 隐藏红钥匙出现）');
  }
  totalDmg += dmg; cur = path.length ? path[path.length - 1] : cur; steps++;
  out.push(`${String(steps).padStart(3)} ${name.padEnd(10, '　')} 伤害 ${String(dmg).padStart(4)}（${kills} 只）${got.length ? '拾取 ' + got.join('、') : ''} → ${h0}→${hero.hp}/${hero.atk}/${hero.def} 钥匙 ${hero.keys.yellow}/${hero.keys.blue}/${hero.keys.red}`);
  return true;
}

let holy = 0;
// 16F 右下暗墙 (10,10) 后的老人给圣水（scripts2.ts opened → oldman → superPotion），这里直接当作暗墙格上的圣水
g.cell({ x: 10, y: 10 }, 16)!.item = 'superPotion';
let redKey14 = false;
let altarT = Number(save.flags?.altarTimes ?? 0);
const altar0 = altarT;
let bought7 = !!save.flags?.trader7;
let bought15 = false;
let bought12 = false;
const RESERVE = Number(process.env.M_RES ?? 0);
let seed = Number(process.env.M_SEED ?? 0) >>> 0;
const NOISE = Number(process.env.M_NOISE ?? 0);
/** mulberry32；M_SEED=0 且 M_NOISE=0 时完全确定 */
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const jitter = (v: number) => (NOISE ? v * (1 + NOISE * (rnd() * 2 - 1)) : v);
const HOLYV = Number(process.env.M_HOLY ?? 300);
const MSF = Number(process.env.M_MSF ?? 0.7);
const SHOPDMG = Number(process.env.M_SHOPDMG ?? 300);
let totalDmg = 0;
let cur: Node = { f: 11, p: FLOORS[11].arriveFromBelow! };
const used = { yellow: 0, blue: 0, red: 0 };
const out: string[] = [`起点（${START === "noLastAltar" ? "第一区路线去掉最后一次可选祭坛供奉" : "第一区路线终局"}，到达 11F）：${hero.hp}/${hero.atk}/${hero.def} 钥匙 ${JSON.stringify(hero.keys)}`];
const value = (f: number, it: string): number => {
  const r = FLOORS[f].ratio;
  switch (it) {
    case 'redPotion': return 50 * r;
    case 'bluePotion': return 200 * r;
    case 'redGem': case 'blueGem': return GEMV * r;
    case 'silverSword': case 'silverShield': case 'ironSword': case 'ironShield': return GEMV * 20;
    case 'yellowKey': return KEYV.yellow;
    case 'blueKey': return KEYV.blue;
    case 'redKey': return KEYV.red;
    case 'superPotion': return HOLYV;
    default: return 0;
  }
};
const holyHeal = () => Math.round(0.74 * (hero.atk + hero.def)) * 10;
let cleared = false;
for (let iter = 0; iter < 400 && !cleared; iter++) {
  const D = dijkstra();
  let best = null as { k: string; v: number; label: string } | null;
  let fallback: { k: string; v: number; label: string } | null = null as { k: string; v: number; label: string } | null;
  for (const [k, n] of D.nodes) {
    const c = g.cell(n.p, n.f);
    if (!c?.item) continue;
    const d = D.dist.get(k)!;
    if (D.dmg.get(k)! >= hero.hp - SAFETY) continue;
    const v = jitter(value(n.f, c.item)) - d;
    if (v > 0 && (!best || v > best.v)) best = { k, v, label: `拾取${ITEMS[c.item].name}` };
    if (!fallback || v > fallback.v) fallback = { k, v, label: `拾取${ITEMS[c.item].name}（亏）` };
  }
  // 里程碑优先：17F 银剑 → 11F 银盾（路上伤害不超过当前生命的 M_MSF）
  {
    let did = false;
    for (const [f, x, y, it] of [[17, 1, 1, 'silverSword'], [11, 1, 1, 'silverShield']] as const) {
      const k = K(f, { x, y });
      if (g.cell({ x, y }, f)?.item !== it) continue;
      const d = D.dmg.get(k);
      if (d !== undefined && d < hero.hp * MSF) { if (!walk(`${f}F ${ITEMS[it].name}`, k, D)) { did = true; break; } did = true; }
      break;
    }
    if (did) { if (hero.hp <= 0) break; continue; }
  }
  // 商店：12F 祭坛（按「剩余第二区怪物总伤害最小」选攻 / 防）、7F 商人 5 黄钥匙 50 金币、15F 商人蓝钥匙 200 金币
  const shopAt = (f: number, x: number, y: number) => {
    let bk: string | null = null;
    for (const dv of Object.values(DIR_VEC)) { const k = K(f, { x: x + dv.x, y: y + dv.y }); if (D.dmg.has(k) && (!bk || D.dmg.get(k)! < D.dmg.get(bk)!)) bk = k; }
    return bk && D.dmg.get(bk)! < Math.min(SHOPDMG, hero.hp - SAFETY) ? bk : null;
  };
  const price = 20 + 10 * altarT * (altarT + 1);
  let k2: string | null;
  if (altarT - altar0 < MAXALTAR && hero.gold >= price && (k2 = shopAt(12, 5, 8))) {
    if (!walk('12F 祭坛', k2, D)) break;
    const rem = (a: number, d: number) => { let t = 0; for (let f = 11; f <= 20; f++) for (const r of g.floors[f]) for (const c of r) if (c.monster) { const x = forecastBattle({ ...hero, atk: a, def: d, hp: 1e9 }, MONSTERS[c.monster]).damage; t += Number.isFinite(x) ? Math.min(x, 3000) : 3000; } return t; };
    // 原版商人提示：「只有在攻击力低于敌人的防御力时才提升攻击力」——十字架被石头人（防 68）挡住，
    // 若地图上剩余的红宝石 + 银剑也不足以让攻击超过 68，就加攻击；否则按剩余总伤害选择
    // 只把「不经过石头人就能拿到」的红宝石 / 银剑计入潜力（保守：20F 左侧宝石要蓝钥匙，不计）
    let potential = hero.atk;
    for (let f = 1; f <= 20; f++) for (const r of g.floors[f]) for (const c of r) if (c.item === 'redGem' && f !== 20) potential += FLOORS[f].ratio; else if (c.item === 'silverSword') potential += 20;
    const atkBetter = (!hero.tools.cross && potential - RESERVE <= MONSTERS.rock.def) || rem(hero.atk + 4, hero.def) < rem(hero.atk, hero.def + 8);
    hero.gold -= price; altarT++;
    if (atkBetter) hero.atk += 4; else hero.def += 8;
    trace.push({ kind: 'altar', opt: atkBetter ? 1 : 2 });
    out.push(`    供奉 ${price} 金币：${atkBetter ? '攻击 +4' : '防御 +8'} → ${hero.hp}/${hero.atk}/${hero.def} 金 ${hero.gold}`);
    continue;
  }
  if (!bought7 && hero.gold >= 50 && (k2 = shopAt(7, 5, 0))) {
    if (!walk('7F 商人', k2, D)) break;
    hero.gold -= 50; hero.keys.yellow += 5; bought7 = true; trace.push({ kind: 'trader', f: 7, at: { x: 5, y: 0 } });
    out.push(`    7F 商人：50 金币买 5 把黄钥匙 → 钥匙 ${hero.keys.yellow}/${hero.keys.blue}/${hero.keys.red}`);
    continue;
  }
  if (!bought15 && hero.gold >= 200 && hero.keys.blue === 0 && (k2 = shopAt(15, 10, 10))) {
    if (!walk('15F 商人', k2, D)) break;
    hero.gold -= 200; hero.keys.blue++; bought15 = true; trace.push({ kind: 'trader', f: 15, at: { x: 10, y: 10 } });
    out.push(`    15F 商人：200 金币买蓝钥匙`);
    continue;
  }
  if (!bought12 && hero.tools.cross && hero.keys.red === 0 && hero.gold >= 800 && (k2 = shopAt(12, 0, 0))) {
    if (!walk('12F 商人', k2, D)) break;
    hero.gold -= 800; hero.keys.red++; bought12 = true; trace.push({ kind: 'trader', f: 12, at: { x: 0, y: 0 } });
    out.push(`    12F 商人：800 金币买红钥匙`);
    continue;
  }
  if (best) { if (!walk(best.label, best.k, D)) break; continue; }
  // 有十字架、没有红钥匙且买不起 12F 红钥匙时：去 14F 打三只兽人武士换隐藏红钥匙
  if (hero.tools.cross && hero.keys.red === 0 && !redKey14 && hero.gold < 800) {
    const order = [[1, 1], [0, 0], [2, 0]].filter(([x, y]) => g.cell({ x, y }, 14)?.monster);
    const [x, y] = order[0];
    const k = K(14, { x, y });
    const d = D.dmg.get(k);
    if (d !== undefined && d < hero.hp - SAFETY) { if (!walk(`14F 兽人武士`, k, D)) break; continue; }
  }
  if (!hero.tools.cross) {
    const k = K(19, { x: 5, y: 2 });
    const d = D.dmg.get(k);
    if (d !== undefined && d < hero.hp - SAFETY) { if (!walk('19F 十字架', k, D)) break; hero.tools.cross = true; continue; }
  } else {
    const k = K(20, { x: 5, y: 7 });
    const d = D.dmg.get(k);
    const v = forecastBattle({ ...hero, hp: 1e9 }, MONSTERS.vampire).damage;
    if (d !== undefined && d + v < hero.hp + holy * holyHeal()) {
      if (!walk('20F 吸血鬼现身', k, D)) break;
      if (holy) { const x = holyHeal() * holy; hero.hp += x; out.push(`    喝圣水 ×${holy} +${x} → ${hero.hp}`); holy = 0; trace.push({ kind: 'drink' }); }
      hero.hp -= v; totalDmg += v; trace.push({ kind: 'vampire' });
      out.push(`${hero.hp > 0 ? '✅' : '❌'} 20F 吸血鬼（十字架攻击 ×2）：伤害 ${v} → 剩余生命 ${hero.hp}`);
      cleared = hero.hp > 0;
      break;
    }
  }
  if (fallback) { if (!walk(fallback.label, fallback.k, D)) break; continue; }
  // 卡住时才喝圣水（越晚喝回得越多）
  if (holy) { const x = holyHeal() * holy; hero.hp += x; out.push(`    喝圣水 ×${holy} +${x} → ${hero.hp}`); holy = 0; trace.push({ kind: 'drink' }); continue; }
  out.push(`❌ 无划算的道具，也无法安全推进到下一个里程碑（十字架 ${hero.tools.cross ? '有' : '无'}）`);
  break;
}
console.log(out.join('\n'));
const left: string[] = [];
for (let f = 1; f <= 20; f++) g.floors[f].forEach((r, y) => r.forEach((c, x) => { if (c.item && /Gem|Sword|Shield/.test(c.item)) left.push(`${f}F(${x},${y})${ITEMS[c.item].name}`); }));
console.log(`未拿到的宝石/装备：${left.join('、') || '无'}`);
if (process.env.M_DEBUG) { const D = dijkstra(); for (const f of [17]) console.log(g.floors[f].map((r, y) => r.map((c, x) => (D.nodes.has(K(f, { x, y })) ? '*' : c.monster ? 'M' : c.door ? 'D' : c.terrain === 'floor' ? '.' : c.terrain[0])).join('')).join('\n')); console.log('  起点', cur, '可达格', D.nodes.size, [11,12,13,14,15,16,17,18,19,20].map((f) => `${f}F:${[...D.nodes.values()].filter((n) => n.f === f).length}`).join(' ')); for (const [k, n] of D.nodes) { const c = g.cell(n.p, n.f); if (c?.item) console.log(`  剩余 ${k} ${ITEMS[c.item].name} 伤害 ${D.dmg.get(k)}`); } for (let f = 11; f <= 20; f++) g.floors[f].forEach((r, y) => r.forEach((c, x) => { if (c.item && !D.nodes.has(K(f, { x, y }))) console.log(`  不可达 ${f}:${x},${y} ${ITEMS[c.item].name}`); })); }
console.log(`合计伤害 ${totalDmg}；钥匙用量 黄 ${used.yellow} 蓝 ${used.blue} 红 ${used.red}；最终 ${hero.hp}/${hero.atk}/${hero.def} 金 ${hero.gold}（未花）`);
console.log(cleared ? `结论：贪心规划可通关第二区，击败吸血鬼后剩余生命 ${hero.hp}（余量）` : '结论：贪心规划未能通关（见上）');

/* ---------------------------------------------------------------- 真实引擎重放 */
async function replay(): Promise<{ ok: boolean; msg: string; log: string[] }> {
  const rg = new Game();
  const s0 = structuredClone(save);
  if (START === 'noLastAltar') { s0.hero.hp -= 400; s0.hero.gold += 140; s0.flags = { ...s0.flags, altarTimes: 3 }; }
  rg.deserialize(s0);
  let shopPlan: number | null = null;
  let buyPlan = false;
  const host: ScriptHost = {
    say: async () => {},
    choose: async (_w, text, options) => {
      if (text.startsWith('如果供奉')) { const pk = shopPlan ?? 3; shopPlan = null; return pk; }
      if (options[0] === '我太需要了') { const b = buyPlan; buyPlan = false; return b ? 0 : 1; }
      return 0;
    },
    wait: async () => {}, curtain: async () => {}, transition: async (fn) => fn(), tip: () => {}, autosave: () => {},
  };
  const dir = new Director(rg, host);
  const log: string[] = [];
  const hs = () => `${rg.hero.hp}/${rg.hero.atk}/${rg.hero.def}/${rg.hero.gold} 钥匙${rg.hero.keys.yellow}/${rg.hero.keys.blue}/${rg.hero.keys.red}`;
  const dirTo = (a: Point, b: Point): Dir => (b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up');
  const move = async (d: Dir) => { rg.tryMove(d); await dir.settle(); };
  // 第一区终局 → 11F：沿已清空的楼层上楼（等价于楼层传送器）
  rg.changeFloor(11, 'fromBelow');
  await dir.settle();
  const at = (n: Node) => rg.floorId === n.f && rg.pos.x === n.p.x && rg.pos.y === n.p.y;
  for (const st of trace) {
    if (st.kind === 'walk') {
      for (const n of st.path) {
        for (let tries = 0; tries < 8 && !at(n); tries++) {
          if (rg.hero.hp <= 0) return { ok: false, msg: `生命耗尽于 ${rg.floorId}F`, log };
          if (n.f !== rg.floorId) {
            // 换层：走向当前位置旁的楼梯
            const want = n.f > rg.floorId ? 'stairsUp' : 'stairsDown';
            const sd = (Object.entries(DIR_VEC) as Array<[Dir, Point]>).find(([, v]) => rg.cell({ x: rg.pos.x + v.x, y: rg.pos.y + v.y })?.terrain === want);
            if (!sd) return { ok: false, msg: `${rg.floorId}F (${rg.pos.x},${rg.pos.y}) 旁没有${want}`, log };
            await move(sd[0]);
            continue;
          }
          const c = rg.cell(n.p)!;
          if (c.door === 'special') {
            const gs = GUARDS[K(n.f, n.p)] ?? [];
            for (const q of gs) if (rg.cell(q)?.monster) {
              const dx = Math.abs(q.x - rg.pos.x) + Math.abs(q.y - rg.pos.y);
              if (dx !== 1) return { ok: false, msg: `${n.f}F 守卫 (${q.x},${q.y}) 不在身旁`, log };
              await move(dirTo(rg.pos, q));
            }
            if (c.door === 'special') return { ok: false, msg: `${n.f}F 机关门 (${n.p.x},${n.p.y}) 未打开`, log };
            continue;
          }
          if (Math.abs(n.p.x - rg.pos.x) + Math.abs(n.p.y - rg.pos.y) !== 1) return { ok: false, msg: `路径不连续：${rg.floorId}F (${rg.pos.x},${rg.pos.y}) → ${n.f}F (${n.p.x},${n.p.y})`, log };
          await move(dirTo(rg.pos, n.p));
        }
        if (!at(n)) return { ok: false, msg: `无法走到 ${n.f}F (${n.p.x},${n.p.y})，停在 ${rg.floorId}F (${rg.pos.x},${rg.pos.y})`, log };
      }
      log.push(`走到 ${rg.floorId}F (${rg.pos.x},${rg.pos.y}) → ${hs()}`);
    } else if (st.kind === 'altar') {
      const a = (Object.entries(DIR_VEC) as Array<[Dir, Point]>).find(([, v]) => rg.cell({ x: rg.pos.x + v.x, y: rg.pos.y + v.y })?.npc === 'altar');
      if (!a) return { ok: false, msg: '祭坛不在身旁', log };
      shopPlan = st.opt; await move(a[0]); shopPlan = null;
      log.push(`12F 祭坛 ${st.opt === 1 ? '攻击' : '防御'} → ${hs()}`);
    } else if (st.kind === 'trader') {
      if (rg.floorId !== st.f || Math.abs(st.at.x - rg.pos.x) + Math.abs(st.at.y - rg.pos.y) !== 1) return { ok: false, msg: `${st.f}F 商人不在身旁`, log };
      buyPlan = true; await move(dirTo(rg.pos, st.at)); buyPlan = false;
      log.push(`${st.f}F 商人 → ${hs()}`);
    } else if (st.kind === 'drink') {
      rg.useSuperPotion(); log.push(`喝圣水 → ${hs()}`);
    } else {
      // 吸血鬼：现身后在 (5,5)，先打掉挡路的蝙蝠 (5,6)，再攻击吸血鬼
      if (!rg.flags.vampire20) return { ok: false, msg: '吸血鬼没有现身', log };
      for (let i = 0; i < 6 && !rg.flags.vampireDefeated; i++) await move('up');
      if (!rg.flags.vampireDefeated) return { ok: false, msg: `吸血鬼未被击败：${hs()}`, log };
      log.push(`击败吸血鬼 → ${hs()}`);
    }
    if (rg.hero.hp <= 0) return { ok: false, msg: '生命耗尽', log };
  }
  // 吸血鬼死后 (5,2) 打开：走到 20F 上楼梯旁
  const ok = !!rg.flags.vampireDefeated && rg.hero.hp > 0 && rg.cell({ x: 5, y: 2 }, 20)?.door !== 'special';
  // 第三区路线的起点（scripts/route345.ts 读取）
  if (ok && process.env.M_END) fs.writeFileSync(process.env.M_END, JSON.stringify(rg.serialize()));
  return { ok, msg: ok ? `真实引擎重放通过：击败吸血鬼后 ${hs()}，20F 机关门 (5,2) 已打开` : `重放结束但未通关：${hs()}`, log };
}
if (cleared && process.env.M_REPLAY !== '0') {
  const r = await replay();
  console.log(`${r.ok ? '✅' : '❌'} ${r.msg}`);
  if (process.env.M_WRITE) {
    fs.writeFileSync(process.env.M_ROUTE ?? 'docs/zone2-route.txt', `第二区通关路线（scripts/margin2.ts，参数 ${process.env.M_WRITE}）\n\n== 规划 ==\n${out.join('\n')}\n\n== 真实引擎（Game + Director + 剧情脚本）重放 ==\n${r.log.join('\n')}\n${r.msg}\n`);
  }
  if (!r.ok) cleared = false;
}
process.exitCode = cleared ? 0 : 1;
