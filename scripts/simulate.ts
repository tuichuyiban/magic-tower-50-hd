/**
 * 第一区（1F–10F）离线校验：
 *  1. 怪物数值与原版数据快照（docs/h5-51-source/enemys.js）逐项比对；地图与 orochitian/mota 交叉比对；
 *  2. 用真实的 Game + Director + 剧情脚本跑一条贪心路线，证明按原版数值可以打通第一区（击败骷髅队长并到达 10F 上楼梯）；
 *  3. 临界 / 1 防减伤 O(1) 公式与逐点枚举对拍。
 * 运行：npx tsx scripts/simulate.ts
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { defDamage, forecastBattle, nextCritical } from '../src/game/combat';
import { Director, type ScriptHost } from '../src/game/director';
import { cloneHero, HERO_START, ITEMS, MONSTERS, PRISON_STATS } from '../src/game/entities';
import { FLOORS } from '../src/game/floors';

/** 本脚本只验证第一区（第二区见 scripts/simulate2.ts） */
const LAST_FLOOR = 10;
import { altarPrice } from '../src/game/scripts';
import { Game } from '../src/game/state';
import { DIR_VEC, type Cell, type Dir, type HeroStats, type MonsterId, type Point } from '../src/game/types';

let failures = 0;
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) failures++;
};

/* ================================================================ 1. 数据核对 */

{
  const src = fs.readFileSync('docs/h5-51-source/enemys.js', 'utf8');
  const E = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1)) as Record<string, { name: string; hp: number; atk: number; def: number; money: number; special: number | number[] }>;
  const H5_ID: Partial<Record<MonsterId, string>> = {
    greenSlime: 'greenSlime', redSlime: 'redSlime', bat: 'bat', bluePriest: 'bluePriest', skeleton: 'skeleton',
    skeletonSoldier: 'skeletonSoldier', yellowGuard: 'yellowGuard', blueGuard: 'blueGuard', skeletonCaptain: 'skeletonCaptain',
  };
  // orochitian/mota 的 Monsters.js（第二来源，史莱姆名称一致，按名称匹配）
  const oro = Object.values(createRequire(import.meta.url)('../docs/h5-51-source/orochitian-Monsters.js') as Record<string, { name: string; hp: number; attack: number; defense: number; money: number }>);
  for (const [id, h5id] of Object.entries(H5_ID) as Array<[MonsterId, string]>) {
    const m = MONSTERS[id];
    const e = E[h5id];
    const special = Array.isArray(e.special) ? e.special.length : e.special;
    ok(
      !!e && e.hp === m.hp && e.atk === m.atk && e.def === m.def && e.money === m.gold && !special,
      `${m.name}: 本作 ${m.hp}/${m.atk}/${m.def}/${m.gold} — h5 ${e?.hp}/${e?.atk}/${e?.def}/${e?.money} 特殊能力 ${special || '无'}`,
    );
    const o = oro.find((x) => x.name === m.name);
    ok(!!o && o.hp === m.hp && o.attack === m.atk && o.defense === m.def && o.money === m.gold, `   └ orochitian/mota 交叉核对 ${m.name}: ${o ? `${o.hp}/${o.attack}/${o.defense}/${o.money}` : '未找到'}`);
  }
}

const H5_ZONE1 = new Set<MonsterId>(['greenSlime', 'redSlime', 'bat', 'bluePriest', 'skeleton', 'skeletonSoldier', 'yellowGuard', 'blueGuard', 'skeletonCaptain']);

/* ================================================================ 2. 路线模拟 */

const TRIGGERS: Record<number, Array<{ p: Point; flag: string }>> = {
  3: [{ p: { x: 4, y: 8 }, flag: 'ambush3' }],
  10: [{ p: { x: 5, y: 4 }, flag: 'ambush10' }],
};

let shopPlan: number | null = null;
const game = new Game();
const host: ScriptHost = {
  say: async () => {},
  choose: async (_who, text, options) => {
    if (text.startsWith('如果供奉')) {
      const pick = shopPlan ?? 3;
      shopPlan = null; // 每次对话只买一次，随后离开
      return pick;
    }
    if (options[0] === '我太需要了') return 0;
    return 0;
  },
  wait: async () => {},
  curtain: async () => {},
  transition: async (fn) => fn(),
  tip: () => {},
  autosave: () => {},
};
const director = new Director(game, host);

