/**
 * 第三–五区可通关性检查用的「攻略引导的规划器」——直接在真实引擎（Game + Director + 全部剧情脚本）上执行。
 *
 * 与 margin2.ts 不同，这里不维护一份独立的模拟：每一步都由 g.tryMove 在真实游戏里走出来，
 * 战斗 / 开门 / 拾取 / 地图伤害 / 剧情（强制战斗、机关门、封印……）全部由游戏本身结算，因此规划结果就是重放结果。
 *
 * 规划方式（按用户建议，以网上攻略为种子，而不是盲目搜索）：
 *   - 每个区域有一份按攻略整理的里程碑清单（plan），例如「32F 祭坛：攻 ×3、防 ×2」「33F 骑士剑」「39F 3 点谜题」……
 *   - 里程碑之间用「贪心收集」：在当前可达范围内（多层 Dijkstra，代价 = 战斗伤害 + 地图伤害 + 钥匙折价），
 *     反复挑「价值 − 代价」最大且为正的道具 / 怪物（金币），直到没有划算的目标。
 *   - 价值：生命按回复量；宝石按「剩余怪物总伤害的边际减少量」；钥匙 / 道具按参数。
 */
import { forecastBattle } from '../src/game/combat';
import { Director, type ScriptHost } from '../src/game/director';
import { cloneHero, ITEMS } from '../src/game/entities';
import { FLOORS, stairTarget } from '../src/game/floors';
import { computeMapDamage } from '../src/game/mapdamage';
import { SCRIPTS, stepSpent } from '../src/game/scripts';
import { Game, type SaveData } from '../src/game/state';
import { DIR_VEC, type Dir, type HeroStats, type ItemId, type MonsterId, type Point } from '../src/game/types';

export interface PlanOpts {
  floors: number[];
  keyV: { yellow: number; blue: number; red: number };
  goldV: number;
  gemMin: number;
  toolV: number;
  /** 这些楼层的怪物只作为通路（不为金币专门去打；留给幸运金币） */
  holdFloors?: number[];
  /** 不去拿这些楼层 / 格子的道具（攻略里留到后面拿的） */
  skip?: (f: number, p: Point, item: ItemId) => boolean;
  /** 不主动打的怪物 */
  avoidMonster?: (f: number, p: Point, m: MonsterId) => boolean;
  safety?: number;
  /** 不能打开的门（如 39F 谜题门） */
  forbidDoor?: (f: number, p: Point) => boolean;
  /** 估算宝石价值时统计的楼层（默认 floors） */
  valueFloors?: number[];
  /** 估算宝石价值时，不能破防的怪物按多少伤害计 */
  cap?: number;
  /** 宝石边际价值的折扣（不是所有剩余怪物都会去打） */
  gemScale?: number;
  /** 单个收集目标路上的伤害上限（占当前生命的比例） */
  maxFrac?: number;
}

type Edge = 'walk' | 'stairs' | 'fly';
interface NodeInfo { f: number; p: Point; dist: number; dmg: number; used: { yellow: number; blue: number; red: number }; prev?: number; dir?: Dir; edge?: Edge }

export class Planner {
  g = new Game();
  d: Director;
  log: string[] = [];
  altarQueue: number[] = [];
  buy = false;
  sell = 0;
  opts: PlanOpts;
  constructor(save: SaveData, opts: PlanOpts) {
    this.g.deserialize(save, '');
    this.opts = opts;
    const self = this;
    const host: ScriptHost = {
      say: async () => {},
      choose: async (_w, text, options) => {
        if (text.startsWith('如果供奉')) return self.altarQueue.length ? self.altarQueue.shift()! : 3;
        if (text.includes('回收黄钥匙')) { if (self.sell > 0) { self.sell--; return 0; } return 1; }
        if (options[0] === '我太需要了') { const b = self.buy; self.buy = false; return b ? 0 : 1; }
        return 0;
      },
      wait: async () => {}, curtain: async () => {}, transition: async (fn) => fn(), tip: () => {}, autosave: () => {},
    };
    this.d = new Director(this.g, host);
  }

  hs(): string {
    const h = this.g.hero;
    return `${h.hp}/${h.atk}/${h.def} 金${h.gold} 钥${h.keys.yellow}/${h.keys.blue}/${h.keys.red}`;
  }
  note(s: string): void {
    this.log.push(s);
    if (process.env.P_VERBOSE) console.log(s);
  }

  key = (f: number, p: Point) => f * 1000 + p.y * 16 + p.x;

