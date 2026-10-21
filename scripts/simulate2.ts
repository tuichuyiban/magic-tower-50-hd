/**
 * 第二区（11F–20F）离线校验：
 *  1. 第二区怪物数值与原版数据快照（docs/h5-51-source/enemys.js，来源 A）逐项比对，并与来源 C
 *     （h5mota 论坛 tid=1551 怪物表 / 萌娘百科「魔塔（50层）」条目，二者一致）交叉核对；无特殊能力；
 *  2. 十字架（攻击加倍）、圣水公式、镐的可破坏判定、2 处隐藏红钥匙之一（14F）等规则检查；
 *  3. （实验性，SIM_BEAMSEARCH=1）从第一区路线终局继续的束搜索；在 6 组以上参数下都没能通关（最远 17F），
 *     因此第二区的通关证明改由 scripts/margin2.ts（贪心规划 + 真实引擎重放，npm run route2）给出。
 * 运行：npx tsx scripts/simulate2.ts（默认只做 1、2）
 */
import fs from 'node:fs';
import { forecastBattle, nextCritical } from '../src/game/combat';
import { Director, type ScriptHost } from '../src/game/director';
import { bagCount, ITEMS, MONSTERS, superPotionHeal, TEST_HERO, ZONE1_ROUTE_END } from '../src/game/entities';
import { FLOORS } from '../src/game/floors';
import { altarPrice } from '../src/game/scripts';
import { RING20 } from '../src/game/scripts2';
import { Game, type SaveData } from '../src/game/state';
import { DIR_VEC, type Dir, type HeroStats, type MonsterId, type Point } from '../src/game/types';

const LAST = 20;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) failures++;
};

/* ================================================================ 1. 数据核对 */

const ZONE2_MONSTERS: MonsterId[] = ['blackSlime', 'bigBat', 'zombie', 'zombieKnight', 'rock', 'slimeMan', 'redPriest', 'octopus', 'vampire'];
// 来源 C：h5mota 论坛 tid=1551「魔塔50层 怪物数据」与萌娘百科条目（生命/攻击/防御/金币）
const SOURCE_C: Record<string, [number, number, number, number]> = {
  blackSlime: [130, 60, 3, 8], bigBat: [60, 100, 8, 12], zombie: [260, 85, 5, 18], zombieKnight: [320, 120, 15, 30],
  rock: [20, 100, 68, 28], slimeMan: [320, 140, 20, 30], redPriest: [100, 95, 30, 22], octopus: [1200, 180, 20, 100], vampire: [444, 199, 66, 144],
};
{
  const src = fs.readFileSync('docs/h5-51-source/enemys.js', 'utf8');
  const E = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1)) as Record<string, { name: string; hp: number; atk: number; def: number; money: number; special: number | number[] }>;
  for (const id of ZONE2_MONSTERS) {
    const m = MONSTERS[id];
    const e = E[id];
    const special = Array.isArray(e.special) ? e.special.length : e.special;
    ok(!!e && e.hp === m.hp && e.atk === m.atk && e.def === m.def && e.money === m.gold && !special, `${m.name}: 本作 ${m.hp}/${m.atk}/${m.def}/${m.gold} — 来源 A「${e?.name}」${e?.hp}/${e?.atk}/${e?.def}/${e?.money} 特殊能力 ${special || '无'}`);
    const c = SOURCE_C[id];
    ok(c[0] === m.hp && c[1] === m.atk && c[2] === m.def && c[3] === m.gold, `   └ 来源 C 交叉核对 ${m.name}: ${c.join('/')}`);
  }
  // 第二区所有楼层上出现的怪物都已核对（初级卫兵 / 小蝙蝠 为第一区怪物，已在 simulate.ts 中核对）
  const seen = new Set<MonsterId>();
  for (let f = 11; f <= LAST; f++) {
    const g = new Game();
    for (const row of g.floors[f]) for (const c of row) if (c.monster) seen.add(c.monster);
  }
  const unk = [...seen].filter((m) => !ZONE2_MONSTERS.includes(m) && !['bat', 'yellowGuard'].includes(m));
  ok(unk.length === 0, `第二区楼层上的怪物种类：${[...seen].map((m) => MONSTERS[m].name).join('、')}`);
}