const K = (f: number, p: Point) => `${f}:${p.x},${p.y}`;
const prologue = () => !game.flags.ambush3;
const isTrigger = (f: number, p: Point) => (TRIGGERS[f] ?? []).some((t) => t.p.x === p.x && t.p.y === p.y && !game.flags[t.flag]);
const skipItem = (c: Cell) => prologue() && !!c.item && !c.item.endsWith('Key');

function passable(f: number, p: Point): boolean {
  const c = game.cell(p, f);
  if (!c || c.terrain !== 'floor' || c.door || c.monster || c.npc) return false;
  if (isTrigger(f, p) || skipItem(c)) return false;
  return true;
}

function arrival(f: number, dir: 'up' | 'down'): { f: number; p: Point } | null {
  const t = f + (dir === 'up' ? 1 : -1);
  const fl = FLOORS[t];
  if (!fl || t > LAST_FLOOR) return null;
  const p = dir === 'up' ? fl.arriveFromBelow : fl.arriveFromAbove;
  return p ? { f: t, p } : null;
}

/** 跨楼层可达集合（含楼梯换层） */
function reach(): Map<string, { f: number; p: Point }> {
  const seen = new Map<string, { f: number; p: Point }>();
  const q = [{ f: game.floorId, p: { ...game.pos } }];
  seen.set(K(q[0].f, q[0].p), q[0]);
  while (q.length) {
    const cur = q.shift()!;
    for (const d of Object.values(DIR_VEC)) {
      const n = { x: cur.p.x + d.x, y: cur.p.y + d.y };
      const c = game.cell(n, cur.f);
      if (!c) continue;
      if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
        const a = arrival(cur.f, c.terrain === 'stairsUp' ? 'up' : 'down');
        if (a && !seen.has(K(a.f, a.p))) {
          seen.set(K(a.f, a.p), a);
          q.push(a);
        }
        continue;
      }
      if (!passable(cur.f, n) || seen.has(K(cur.f, n))) continue;
      const node = { f: cur.f, p: n };
      seen.set(K(cur.f, n), node);
      q.push(node);
    }
  }
  return seen;
}

const KEY_COST = { yellow: 45, blue: 150, red: 400 };
const GOLD_VALUE = 5;
let marg = { atk: 0, def: 0, atk10: 0, def10: 0 };

/** 所有楼层剩余怪物的总伤害（无法战胜的按 3000 计） */
function totalDamage(h: HeroStats): number {
  let s = 0;
  for (const f of Object.keys(game.floors).map(Number)) {
    if (f > LAST_FLOOR) continue;
    for (const row of game.floors[f]) for (const c of row) {
      if (!c.monster) continue;
      const d = forecastBattle(h, MONSTERS[c.monster]).damage;
      s += Number.isFinite(d) ? Math.min(d, 3000) : 3000;
    }
  }
  return s;
}

function refreshMarginals(): void {
  const h = game.hero;
  const base = totalDamage(h);
  marg = {
    atk: base - totalDamage({ ...h, atk: h.atk + 1 }),
    def: base - totalDamage({ ...h, def: h.def + 1 }),
    atk10: base - totalDamage({ ...h, atk: h.atk + 10 }),
    def10: base - totalDamage({ ...h, def: h.def + 10 }),
  };
}

function itemValue(c: Cell): number {
  if (!c.item) return 0;
  if (prologue() && !c.item.endsWith('Key')) return 0;
  switch (c.item) {
    case 'redPotion': return 50;
    case 'bluePotion': return 200;
    case 'redGem': return Math.max(60, marg.atk);
    case 'blueGem': return Math.max(60, marg.def);
    case 'ironSword': return Math.max(600, marg.atk10);
    case 'ironShield': return Math.max(600, marg.def10);
    case 'yellowKey': return KEY_COST.yellow;
    case 'blueKey': return KEY_COST.blue;
    case 'redKey': return KEY_COST.red;
    default: return 1;
  }
}

