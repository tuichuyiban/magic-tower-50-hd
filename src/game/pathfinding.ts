import { motion } from './speed';
import type { Game } from './state';
import { DIR_VEC, type Cell, type Dir, type Point } from './types';

/**
 * 点击寻路（参照 H5 魔塔样板 mota-js `maps._automaticRoute_bfs`）：
 *  - 广度优先搜索最短路径；终点本身允许是怪物 / 门 / 道具（最后一步会触发交互）；
 *  - 途中不可经过 noPass 的格子：墙、未开的门、怪物；
 *  - 途中道具可通行（与样板相同，路过时会被拾取）；
 *  - 楼梯不作为中间路径（避免寻路途中意外换层）。
 */
export function passableMidway(c: Cell): boolean {
  return c.terrain === 'floor' && !c.door && !c.monster && !c.npc;
}

/** 不能作为点击寻路终点的地形。暗墙可以作为终点（像门一样走到旁边后撞开），但仍不可作为中间路径 */
const SOLID = new Set<Cell['terrain']>(['wall', 'sealedWall', 'airwall', 'altarL', 'altarR', 'solidWall', 'lava', 'star']);

/**
 * 点击寻路（含地图伤害的路线安全）：
 *  1. 先只走没有领域 / 夹击伤害的格子（样板 _automaticRoute：有伤害的格子代价极高）；
 *  2. 找不到时，用 Dijkstra 选总地图伤害最小的路线；累计伤害 ≥ 当前生命的路线一律拒绝。
 * 终点本身若有伤害也计入（走上去会受伤）。
 */
export function findRoute(game: Game, dest: Point): Dir[] | null {
  const dmg = game.mapDamage();
  if (!dmg.any) return findRouteBfs(game, dest);
  const safe = findRouteBfs(game, dest, (p) => dmg.damage[p.y][p.x] === 0 || (p.x === dest.x && p.y === dest.y && dmg.damage[p.y][p.x] < game.hero.hp));
  if (safe) return safe;
  return findRouteDamage(game, dest);
}

/** 最小地图伤害路线（Dijkstra，代价 = 伤害 × 1000 + 步数） */
function findRouteDamage(game: Game, dest: Point): Dir[] | null {
  const start = game.pos;
  const dmg = game.mapDamage().damage;
  const dc = game.cell(dest);
  if (!dc || SOLID.has(dc.terrain)) return null;
  const key = (p: Point) => p.y * 64 + p.x;
  const best = new Map<number, number>([[key(start), 0]]);
  const prev = new Map<number, { from: Point; dir: Dir }>();
  const open: Array<{ p: Point; cost: number; hurt: number }> = [{ p: start, cost: 0, hurt: 0 }];
  const dirs: Dir[] = ['up', 'down', 'left', 'right'];
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const cur = open.shift()!;
    if (cur.p.x === dest.x && cur.p.y === dest.y) break;
    if (cur.cost > (best.get(key(cur.p)) ?? Infinity)) continue;
    for (const d of dirs) {
      const n = { x: cur.p.x + DIR_VEC[d].x, y: cur.p.y + DIR_VEC[d].y };
      const c = game.cell(n);
      if (!c) continue;
      const isDest = n.x === dest.x && n.y === dest.y;
      if (!isDest && !passableMidway(c)) continue;
      const hurt = cur.hurt + (c.monster || c.door || c.npc ? 0 : dmg[n.y][n.x]);
      if (hurt >= game.hero.hp) continue;
      const cost = cur.cost + 1 + hurt * 1000 - cur.hurt * 1000;
      if (cost >= (best.get(key(n)) ?? Infinity)) continue;
      best.set(key(n), cost);
      prev.set(key(n), { from: cur.p, dir: d });
      open.push({ p: n, cost, hurt });
    }
  }
  if (!prev.has(key(dest))) return null;
  const out: Dir[] = [];
  let p = dest;
  while (p.x !== start.x || p.y !== start.y) {
    const s = prev.get(key(p))!;
    out.push(s.dir);
    p = s.from;
  }
  return out.reverse();
}