/* ================================================================ 2. 规则检查 */
{
  const g = new Game();
  const h: HeroStats = { ...g.hero, atk: 60, def: 80 };
  const z = MONSTERS.zombie;
  const noCross = forecastBattle(h, z);
  const withCross = forecastBattle({ ...h, tools: { ...h.tools, cross: true } }, z);
  ok(noCross.heroHit === 55 && withCross.heroHit === 115, `十字架：对兽人每回合伤害 55 → ${withCross.heroHit}（攻击 ×2）`);
  ok(forecastBattle({ ...h, tools: { ...h.tools, cross: true } }, MONSTERS.rock).heroHit === 0, '十字架对石头人无效');
  const vNo = forecastBattle({ ...h, atk: 60 }, MONSTERS.vampire);
  const vYes = forecastBattle({ ...h, atk: 60, tools: { ...h.tools, cross: true } }, MONSTERS.vampire);
  ok(!vNo.canAttack && vYes.canAttack, `吸血鬼（防御 66）：攻击 60 无十字架无法破防，有十字架每回合 ${vYes.heroHit}`);
  // 十字架下的临界值：按面板攻击换算
  const hc = { ...h, atk: 40, tools: { ...h.tools, cross: true } };
  const crit = nextCritical(hc, z);
  const after = forecastBattle({ ...hc, atk: hc.atk + crit.atk }, z).damage;
  const before = forecastBattle(hc, z).damage;
  const just = forecastBattle({ ...hc, atk: hc.atk + crit.atk - 1 }, z).damage;
  ok(after < before && just === before, `十字架临界：攻击 +${crit.atk} 时伤害 ${before} → ${after}`);
  ok(superPotionHeal({ ...h, atk: 100, def: 100 }) === 1480, '圣水：攻击 100 + 防御 100 → 生命 +1480（round(0.74×200)×10）');
  // 镐：只破坏普通墙 / 暗墙
  g.changeFloor(12, { x: 9, y: 0 }); // 四周：(8,0) 空地、(10,0) fakeWall2、(9,1) 普通墙
  const t = g.pickaxeTargets().map((p) => `${p.x},${p.y}`);
  ok(t.join(' ') === '9,1', `镐只破坏普通墙 / 暗墙，不能破坏 fakeWall2（12F 10,0）：可破坏 ${t.join(' ') || '无'}`);
  g.changeFloor(3, { x: 4, y: 5 }); // (4,6) 为 whiteWall2（坚固的墙，魔王登场处）
  ok(!g.pickaxeTargets().some((p) => p.x === 4 && p.y === 6) && g.cell({ x: 4, y: 6 })!.terrain === 'solidWall', '镐不能破坏 whiteWall2（3F 4,6）');
  ok(altarPrice(4) === 220 && FLOORS[12].ratio === 2, '12F 祭坛：倍率 2（攻击 +4 / 防御 +8），与 4F 共用供奉次数');
  ok(TEST_HERO.atk === ZONE1_ROUTE_END.atk + 100 && TEST_HERO.def === ZONE1_ROUTE_END.def + 100 && TEST_HERO.hp >= 10000, `试玩模式属性 ${TEST_HERO.hp}/${TEST_HERO.atk}/${TEST_HERO.def}（第一区路线终局 + 100）`);
}

/* ================================================================ 3. 路线搜索 */

const TRIGGERS: Record<number, Array<{ p: Point; flag: string }>> = {
  20: [{ p: { x: 5, y: 7 }, flag: 'vampire20' }],
};
const RING = new Set(RING20.map((p) => `${p.x},${p.y}`));