/** 移除 blocker 后新增可达区域的价值；更深处的阻挡按折扣递归估值（两层前瞻） */
function regionValue(f: number, start: Point, reachable: Map<string, unknown>, depth = 0, seen = new Set<string>([K(f, start)])): number {
  let v = 0;
  const q = [start];
  const deeper: Array<{ p: Point; cost: number }> = [];
  while (q.length) {
    const cur = q.shift()!;
    for (const d of Object.values(DIR_VEC)) {
      const n = { x: cur.x + d.x, y: cur.y + d.y };
      const k = K(f, n);
      if (seen.has(k) || reachable.has(k)) continue;
      const c = game.cell(n, f);
      if (!c) continue;
      seen.add(k);
      if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
        const a = arrival(f, c.terrain === 'stairsUp' ? 'up' : 'down');
        if (a && !game.visited.has(a.f)) v += 600;
        continue;
      }
      if (c.terrain === 'hiddenWall') {
        deeper.push({ p: n, cost: 0 });
        continue;
      }
      if (c.terrain !== 'floor') {
        if (c.npc === 'altar') v += 1500;
        else if (c.npc === 'trader') v += 300;
        else if (c.npc) v += 60;
        continue;
      }
      if (c.npc) {
        v += 60;
        continue;
      }
      if (c.door) {
        if (c.door !== 'special' && c.door !== 'iron') deeper.push({ p: n, cost: KEY_COST[c.door] });
        continue;
      }
      if (c.monster) {
        const fc = forecastBattle(game.hero, MONSTERS[c.monster]);
        if (fc.winnable) deeper.push({ p: n, cost: fc.damage - MONSTERS[c.monster].gold * GOLD_VALUE });
        continue;
      }
      if (isTrigger(f, n)) continue;
      v += itemValue(c);
      q.push(n);
    }
  }
  if (depth < 2) {
    for (const b of deeper) {
      const inner = regionValue(f, b.p, reachable, depth + 1, seen) - b.cost;
      if (inner > 0) v += inner * 0.6;
    }
  }
  return v;
}

interface Action {
  f: number;
  from: Point;
  to: Point;
  /** free = 无代价立即执行；否则按 value / cost 排序 */
  free?: boolean;
  value: number;
  cost: number;
  label: string;
  shop?: number;
  trigger?: boolean;
}

function dirTo(a: Point, b: Point): Dir {
  return b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up';
}

/** lite = true：束搜索使用，不做价值估计（只枚举动作） */
function candidates(lite = true): Action[] {
  if (!lite) refreshMarginals();
  const R = reach();
  const acts: Action[] = [];
  const seenTarget = new Set<string>();
  const push = (tk: string, a: Action) => {
    seenTarget.add(tk);
    acts.push(a);
  };
  for (const { f, p } of R.values()) {
    const here = game.cell(p, f)!;
    if (here.item && !skipItem(here) && !seenTarget.has(K(f, p))) {
      for (const d of Object.values(DIR_VEC)) {
        const from = { x: p.x - d.x, y: p.y - d.y };
        if (R.has(K(f, from)) && !seenTarget.has(K(f, p))) {
          push(K(f, p), { f, from, to: p, free: true, value: itemValue(here), cost: 0, label: `拾取${ITEMS[here.item].name}` });
        }
      }
    }
    for (const d of Object.values(DIR_VEC)) {
      const t = { x: p.x + d.x, y: p.y + d.y };
      const tk = K(f, t);
      if (R.has(tk) || seenTarget.has(tk)) continue;
      const c = game.cell(t, f);
      if (!c) continue;
      const h = game.hero;
      if (c.terrain === 'hiddenWall') push(tk, { f, from: p, to: t, free: true, value: 1, cost: 0, label: '撞开暗墙' });
      else if (c.npc === 'altar') {
        const times = Number(game.flags.altarTimes ?? 0);
        const price = altarPrice(times);
        // SIM_NOALTAR=1：按用户策略「第一区祭坛 0 次」
        if (h.gold >= price && !prologue() && !process.env.SIM_NOALTAR) {
          if (lite) refreshMarginals();
          const opts = [100 * (times + 1), marg.atk * 2, marg.def * 4];
          const best = opts.indexOf(Math.max(...opts));
          push(tk, { f, from: p, to: t, free: true, value: 1, cost: 0, label: `祭坛供奉${price}金币（${['生命', '攻击', '防御'][best]}）`, shop: best });
        }
      } else if (c.npc === 'trader') {
        if (game.flags[`trader${f}`] || h.gold >= 50) push(tk, { f, from: p, to: t, free: true, value: 1, cost: 0, label: `与${f}层商人交易` });
      } else if (c.npc) push(tk, { f, from: p, to: t, free: true, value: 1, cost: 0, label: `与${f}层NPC对话` });
      else if (c.door) {
        if (c.door === 'special' || c.door === 'iron' || h.keys[c.door] <= 0) continue;
        push(tk, { f, from: p, to: t, value: lite ? 1 : regionValue(f, t, R), cost: KEY_COST[c.door], label: `开${{ yellow: '黄', blue: '蓝', red: '红' }[c.door]}门` });
      } else if (c.monster) {
        const fc = forecastBattle(h, MONSTERS[c.monster]);
        if (!fc.winnable) continue;
        const v = (lite ? 1 : regionValue(f, t, R)) + MONSTERS[c.monster].gold * GOLD_VALUE;
        push(tk, { f, from: p, to: t, free: fc.damage === 0, value: v, cost: fc.damage, label: `打${MONSTERS[c.monster].name}(-${fc.damage})` });
      } else if (c.terrain === 'floor' && isTrigger(f, t)) {
        push(tk, { f, from: p, to: t, value: 0, cost: 0, trigger: true, label: `触发 ${f}F 剧情` });
      }
    }
  }
  return acts;
}