  /** 多层 Dijkstra（二叉堆）。allowStep：允许踏上的剧情格 */
  search(allowStep: Set<number> = new Set()): Map<number, NodeInfo> {
    const g = this.g;
    const hero = g.hero;
    const fl = new Set(this.opts.floors);
    const md = new Map<number, number[][]>();
    const mapDmg = (f: number) => {
      if (!md.has(f)) md.set(f, computeMapDamage(g.floors[f], (id) => g.monsterDef(id), hero).damage);
      return md.get(f)!;
    };
    const fc = new Map<string, number>();
    const fight = (m: MonsterId) => {
      if (!fc.has(m)) { const r = forecastBattle({ ...hero, hp: 1e12 }, g.monsterDef(m)); fc.set(m, r.canAttack ? r.damage : Infinity); }
      return fc.get(m)!;
    };
    const nodes = new Map<number, NodeInfo>();
    const start: NodeInfo = { f: g.floorId, p: { ...g.pos }, dist: 0, dmg: 0, used: { yellow: 0, blue: 0, red: 0 } };
    nodes.set(this.key(start.f, start.p), start);
    const heap: Array<[number, number]> = [[0, this.key(start.f, start.p)]];
    const push = (d: number, k: number) => {
      heap.push([d, k]);
      let i = heap.length - 1;
      while (i > 0) { const pi = (i - 1) >> 1; if (heap[pi][0] <= heap[i][0]) break; [heap[pi], heap[i]] = [heap[i], heap[pi]]; i = pi; }
    };
    const pop = () => {
      const top = heap[0]; const last = heap.pop()!;
      if (heap.length) {
        heap[0] = last; let i = 0;
        for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; }
      }
      return top;
    };
    const relax = (from: NodeInfo, fk: number, f: number, p: Point, cost: number, dmg: number, used: NodeInfo['used'], dir: Dir | undefined, edge: Edge) => {
      const k = this.key(f, p);
      const nd = from.dist + cost;
      const cur = nodes.get(k);
      if (cur && cur.dist <= nd) return;
      nodes.set(k, { f, p, dist: nd, dmg: from.dmg + dmg, used, prev: fk, dir, edge });
      push(nd, k);
    };
    const visited = [...g.visited].filter((v) => fl.has(v) && !FLOORS[v]?.noFly);
    while (heap.length) {
      const [dist, k] = pop();
      const n = nodes.get(k)!;
      if (dist > n.dist) continue;
      // 剧情格（未失效的踏点）只能作为终点
      if (k !== this.key(start.f, start.p)) {
        const sk = `${n.p.x},${n.p.y}`;
        if (SCRIPTS[n.f]?.step?.[sk] && !stepSpent(n.f, sk, g.flags) && !allowStep.has(k)) continue;
        // 怪物 / 门 / 暗墙所在格：到达即结算，可以继续前进
      }
      for (const [dir, v] of Object.entries(DIR_VEC) as Array<[Dir, Point]>) {
        const q = { x: n.p.x + v.x, y: n.p.y + v.y };
        const c = g.cell(q, n.f);
        if (!c) continue;
        if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
          const t = stairTarget(n.f, c.terrain === 'stairsUp' ? 'up' : 'down');
          if (!fl.has(t) || !FLOORS[t]) continue;
          const a = c.terrain === 'stairsUp' ? FLOORS[t].arriveFromBelow : FLOORS[t].arriveFromAbove;
          if (!a) continue;
          relax(n, k, t, a, 0.5, 0, n.used, dir, 'stairs');
          continue;
        }
        let ok = c.terrain === 'floor' || c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2' || (c.terrain === 'flower' && c.oneWay === dir);
        if (!ok || c.npc) continue;
        let cost = 1e-3, dmg = 0;
        let used = n.used;
        if (c.door) {
          if (c.door === 'special' || c.door === 'iron') continue;
          if (this.opts.forbidDoor?.(n.f, q)) continue;
          const kd = c.door;
          if (n.used[kd] + 1 > hero.keys[kd]) continue;
          used = { ...n.used, [kd]: n.used[kd] + 1 };
          cost += this.opts.keyV[kd];
        }
        if (c.monster) {
          const x = fight(c.monster);
          if (!Number.isFinite(x)) continue;
          dmg += x;
        } else if (!c.door) {
          dmg += mapDmg(n.f)[q.y][q.x];
        }
        if (n.dmg + dmg >= hero.hp - (this.opts.safety ?? 0)) continue;
        cost += dmg;
        ok = true;
        relax(n, k, n.f, q, cost, dmg, used, dir, 'walk');
      }
      // 魔杖：楼梯旁可以飞往到过的楼层
      if (hero.tools.fly && !FLOORS[n.f]?.noFly && this.nearStairs(n.f, n.p)) {
        for (const v of visited) {
          if (v === n.f) continue;
          const a = v > n.f ? FLOORS[v].arriveFromBelow : FLOORS[v].arriveFromAbove;
          if (a) relax(n, k, v, a, 0.5, 0, n.used, undefined, 'fly');
        }
      }
    }
    return nodes;
  }

  nearStairs(f: number, p: Point): boolean {
    for (const d of [{ x: 0, y: 0 }, ...Object.values(DIR_VEC)]) {
      const c = this.g.cell({ x: p.x + d.x, y: p.y + d.y }, f);
      if (c && (c.terrain === 'stairsUp' || c.terrain === 'stairsDown')) return true;
    }
    return false;
  }

  /** 沿 search 结果走到 k（真实引擎执行）。返回是否到达 */
  async walkTo(nodes: Map<number, NodeInfo>, k: number): Promise<boolean> {
    const g = this.g;
    const path: NodeInfo[] = [];
    for (let x: number | undefined = k; x !== undefined && nodes.get(x)!.prev !== undefined; x = nodes.get(x)!.prev) path.unshift(nodes.get(x)!);
    for (const n of path) {
      if (n.edge === 'fly') {
        if (!g.nearStairs()) return this.fail(`魔杖：${g.floorId}F (${g.pos.x},${g.pos.y}) 不在楼梯旁`);
        g.flyTo(n.f);
        await this.d.settle();
      } else {
        for (let tries = 0; tries < 4; tries++) {
          if (g.floorId === n.f && g.pos.x === n.p.x && g.pos.y === n.p.y) break;
          g.tryMove(n.dir!);
          await this.d.settle();
          if (g.dead) return this.fail(`阵亡于 ${g.floorId}F (${g.pos.x},${g.pos.y})`);
        }
      }
      if (g.floorId !== n.f || g.pos.x !== n.p.x || g.pos.y !== n.p.y) return this.fail(`没能走到 ${n.f}F (${n.p.x},${n.p.y})，停在 ${g.floorId}F (${g.pos.x},${g.pos.y})`);
    }
    return true;
  }

  fail(msg: string): false {
    this.note(`  ✗ ${msg}`);
    return false;
  }

  /** 能否走到 (f,p)：返回路上伤害（不可达为 null） */
  probe(f: number, p: Point): number | null {
    const k = this.key(f, p);
    const n = this.search(new Set([k])).get(k);
    return n ? n.dmg : null;
  }

  /** 走到 (f,p)（可以是剧情踏点） */
  async reach(f: number, p: Point, label = ''): Promise<boolean> {
    const k = this.key(f, p);
    const nodes = this.search(new Set([k]));
    if (!nodes.has(k)) return this.fail(`${label} 无法到达 ${f}F (${p.x},${p.y})（${this.hs()}）`);
    const h0 = this.g.hero.hp;
    const ok = await this.walkTo(nodes, k);
    if (ok) this.note(`→ ${label || `${f}F (${p.x},${p.y})`}：生命 ${h0}→${this.hs()}`);
    return ok;
  }

  /** 走到 (f,p) 旁边，然后朝它撞一下（对话 / 祭坛 / 攻击 / 撞墙） */
  async bump(f: number, p: Point, label = '', times = 1): Promise<boolean> {
    const nodes = this.search();
    let best: number | null = null;
    for (const v of Object.values(DIR_VEC)) {
      const k = this.key(f, { x: p.x - v.x, y: p.y - v.y });
      const n = nodes.get(k);
      if (n && (best === null || n.dist < nodes.get(best)!.dist)) best = k;
    }
    if (best === null) return this.fail(`${label} 无法走到 ${f}F (${p.x},${p.y}) 旁边（${this.hs()}）`);
    const h0 = this.g.hero.hp;
    if (!(await this.walkTo(nodes, best))) return false;
    const g = this.g;
    const dir = (Object.entries(DIR_VEC) as Array<[Dir, Point]>).find(([, v]) => g.pos.x + v.x === p.x && g.pos.y + v.y === p.y)![0];
    for (let i = 0; i < times; i++) {
      g.tryMove(dir);
      await this.d.settle();
      if (g.dead) return this.fail(`阵亡于 ${label}`);
    }
    this.note(`→ ${label || `撞向 ${f}F (${p.x},${p.y})`}：生命 ${h0}→${this.hs()}`);
    return true;
  }

  /** 剩余怪物（opts.floors 范围内）的总伤害（不能破防的按 cap 计） */
  remaining(h: HeroStats, cap = this.opts.cap ?? 3000): number {
    let t = 0;
    for (const f of this.opts.valueFloors ?? this.opts.floors) for (const row of this.g.floors[f]) for (const c of row) if (c.monster) {
      const x = forecastBattle({ ...h, hp: 1e12 }, this.g.monsterDef(c.monster)).damage;
      t += Number.isFinite(x) ? Math.min(x, cap) : cap;
    }
    return t;
  }

  /** 贪心收集：重复挑价值 − 代价最大的目标 */
  async collect(label: string, maxIter = 300, filter?: (f: number, p: Point) => boolean): Promise<boolean> {
    const g = this.g;
    for (let it = 0; it < maxIter; it++) {
      const nodes = this.search();
      const h = g.hero;
      const base = this.remaining(h);
      const gs = this.opts.gemScale ?? 1;
      const sa = Math.max(this.opts.gemMin, gs * (base - this.remaining({ ...h, atk: h.atk + 1 })));
      const sd = Math.max(this.opts.gemMin, gs * (base - this.remaining({ ...h, def: h.def + 1 })));
      let best: { k: number; v: number; what: string } | null = null;
      for (const [k, n] of nodes) {
        if (filter && !filter(n.f, n.p)) continue;
        if (n.dmg > h.hp * (this.opts.maxFrac ?? 1)) continue;
        const c = g.cell(n.p, n.f)!;
        let v = 0, what = '';
        if (c.item) {
          if (this.opts.skip?.(n.f, n.p, c.item)) continue;
          const h2 = cloneHero(h);
          ITEMS[c.item].apply(h2, FLOORS[n.f].ratio);
          v = (h2.hp - h.hp) + sa * (h2.atk - h.atk) + sd * (h2.def - h.def)
            + this.opts.keyV.yellow * (h2.keys.yellow - h.keys.yellow) + this.opts.keyV.blue * (h2.keys.blue - h.keys.blue) + this.opts.keyV.red * (h2.keys.red - h.keys.red)
            + this.opts.goldV * (h2.gold - h.gold);
          for (const b of Object.keys(h2.bag ?? {}) as ItemId[]) v += this.opts.toolV * ((h2.bag?.[b] ?? 0) - (h.bag?.[b] ?? 0)) * (b === 'superPotion' ? 0 : 1);
          if (c.item === 'superPotion') v += Math.round(0.74 * (h.atk + h.def)) * 10;
          what = ITEMS[c.item].name;
        } else if (c.monster && !this.opts.holdFloors?.includes(n.f) && !this.opts.avoidMonster?.(n.f, n.p, c.monster)) {
          const m = g.monsterDef(c.monster);
          v = this.opts.goldV * m.gold * (h.tools.coin ? 2 : 1);
          what = m.name;
        } else continue;
        const score = v - n.dist;
        if (score > 0 && (!best || score > best.v)) best = { k, v: score, what };
      }
      if (!best) return true;
      const n = nodes.get(best.k)!;
      const h0 = h.hp;
      if (!(await this.walkTo(nodes, best.k))) return false;
      this.note(`  · ${label} ${n.f}F (${n.p.x},${n.p.y}) ${best.what}：${h0}→${this.hs()}`);
    }
    return true;
  }

  async altar(f: number, p: Point, picks: number[]): Promise<boolean> {
    this.altarQueue = [...picks];
    const ok = await this.bump(f, p, `${f}F 祭坛 ${picks.map((x) => ['生命', '攻击', '防御'][x]).join('、')}`);
    if (this.altarQueue.length) this.note(`  ! 祭坛：金币不足，未买 ${this.altarQueue.length} 次`);
    this.altarQueue = [];
    return ok;
  }

  async trade(f: number, p: Point, label: string): Promise<boolean> {
    this.buy = true;
    const ok = await this.bump(f, p, label);
    this.buy = false;
    return ok;
  }

  snapshot(label: string): string {
    const s = `■ ${label}：${this.g.floorId}F ${this.hs()} 祭坛 ${this.g.flags.altarTimes ?? 0} 次 背包 ${JSON.stringify(this.g.hero.bag)}`;
    this.note(s);
    return s;
  }
}