let shopPlan: number | null = null;
let buyPlan = false;
const game = new Game();
const host: ScriptHost = {
  say: async () => {},
  choose: async (_who, text, options) => {
    if (text.startsWith('如果供奉')) {
      const pick = shopPlan ?? 3;
      shopPlan = null;
      return pick;
    }
    if (options[0] === '我太需要了') {
      const b = buyPlan;
      buyPlan = false; // 只买一次
      return b ? 0 : 1;
    }
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
const isTrigger = (f: number, p: Point) => (TRIGGERS[f] ?? []).some((t) => t.p.x === p.x && t.p.y === p.y && !game.flags[t.flag]);

function passable(f: number, p: Point): boolean {
  const c = game.cell(p, f);
  if (!c || c.terrain !== 'floor' || c.door || c.monster || c.npc) return false;
  return !isTrigger(f, p);
}

function arrival(f: number, dir: 'up' | 'down'): { f: number; p: Point } | null {
  const t = f + (dir === 'up' ? 1 : -1);
  const fl = FLOORS[t];
  if (!fl || t > LAST) return null;
  const p = dir === 'up' ? fl.arriveFromBelow : fl.arriveFromAbove;
  return p ? { f: t, p } : null;
}

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

interface Action {
  f: number;
  from: Point;
  to: Point;
  free?: boolean;
  cost: number;
  label: string;
  shop?: number;
  buy?: boolean;
  drink?: boolean;
  trigger?: boolean;
}

const dirTo = (a: Point, b: Point): Dir => (b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up');

const CAP = Number(process.env.SIM_CAP ?? 3000);
const FUT = Number(process.env.SIM_FUT ?? 30);
const WG = Number(process.env.SIM_WG ?? 3);
const WY = Number(process.env.SIM_WY ?? 60);
const BEAM = Number(process.env.SIM_BEAM ?? 60);
const GOAL_W = Number(process.env.SIM_GOAL ?? 3);
/** 里程碑顺序：shield（默认，银盾→银剑）或 sword（银剑→银盾） */
const ORDER = process.env.SIM_ORDER ?? 'shield';

/** 剩余全部怪物（含尚未现身的吸血鬼）的总伤害；20F 包围圈的蝙蝠只是吸血鬼的化身，不计入 */
function remainingDamage(st: { atk: number; def: number }): number {
  let s = 0;
  const h = { ...game.hero, ...st };
  for (let f = 1; f <= LAST; f++) {
    game.floors[f].forEach((row, y) =>
      row.forEach((c, x) => {
        if (!c.monster || c.monster === 'blueGuard') return;
        if (f === 20 && RING.has(`${x},${y}`)) return;
        const d = forecastBattle(h, MONSTERS[c.monster]).damage;
        s += Number.isFinite(d) ? Math.min(d, CAP) : CAP;
      }),
    );
  }
  if (!game.flags.vampire20) {
    const d = forecastBattle(h, MONSTERS.vampire).damage;
    s += Number.isFinite(d) ? Math.min(d, CAP * 2) : CAP * 2;
  }
  return s;
}

/** 最小堆（goalCost 的 Dijkstra 用） */
class Heap<T> {
  private a: Array<{ k: number; v: T }> = [];
  get size() {
    return this.a.length;
  }
  push(k: number, v: T): void {
    const a = this.a;
    a.push({ k, v });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].k <= a[i].k) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): { k: number; v: T } {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].k < a[m].k) m = l;
        if (r < a.length && a[r].k < a[m].k) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

function candidates(): Action[] {
  const R = reach();
  const acts: Action[] = [];
  const seenT = new Set<string>();
  const push = (tk: string, a: Action) => {
    seenT.add(tk);
    acts.push(a);
  };
  const h = game.hero;
  if (bagCount(h, 'superPotion') > 0) acts.push({ f: game.floorId, from: game.pos, to: game.pos, cost: 0, drink: true, label: `喝圣水(+${superPotionHeal(h)})` });
  for (const { f, p } of R.values()) {
    const here = game.cell(p, f)!;
    if (here.item && !seenT.has(K(f, p))) {
      for (const d of Object.values(DIR_VEC)) {
        const from = { x: p.x - d.x, y: p.y - d.y };
        if (R.has(K(f, from)) && !seenT.has(K(f, p))) push(K(f, p), { f, from, to: p, free: true, cost: 0, label: `拾取${ITEMS[here.item].name}` });
      }
    }
    for (const d of Object.values(DIR_VEC)) {
      const t = { x: p.x + d.x, y: p.y + d.y };
      const tk = K(f, t);
      if (R.has(tk) || seenT.has(tk)) continue;
      const c = game.cell(t, f);
      if (!c) continue;
      if (c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2') push(tk, { f, from: p, to: t, free: true, cost: 0, label: '撞开暗墙' });
      else if (c.npc === 'altar') {
        const times = Number(game.flags.altarTimes ?? 0);
        const price = altarPrice(times);
        if (h.gold >= price) {
          const ratio = FLOORS[f].ratio;
          for (const opt of [0, 1, 2]) push(tk + `#${opt}`, { f, from: p, to: t, cost: 0, shop: opt, label: `${f}F祭坛${price}金币（${['生命', '攻击', '防御'][opt]}${opt === 1 ? `+${2 * ratio}` : opt === 2 ? `+${4 * ratio}` : ''}）` });
        }
      } else if (c.npc === 'trader') {
        if (game.flags[`trader${f}`]) push(tk, { f, from: p, to: t, free: true, cost: 0, label: `${f}F商人情报` });
        else if ((f === 12 && h.gold >= 800) || (f === 15 && h.gold >= 200) || (f < 11 && h.gold >= 50)) push(tk, { f, from: p, to: t, cost: 0, buy: true, label: `${f}F商人买钥匙` });
      } else if (c.npc === 'specialTrader') {
        if (h.gold >= 1000) push(tk, { f, from: p, to: t, cost: 0, buy: true, label: '12F特殊商人 1000 金币买黄钥匙' });
      } else if (c.npc) push(tk, { f, from: p, to: t, free: true, cost: 0, label: `${f}F NPC 对话` });
      else if (c.door) {
        if (c.door === 'special' || c.door === 'iron' || h.keys[c.door] <= 0) continue;
        push(tk, { f, from: p, to: t, cost: 0, label: `${f}F开${{ yellow: '黄', blue: '蓝', red: '红' }[c.door]}门` });
      } else if (c.monster) {
        if (f === 20 && RING.has(`${t.x},${t.y}`) && !game.flags.vampire20) continue;
        const fc = forecastBattle(h, MONSTERS[c.monster]);
        if (!fc.winnable) continue;
        push(tk, { f, from: p, to: t, free: fc.damage === 0, cost: fc.damage, label: `${f}F打${MONSTERS[c.monster].name}(-${fc.damage})` });
      } else if (c.terrain === 'floor' && isTrigger(f, t)) {
        push(tk, { f, from: p, to: t, cost: 0, trigger: true, label: '20F 吸血鬼现身' });
      }
    }
  }
  return acts;
}

async function act(a: Action): Promise<void> {
  if (a.drink) {
    game.useSuperPotion();
    return;
  }
  if (a.f !== game.floorId) game.changeFloor(a.f, a.from);
  else game.pos = { ...a.from };
  if (a.shop !== undefined) shopPlan = a.shop;
  buyPlan = !!a.buy;
  game.tryMove(dirTo(a.from, a.to));
  await director.settle();
  buyPlan = false;
}

/** 触发吸血鬼前确认：现身后被关在包围圈里，必须能直接战胜 */
const triggerReady = () => forecastBattle(game.hero, MONSTERS.vampire).winnable;

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
const snap = (log: string[]): Snap =>
  structuredClone({ floors: game.floors, hero: game.hero, flags: game.flags, visited: [...game.visited], floorId: game.floorId, pos: game.pos, kills: game.kills, log, score: 0 });
function restore(s: Snap): void {
  const c = structuredClone({ floors: s.floors, hero: s.hero, flags: s.flags, pos: s.pos });
  game.floors = c.floors;
  game.hero = c.hero;
  game.flags = c.flags;
  game.visited = new Set(s.visited);
  game.floorId = s.floorId;
  game.pos = c.pos;
  game.kills = s.kills;
}

/** 里程碑：银盾（11F）与银剑（17F）（顺序见 SIM_ORDER）→ 十字架（19F 暗墙）→ 20F 吸血鬼 */
function goal(): { f: number; p: Point; done: number } | null {
  const has = (f: number, x: number, y: number, item: string) => game.cell({ x, y }, f)?.item === item;
  const shield = has(11, 1, 1, 'silverShield');
  const sword = has(17, 1, 1, 'silverSword');
  if (ORDER === 'sword') {
    if (sword) return { f: 17, p: { x: 1, y: 1 }, done: 0 };
    if (shield) return { f: 11, p: { x: 1, y: 1 }, done: 1 };
  } else {
    if (shield) return { f: 11, p: { x: 1, y: 1 }, done: 0 };
    if (sword) return { f: 17, p: { x: 1, y: 1 }, done: 1 };
  }
  if (!game.hero.tools.cross) return { f: 19, p: { x: 5, y: 2 }, done: 2 };
  if (!game.flags.vampire20) return { f: 20, p: { x: 5, y: 7 }, done: 3 };
  return null;
}

function goalCost(g: { f: number; p: Point }): number {
  const dist = new Map<string, number>();
  const open = new Heap<{ f: number; p: Point; d: number }>();
  open.push(0, { f: game.floorId, p: { ...game.pos }, d: 0 });
  dist.set(K(game.floorId, game.pos), 0);
  while (open.size) {
    const cur = open.pop().v;
    if (cur.d > (dist.get(K(cur.f, cur.p)) ?? Infinity)) continue;
    if (cur.f === g.f && cur.p.x === g.p.x && cur.p.y === g.p.y) return cur.d;
    for (const dv of Object.values(DIR_VEC)) {
      let n = { x: cur.p.x + dv.x, y: cur.p.y + dv.y };
      let nf = cur.f;
      const c = game.cell(n, cur.f);
      if (!c) continue;
      let step = 0;
      const isGoal = cur.f === g.f && n.x === g.p.x && n.y === g.p.y;
      if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
        const a = arrival(cur.f, c.terrain === 'stairsUp' ? 'up' : 'down');
        if (!a) continue;
        nf = a.f;
        n = a.p;
      } else if (c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2') step = 0;
      else if (c.terrain !== 'floor' || c.npc) continue;
      else if (c.door) {
        if (c.door === 'special' || c.door === 'iron') continue;
        const have = game.hero.keys[c.door] > 0;
        step = c.door === 'yellow' ? WY * (have ? 1 : 4) : c.door === 'blue' ? WY * (have ? 3 : 12) : have ? 300 : 3000;
      } else if (c.monster) {
        const fc = forecastBattle(game.hero, MONSTERS[c.monster]);
        step = fc.winnable ? fc.damage : 3000;
      } else if (!isGoal && isTrigger(cur.f, n)) continue;
      const nd = cur.d + step;
      const k = K(nf, n);
      if (nd < (dist.get(k) ?? Infinity)) {
        dist.set(k, nd);
        open.push(nd, { f: nf, p: n, d: nd });
      }
    }
  }
  return 20000;
}

function evaluate(): number {
  const h = game.hero;
  const stats = {
    atk: h.atk + (game.cell({ x: 1, y: 1 }, 17)?.item === 'silverSword' ? 20 : 0) + FUT,
    def: h.def + (game.cell({ x: 1, y: 1 }, 11)?.item === 'silverShield' ? 20 : 0) + FUT,
  };
  let v = h.hp + bagCount(h, 'superPotion') * superPotionHeal(h) - remainingDamage(stats) + h.gold * WG + h.keys.yellow * WY + h.keys.blue * WY * 3 + h.keys.red * 400;
  v += game.visited.size * 20;
  const g = goal();
  v += g ? (g.done + 1) * 20000 - GOAL_W * Math.min(goalCost(g), 19000) : 100000;
  if (game.flags.vampire20) v += 1e5;
  if (game.flags.vampireDefeated) v += 1e6;
  return v;
}

function signature(): string {
  let sig = `${game.hero.hp},${game.hero.atk},${game.hero.def},${game.hero.gold},${JSON.stringify(game.hero.keys)},${game.flags.altarTimes ?? 0},${bagCount(game.hero, 'superPotion')}|`;
  for (let f = 1; f <= LAST; f++) for (const row of game.floors[f]) for (const c of row) sig += c.monster || c.door || c.item || c.npc || c.terrain === 'hiddenWall2' ? '1' : '0';
  return sig;
}

function fmt(a: Action): string {
  const h = game.hero;
  return `${String(game.floorId).padStart(2)}F ${a.label.padEnd(18, '　')} → ${h.hp}/${h.atk}/${h.def}/${h.gold} 钥匙${h.keys.yellow}/${h.keys.blue}/${h.keys.red}`;
}

async function closure(log: string[]): Promise<void> {
  for (let i = 0; i < 400; i++) {
    const a = candidates().find((x) => x.free);
    if (!a) return;
    await act(a);
    log.push(fmt(a));
  }
}

function cleared(): boolean {
  return !!game.flags.vampireDefeated && reach().has(K(20, { x: 5, y: 1 }));
}

const T0 = Date.now();
let steps = 0;
let finalLog: string[] = [];
async function run(): Promise<boolean> {
  const startLog: string[] = [];
  await closure(startLog);
  let beam: Snap[] = [snap(startLog)];
  for (let depth = 0; depth < 500 && beam.length; depth++) {
    const next = new Map<string, Snap>();
    for (const st of beam) {
      restore(st);
      const acts = candidates().filter((a) => !a.free && a.cost < game.hero.hp && (!a.trigger || triggerReady()));
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
      if (depth % 10 === 0) console.log(`   [${((Date.now() - T0) / 1000).toFixed(0)}s] 深度 ${depth}：最优 ${game.floorId}F ${game.hero.hp}/${game.hero.atk}/${game.hero.def}/${game.hero.gold} 钥匙${JSON.stringify(game.hero.keys)} 已到 ${game.visited.size} 层 目标 ${goal()?.done ?? 'done'}`);
    }
  }
  return false;
}

if (process.env.SIM_QUICK || !process.env.SIM_BEAMSEARCH) console.log('\n（通关路线由 scripts/margin2.ts 规划并在真实引擎中重放：npm run route2；这里的束搜索为实验性，需 SIM_BEAMSEARCH=1，见 docs/research.md §12.10）');
else {
  const end = JSON.parse(fs.readFileSync('docs/zone1-end.json', 'utf8')) as SaveData;
  game.deserialize(end);
  const h0 = { ...game.hero };
  console.log(`\n第二区路线搜索：起点 = 第一区路线终局 生命 ${h0.hp} 攻击 ${h0.atk} 防御 ${h0.def} 金币 ${h0.gold} 钥匙 ${JSON.stringify(h0.keys)}`);
  const t0 = Date.now();
  const isCleared = await run();
  const routeText = finalLog.map((l, i) => `${String(i).padStart(4)} ${l}`).join('\n');
  console.log(`\n—— 路线日志（共 ${finalLog.length} 步，搜索 ${steps} 个状态，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s）——`);
  console.log(routeText);
  const OUTDIR = process.env.SIM_OUTDIR ?? '/tmp';
  if (!process.env.SIM_NOWRITE) {
    fs.writeFileSync(`${OUTDIR}/zone2-route.txt`, `第二区模拟路线（scripts/simulate2.ts 生成；起点为 docs/zone1-end.json）\n每步：楼层 动作 → 生命/攻击/防御/金币 钥匙黄/蓝/红\n${routeText}\n`);
    if (isCleared) fs.writeFileSync(`${OUTDIR}/zone2-end.json`, JSON.stringify(game.serialize()));
  }
  const h = game.hero;
  ok(!!game.flags.vampireDefeated, '击败吸血鬼（第 20 层头目）');
  ok(isCleared, `第二区可通关：最终 生命 ${h.hp} 攻击 ${h.atk} 防御 ${h.def} 金币 ${h.gold} 钥匙 ${JSON.stringify(h.keys)} 十字架 ${h.tools.cross ? '有' : '无'} 圣水 ${bagCount(h, 'superPotion')}`);
  ok([11, 12, 13, 14, 15, 16, 17, 18, 19, 20].every((f) => game.visited.has(f)), `到达过的楼层：${[...game.visited].sort((a, b) => a - b).join(', ')}`);
  console.log(`   祭坛共供奉 ${game.flags.altarTimes ?? 0} 次，累计击败怪物 ${game.kills} 只`);
}

if (failures) {
  console.log(`\n❌ 共 ${failures} 项失败`);
  process.exit(1);
}
console.log('\n✅ 全部通过');