async function act(a: Action): Promise<void> {
  if (a.f !== game.floorId) game.changeFloor(a.f, a.from);
  else game.pos = { ...a.from };
  if (a.shop !== undefined) shopPlan = a.shop;
  game.tryMove(dirTo(a.from, a.to));
  await director.settle();
}

function triggerReady(t: Action): boolean {
  if (t.f === 3) return true;
  // 第 10 层：确认能打完包围圈与队长
  const h = { ...game.hero };
  let hp = h.hp;
  for (const id of ['skeleton', 'skeleton', 'skeleton', 'skeleton', 'skeleton', 'skeleton', 'skeletonSoldier', 'skeletonSoldier', 'skeletonCaptain'] as MonsterId[]) {
    const f = forecastBattle(h, MONSTERS[id]);
    if (!f.canAttack) return false;
    hp -= f.damage;
  }
  return hp > 0;
}

/* ---------- 束搜索（beam search）：每层保留评估最高的若干状态，免费动作（拾取 / 0 伤害战斗 / NPC）自动贪心执行 ---------- */

interface Snap {
  floors: Game['floors'];
  hero: HeroStats;
  flags: Game['flags'];
  visited: number[];
  floorId: number;
  pos: Point;
  kills: number;
  log: string[];
  score: number;
}

const BEAM = Number(process.env.SIM_BEAM ?? 100);
const WY = Number(process.env.SIM_WY ?? 25);
const CAP = Number(process.env.SIM_CAP ?? 1500);
const WG = Number(process.env.SIM_WG ?? 5);

/** 只复制第一区会改动的楼层（0–11F），其余楼层共用同一份（第三–五区加入后整份复制太慢） */
const REST = game.floors;
function zone1Floors(f: typeof game.floors): typeof game.floors {
  const out = (Array.isArray(f) ? [] : {}) as typeof game.floors;
  // 格子是只含基本类型的扁平对象：逐格浅拷贝比 structuredClone 快一个数量级
  for (let i = 0; i <= 11; i++) if (f[i]) (out as Record<number, unknown>)[i] = f[i].map((r) => r.map((c) => ({ ...c })));
  return out;
}
function withRest(f: typeof game.floors): typeof game.floors {
  const out = (Array.isArray(REST) ? [...REST] : { ...REST }) as typeof game.floors;
  for (let i = 0; i <= 11; i++) if (f[i]) (out as Record<number, unknown>)[i] = f[i];
  return out;
}

function snap(log: string[]): Snap {
  const floors = zone1Floors(game.floors);
  return { floors, ...structuredClone({ hero: game.hero, flags: game.flags, visited: [...game.visited], floorId: game.floorId, pos: game.pos, kills: game.kills, log, score: 0,
  }) };
}

function restore(s: Snap): void {
  const c = structuredClone({ hero: s.hero, flags: s.flags, pos: s.pos });
  game.floors = withRest(zone1Floors(s.floors));
  game.hero = c.hero;
  game.flags = c.flags;
  game.visited = new Set(s.visited);
  game.floorId = s.floorId;
  game.pos = c.pos;
  game.kills = s.kills;
  game.touchMap();
}