function findRouteBfs(game: Game, dest: Point, allow: (p: Point) => boolean = () => true): Dir[] | null {
  const start = game.pos;
  if (start.x === dest.x && start.y === dest.y) return [];
  const dc = game.cell(dest);
  if (!dc || SOLID.has(dc.terrain)) return null;
  const key = (p: Point) => p.y * 64 + p.x;
  const prev = new Map<number, { from: Point; dir: Dir }>();
  const seen = new Set<number>([key(start)]);
  const queue: Point[] = [start];
  const dirs: Dir[] = ['up', 'down', 'left', 'right'];
  let found = false;
  while (queue.length && !found) {
    const cur = queue.shift()!;
    for (const d of dirs) {
      const n = { x: cur.x + DIR_VEC[d].x, y: cur.y + DIR_VEC[d].y };
      const c = game.cell(n);
      if (!c || seen.has(key(n))) continue;
      seen.add(key(n));
      if (n.x === dest.x && n.y === dest.y) {
        if (!allow(n)) continue;
        prev.set(key(n), { from: cur, dir: d });
        found = true;
        break;
      }
      if (!passableMidway(c) || !allow(n)) continue;
      prev.set(key(n), { from: cur, dir: d });
      queue.push(n);
    }
  }
  if (!found) return null;
  const out: Dir[] = [];
  let p = dest;
  while (p.x !== start.x || p.y !== start.y) {
    const s = prev.get(key(p))!;
    out.push(s.dir);
    p = s.from;
  }
  return out.reverse();
}

/** 逐格执行自动寻路；任何新的手动输入都应调用 cancel() */
export class AutoWalker {
  dest: Point | null = null;
  /** 剩余路径格子（不含终点交互格时也包含终点） */
  path: Point[] = [];
  private steps: Dir[] = [];
  private timer = 0;
  /** 走完整条路线（到达终点）后调用一次：用于「点击墙壁 → 走到旁边再撞墙」 */
  private onArrive: (() => void) | null = null;

  /** busy() 为 true（剧情/对话进行中）时立即停止 */
  constructor(
    private game: Game,
    private busy: () => boolean = () => false,
  ) {}

  get active(): boolean {
    return this.dest !== null;
  }

  /** 返回 false 表示无法到达 */
  start(dest: Point, onArrive?: () => void): boolean {
    this.cancel();
    const route = findRoute(this.game, dest);
    if (!route) return false;
    if (!route.length) {
      onArrive?.();
      return true;
    }
    this.onArrive = onArrive ?? null;
    this.steps = route;
    this.dest = { ...dest };
    let p = { ...this.game.pos };
    this.path = route.map((d) => (p = { x: p.x + DIR_VEC[d].x, y: p.y + DIR_VEC[d].y }));
    this.tick();
    return true;
  }

  cancel(): void {
    window.clearTimeout(this.timer);
    this.onArrive = null;
    this.steps = [];
    this.path = [];
    this.dest = null;
  }

  /** 走一步；返回 true 表示还要继续 */
  private stepOnce(): boolean {
    const d = this.steps.shift();
    if (!d || this.busy()) return false;
    const before = { ...this.game.pos };
    const floor = this.game.floorId;
    this.path.shift();
    this.game.tryMove(d);
    const moved = before.x !== this.game.pos.x || before.y !== this.game.pos.y;
    // 中途被阻挡、触发剧情、换层或已结束：停止
    return !!this.steps.length && moved && !this.busy() && floor === this.game.floorId;
  }

  private finish(): void {
    const cb = this.onArrive;
    const arrived = !!this.dest && this.game.pos.x === this.dest.x && this.game.pos.y === this.dest.y && !this.busy();
    this.cancel();
    if (cb && arrived) cb();
  }

  private tick = (): void => {
    if (motion.stepMs <= 0) {
      // 瞬移：同步走完整条路径（遇到战斗 / 剧情等事件仍会停下）
      while (this.stepOnce());
      return this.finish();
    }
    if (!this.stepOnce()) return this.finish();
    this.timer = window.setTimeout(this.tick, motion.stepMs);
  };
}