/**
 * 评估函数：生命 − 以当前属性打完全部剩余怪物所需的总伤害（属性的价值因此随局面动态变化）
 * + 金币 / 钥匙的折算价值。中级卫兵（第一区无法战胜）不计入。
 */
function remainingDamage(h: { atk: number; def: number }): number {
  let s = 0;
  for (let f = 1; f <= LAST_FLOOR; f++) {
    for (const row of game.floors[f]) for (const c of row) {
      if (!c.monster || c.monster === 'blueGuard') continue;
      const d = forecastBattle({ ...game.hero, ...h }, MONSTERS[c.monster]).damage;
      s += Number.isFinite(d) ? Math.min(d, CAP) : CAP;
    }
  }
  return s;
}

/** 路线里程碑（铁剑 → 铁盾 → 红钥匙 → 第 10 层机关），用于引导搜索方向 */
function goal(): { f: number; p: Point; done: number } | null {
  const has = (f: number, x: number, y: number, item: string) => game.cell({ x, y }, f)?.item === item;
  if (game.cell({ x: 5, y: 3 }, 4)?.door === 'blue') return { f: 4, p: { x: 5, y: 2 }, done: -1 };
  if (has(5, 10, 10, 'ironSword')) return { f: 5, p: { x: 10, y: 10 }, done: 0 };
  if (has(9, 8, 6, 'ironShield')) return { f: 9, p: { x: 8, y: 6 }, done: 1 };
  if (has(8, 9, 1, 'redKey')) {
    for (const x of [8, 10]) if (game.cell({ x, y: 4 }, 8)?.monster) return { f: 8, p: { x, y: 4 }, done: 2 };
    return { f: 8, p: { x: 9, y: 1 }, done: 2 };
  }
  if (!game.flags.ambush10) return { f: 10, p: { x: 5, y: 4 }, done: 3 };
  return null;
}

/** 从当前位置到目标格的最小代价（怪物按当前属性的伤害、门按钥匙价值），跨楼层 Dijkstra */
function goalCost(g: { f: number; p: Point }): number {
  const dist = new Map<string, number>();
  const open: Array<{ f: number; p: Point; d: number }> = [{ f: game.floorId, p: { ...game.pos }, d: 0 }];
  dist.set(K(game.floorId, game.pos), 0);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].d < open[bi].d) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.d > (dist.get(K(cur.f, cur.p)) ?? Infinity)) continue;
    if (cur.f === g.f && cur.p.x === g.p.x && cur.p.y === g.p.y) return cur.d;
    for (const dv of Object.values(DIR_VEC)) {
      let n = { x: cur.p.x + dv.x, y: cur.p.y + dv.y };
      let nf = cur.f;
      const c = game.cell(n, cur.f);
      if (!c) continue;
      let step = 0;
      if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
        const a = arrival(cur.f, c.terrain === 'stairsUp' ? 'up' : 'down');
        if (!a) continue;
        nf = a.f;
        n = a.p;
      } else if (c.terrain === 'hiddenWall') step = 0;
      else if (c.terrain !== 'floor' || c.npc) continue;
      else if (c.door) {
        if (c.door === 'special' || c.door === 'iron') continue;
        const have = game.hero.keys[c.door] > 0;
        step = c.door === 'yellow' ? WY * (have ? 1 : 4) : c.door === 'blue' ? WY * (have ? 3 : 12) : have ? 300 : 3000;
      } else if (c.monster) {
        const fc = forecastBattle(game.hero, MONSTERS[c.monster]);
        step = fc.winnable ? fc.damage : 3000;
      }
      const nd = cur.d + step;
      const k = K(nf, n);
      if (nd < (dist.get(k) ?? Infinity)) {
        dist.set(k, nd);
        open.push({ f: nf, p: n, d: nd });
      }
    }
  }
  return 20000;
}

const GOAL_W = Number(process.env.SIM_GOAL ?? 4);
const FUT = Number(process.env.SIM_FUT ?? 25);

function evaluate(): number {
  const h = game.hero;
  const pro = prologue();
  const hp = pro ? PRISON_STATS.hp : h.hp;
  const base = pro ? { atk: PRISON_STATS.atk, def: PRISON_STATS.def } : { atk: h.atk, def: h.def };
  // 以「预期属性」估算剩余怪物伤害：尚未拿到的铁剑 / 铁盾计入，避免过早硬拼高伤害的怪物
  const stats = {
    atk: base.atk + (game.cell({ x: 10, y: 10 }, 5)?.item === 'ironSword' ? 10 : 0) + FUT,
    def: base.def + (game.cell({ x: 8, y: 6 }, 9)?.item === 'ironShield' ? 10 : 0) + FUT,
  };
  let v = hp - remainingDamage(stats) + h.gold * WG + h.keys.yellow * WY + h.keys.blue * WY * 3 + h.keys.red * 300;
  v += game.visited.size * 20;
  if (!pro && GOAL_W > 0) {
    const g = goal();
    v += g ? (g.done + 1) * 20000 - GOAL_W * Math.min(goalCost(g), 19000) : 100000;
  }
  if (game.flags.ambush10) v += 1e5;
  if (game.flags.captainDefeated) v += 1e6;
  return v;
}

function signature(): string {
  let sig = `${game.hero.hp},${game.hero.atk},${game.hero.def},${game.hero.gold},${JSON.stringify(game.hero.keys)},${game.flags.altarTimes ?? 0}|`;
  for (let f = 1; f <= LAST_FLOOR; f++) for (const row of game.floors[f]) for (const c of row) sig += c.monster || c.door || c.item || c.npc ? '1' : '0';
  return sig;
}

async function closure(log: string[]): Promise<void> {
  for (let i = 0; i < 400; i++) {
    const a = candidates().find((x) => x.free);
    if (!a) return;
    await act(a);
    log.push(fmt(a));
  }
}

function fmt(a: Action): string {
  const h = game.hero;
  return `${String(a.f).padStart(2)}F ${a.label.padEnd(16, '　')} → ${h.hp}/${h.atk}/${h.def}/${h.gold} 钥匙${h.keys.yellow}/${h.keys.blue}/${h.keys.red}`;
}

function cleared(): boolean {
  if (!game.flags.captainDefeated) return false;
  const up = game.cell({ x: 5, y: 10 }, 10);
  return up?.terrain === 'stairsUp' && reach().has(K(10, { x: 5, y: 9 }));
}

let steps = 0;
let finalLog: string[] = [];
async function run(): Promise<boolean> {
  const startLog: string[] = [];
  await closure(startLog);
  let beam: Snap[] = [snap(startLog)];
  for (let depth = 0; depth < Number(process.env.SIM_MAXDEPTH ?? 400) && beam.length; depth++) {
    const next = new Map<string, Snap>();
    for (const st of beam) {
      restore(st);
      const acts = candidates().filter((a) => !a.free && a.cost < game.hero.hp && (!a.trigger || triggerReady(a)));
      for (const a of acts) {
        restore(st);
        const log = [...st.log];
        await act(a);
        if (game.hero.hp <= 0) continue;
        log.push(fmt(a));
        await closure(log);
        steps++;
        if (cleared()) {
          finalLog = log;
          return true;
        }
        const sig = signature();
        const sc = evaluate();
        const prev = next.get(sig);
        if (!prev || prev.score < sc) {
          const s2 = snap(log);
          s2.score = sc;
          next.set(sig, s2);
        }
      }
    }
    beam = [...next.values()].sort((a, b) => b.score - a.score).slice(0, BEAM);
    if (beam[0]) {
      restore(beam[0]);
      finalLog = beam[0].log;
      if (depth % 20 === 0) console.log(`   深度 ${depth}：最优 ${game.floorId}F ${game.hero.hp}/${game.hero.atk}/${game.hero.def}/${game.hero.gold} 已到 ${[...game.visited].length} 层`);
    }
  }
  return false;
}

const QUICK = !!process.env.SIM_QUICK;
if (QUICK) console.log('\n（SIM_QUICK：跳过约 10 分钟的通关路线搜索，只做数值与规则检查）');
else {
const t0 = Date.now();
const isCleared = await run();
console.log(`\n—— 路线日志（共 ${finalLog.length} 步，搜索 ${steps} 个状态，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s；每步：楼层 动作 → 生命/攻击/防御/金币 钥匙黄/蓝/红）——`);
const routeText = finalLog.map((l, i) => `${String(i).padStart(4)} ${l}`).join('\n');
const TAG = (process.env.SIM_NOALTAR ? '-noaltar' : '') + (process.env.SIM_TAG ?? '');
if (!process.env.SIM_NOWRITE) fs.writeFileSync(`docs/zone1-route${TAG}.txt`, `第一区模拟路线（scripts/simulate.ts 生成）\n${routeText}\n`);
if (!process.env.SIM_NOWRITE && isCleared) fs.writeFileSync(`docs/zone1-end${TAG}.json`, JSON.stringify(game.serialize()));
console.log(routeText);
ok(game.flags.ambush3 === true && game.hero.weapon !== '神圣剑', '第 3 层魔王伏击：神圣剑盾被夺走，属性被重置');
ok(!!game.flags.captainDefeated, '击败骷髅队长（第 10 层头目），隐藏的上楼梯出现');
ok(isCleared, `第一区可通关：最终 生命 ${game.hero.hp} 攻击 ${game.hero.atk} 防御 ${game.hero.def} 金币 ${game.hero.gold} 钥匙 ${JSON.stringify(game.hero.keys)}`);
ok([...game.visited].length === LAST_FLOOR, `到达过的楼层：${[...game.visited].sort((a, b) => a - b).join(', ')}`);
console.log(`   祭坛供奉 ${game.flags.altarTimes ?? 0} 次，击败怪物 ${game.kills} 只`);
}

// 序章与伏击数值
{
  const g = new Game();
  ok(g.hero.hp === 1000 && g.hero.atk === 100 && g.hero.def === 100 && g.hero.weapon === '神圣剑', '序章初始属性 1000/100/100 + 神圣剑/神圣盾');
  ok(PRISON_STATS.hp === 400 && PRISON_STATS.atk === 10 && PRISON_STATS.def === 10, '伏击后属性 400/10/10');
  ok(g.hero.tools.fly === true, '魔杖开局即拥有（h5mota 51 号塔 startText：item:fly = 1）');
  // 回退所依赖的完整快照：保存 → 修改 → 恢复后完全一致
  const before = JSON.stringify({ ...g.serialize(), time: 0 });
  g.tryMove('up');
  g.hero.gold += 99;
  g.setCell({ x: 4, y: 9 }, null);
  g.deserialize(JSON.parse(before));
  ok(JSON.stringify({ ...g.serialize(), time: 0 }) === before, '完整快照恢复后状态一致（回退功能）');
  ok(altarPrice(0) === 20 && altarPrice(1) === 40 && altarPrice(2) === 80 && altarPrice(3) === 140, '祭坛价格 20/40/80/140…（20+10·t·(t+1)）');
}

/* ================================================================ 3. 临界公式对拍 */

let checked = 0;
for (const mon of Object.values(MONSTERS).filter((m) => H5_ZONE1.has(m.id))) {
  for (let atk = 1; atk <= 130; atk += 1) {
    for (const def of [0, 10, 25, 60, 120]) {
      const h = { ...cloneHero(HERO_START), atk, def };
      const c = nextCritical(h, mon);
      const cur = forecastBattle(h, mon);
      let expAtk = 0;
      let expReduce = 0;
      if (!cur.canAttack) expAtk = mon.def + 1 - atk;
      else if (cur.damage > 0) {
        for (let a = atk + 1; a <= mon.hp + mon.def; a++) {
          const n = forecastBattle({ ...h, atk: a }, mon).damage;
          if (n < cur.damage) {
            expAtk = a - atk;
            expReduce = cur.damage - n;
            break;
          }
        }
      }
      if (c.atk !== expAtk || (c.broken && c.reduce !== expReduce)) throw new Error(`临界不一致 ${mon.name} atk=${atk} def=${def}`);
      const d1 = defDamage(h, mon);
      if (cur.canAttack && d1 !== cur.damage - forecastBattle({ ...h, def: def + 1 }, mon).damage) throw new Error('1防减伤不一致');
      checked++;
    }
  }
}
ok(true, `临界 / 1防减伤公式对拍通过（${checked} 组）`);

if (failures) {
  console.log(`\n❌ 共 ${failures} 项失败`);
  process.exit(1);
}
console.log('\n✅ 全部通过');
