import { defDamage, forecastBattle, nextCritical, type BattleForecast, type CriticalInfo } from './combat';
import { bagAdd, bagCount, cloneHero, TEST_ZONES, superPotionHeal, DOOR_NAMES, HERO_START, ITEMS, itemEffect, MONSTERS, START_FLOOR, START_POS, type MonsterDef } from './entities';
import { FLOORS } from './floors';
import { computeMapDamage, type MapDamage } from './mapdamage';
import { parseFloor } from './floors/legend';
import { DIR_VEC, type Cell, type Dir, type DoorKind, type HeroStats, type ItemId, type MonsterId, type NpcId, type Point } from './types';

/** 不可进入的地形 */
const BLOCKING = new Set<Cell['terrain']>(['wall', 'airwall', 'sealedWall', 'altarL', 'altarR', 'solidWall', 'lava', 'star']);

export type LogKind = 'info' | 'good' | 'warn' | 'bad';

export interface LogEntry {
  id: number;
  text: string;
  kind: LogKind;
}

export interface NoteEntry {
  floor: number;
  speaker: string;
  text: string;
}

export type GameEvent =
  | { type: 'restart' }
  | { type: 'load' }
  | { type: 'move'; from: Point; to: Point }
  | { type: 'bump'; at: Point; dir: Dir }
  | { type: 'ending'; kind: 'NE' | 'TE' }
  | { type: 'doorOpen'; at: Point; kind: DoorKind | 'hidden' | 'sealed' | 'maze'; auto?: boolean }
  | { type: 'pickup'; at: Point; item: ItemId; auto?: boolean }
  | { type: 'battle'; at: Point; monster: MonsterId; damage: number; gold: number; dir: Dir; auto?: boolean; bomb?: boolean }
  | { type: 'blocked'; at: Point; reason: 'noKey' | 'cannotAttack' | 'lethal' | 'locked' | 'danger'; text: string }
  /** 领域 / 夹击等地图伤害 */
  | { type: 'mapDamage'; at: Point; damage: number; kind: string }
  /** 勇士生命耗尽 */
  | { type: 'death'; reason: string }
  /** 道具效果（炸弹 / 地震 / 冰魔法 / 瞬移 …）的视觉提示 */
  | { type: 'itemFx'; item: ItemId; cells: Point[] }
  | { type: 'stairs'; at: Point; dir: 'up' | 'down' }
  | { type: 'talk'; at: Point; npc: NpcId }
  | { type: 'floor'; floor: number; prev: number }
  | { type: 'map' }
  /** 商店 / 祭坛购买带来的属性变化（状态栏高亮用） */
  | { type: 'statGain'; stat: 'hp' | 'atk' | 'def' | 'gold' | 'yellow'; delta: number; cost?: number }
  | { type: 'hit'; at: Point };

export interface MonsterInfo {
  def: MonsterDef;
  forecast: BattleForecast;
  critical: CriticalInfo;
  /** 1 防减伤；null = 无法破防 */
  def1: number | null;
}

/** 剧情中正在行走的角色（不存档） */
export interface Actor {
  id: number;
  monster?: MonsterId;
  npc?: NpcId;
  pos: Point;
  from: Point;
  t0: number;
  dur: number;
}

export type Flags = Record<string, number | boolean | string>;

export interface SaveData {
  v: 2;
  time: number;
  floorId: number;
  pos: Point;
  facing: Dir;
  hero: HeroStats;
  floors: Record<number, Cell[][]>;
  visited: number[];
  flags: Flags;
  steps: number;
  kills: number;
  notes: NoteEntry[];
}

/** 游戏状态与规则：不依赖任何渲染代码，便于测试与扩展 */
export class Game {
  floorId = START_FLOOR;
  /** 每层的当前状态（离开楼层后保留） */
  floors: Record<number, Cell[][]> = {};
  visited = new Set<number>();
  flags: Flags = {};
  hero: HeroStats = cloneHero(HERO_START);
  pos: Point = { ...START_POS };
  facing: Dir = 'up';
  steps = 0;
  kills = 0;
  log: LogEntry[] = [];
  notes: NoteEntry[] = [];
  actors: Actor[] = [];
  /** 每次玩家动作（移动 / 交互）前调用：用于回退功能记录快照 */
  beforeAction: (() => void) | null = null;
  /** 勇士已阵亡（等待读档 / 重新开始） */
  dead = false;
  private dmgCache: { key: string; v: MapDamage } | null = null;
  private logId = 0;
  private listeners: Array<(e: GameEvent) => void> = [];

  constructor() {
    this.reset(true);
  }

  get floor() {
    return FLOORS[this.floorId];
  }

  get grid(): Cell[][] {
    return this.floors[this.floorId];
  }

  get size() {
    return this.grid.length;
  }

  on(fn: (e: GameEvent) => void): void {
    this.listeners.push(fn);
  }

  emit(e: GameEvent): void {
    for (const fn of this.listeners) fn(e);
  }

  addLog(text: string, kind: LogKind = 'info'): void {
    this.log.push({ id: ++this.logId, text, kind });
    if (this.log.length > 30) this.log.shift();
  }

  reset(silent = false): void {
    this.hero = cloneHero(HERO_START);
    this.steps = 0;
    this.kills = 0;
    this.log = [];
    this.notes = [];
    this.flags = {};
    this.actors = [];
    this.dead = false;
    this.floors = {};
    for (const id of Object.keys(FLOORS)) this.floors[+id] = parseFloor(FLOORS[+id]);
    this.visited = new Set([START_FLOOR]);
    this.floorId = START_FLOOR;
    this.pos = { ...START_POS };
    this.facing = 'up';
    this.addLog('勇士踏入了魔塔……', 'good');
    this.addLog('方向键 / WASD 移动，点击地图寻路');
    if (!silent) this.emit({ type: 'restart' });
  }

  /**
   * 试玩模式：直接从 11F 开始（1F–11F 视为已到达，可用魔杖飞行）。
   * 第 3 层魔王伏击视为已经发生（否则飞回 3F 会被重置属性）。正常模式完全不受影响。
   */
  startTestMode(zone = 2): void {
    const t = TEST_ZONES[zone] ?? TEST_ZONES[2];
    this.reset(true);
    this.hero = cloneHero(t.hero);
    this.flags.testMode = true;
    this.flags.testZone = zone;
    this.flags.ambush3 = true;
    Object.assign(this.flags, t.flags ?? {});
    for (let i = 1; i <= t.floor; i++) if (!FLOORS[i].noFly) this.visited.add(i);
    this.floorId = t.floor;
    this.pos = { ...(FLOORS[t.floor].arriveFromBelow ?? START_POS) };
    this.log = [];
    this.addLog(`试玩模式：从 ${t.floor}F 开始体验${t.name}`, 'good');
    this.emit({ type: 'restart' });
  }

  /** 当前生效的怪物数值（含剧情临时赋予的先攻、49F / 50F 魔王数值变化） */
  monsterDef(id: MonsterId): MonsterDef {
    const base = MONSTERS[id];
    const f = this.flags;
    let def = base;
    if (f[`first:${id}`]) def = { ...def, special: { ...(def.special ?? {}), first: true } };
    if (id === 'redKing' && f.redKingHp !== undefined) def = { ...def, hp: Number(f.redKingHp), atk: Number(f.redKingAtk), def: Number(f.redKingDef) };
    return def;
  }

  /** 当前楼层每格的地图伤害（领域 / 夹击），按勇士当前生命计算 */
  mapDamage(): MapDamage {
    const k = `${this.floorId}|${this.hero.hp}|${this.hero.tools.magicImmune ? 1 : 0}|${this.mapVersion}`;
    if (this.dmgCache?.key !== k) this.dmgCache = { key: k, v: computeMapDamage(this.grid, (id) => this.monsterDef(id), this.hero) };
    return this.dmgCache.v;
  }

  /** 地图改变时递增（用于缓存失效） */
  mapVersion = 0;

  damageAt(p: Point): number {
    return this.mapDamage().damage[p.y]?.[p.x] ?? 0;
  }

  /** 阵亡 */
  die(reason: string): void {
    if (this.dead) return;
    this.hero.hp = 0;
    this.dead = true;
    this.addLog(`勇士倒下了……（${reason}）`, 'bad');
    this.emit({ type: 'death', reason });
  }

  /** 切换楼层。arrive 为落脚点；原版规则：上楼落在目标层 downFloor，下楼落在 upFloor */
  changeFloor(id: number, arrive: 'fromBelow' | 'fromAbove' | Point): void {
    const f = FLOORS[id];
    if (!f) throw new Error(`没有楼层 ${id}`);
    const prev = this.floorId;
    this.floorId = id;
    const p = typeof arrive === 'object' ? arrive : arrive === 'fromBelow' ? f.arriveFromBelow : f.arriveFromAbove;
    this.pos = { ...(p ?? START_POS) };
    this.visited.add(id);
    this.mapVersion++;
    this.emit({ type: 'floor', floor: id, prev });
  }

  inBounds(p: Point): boolean {
    return p.y >= 0 && p.y < this.grid.length && p.x >= 0 && p.x < this.grid[0].length;
  }

  cell(p: Point, floorId = this.floorId): Cell | undefined {
    const g = this.floors[floorId];
    return p.y >= 0 && p.y < g.length && p.x >= 0 && p.x < g[0].length ? g[p.y][p.x] : undefined;
  }

  monsterInfo(id: MonsterId): MonsterInfo {
    const def = this.monsterDef(id);
    return { def, forecast: forecastBattle(this.hero, def), critical: nextCritical(this.hero, def), def1: defDamage(this.hero, def, 1) };
  }

  monsterInfoAt(p: Point): MonsterInfo | null {
    const c = this.cell(p);
    return c?.monster ? this.monsterInfo(c.monster) : null;
  }

  /** 当前楼层上仍存活的怪物种类（怪物手册用） */
  monsterTypesOnFloor(): MonsterId[] {
    const set = new Set<MonsterId>();
    for (const row of this.grid) for (const c of row) if (c.monster) set.add(c.monster);
    return [...set].sort((a, b) => this.monsterDef(a).atk - this.monsterDef(b).atk);
  }

  /** 勇士是否站在楼梯上或与楼梯相邻（魔杖使用条件，与原版 flyNearStair 一致） */
  nearStairs(): boolean {
    for (const d of [{ x: 0, y: 0 }, ...Object.values(DIR_VEC)]) {
      const c = this.cell({ x: this.pos.x + d.x, y: this.pos.y + d.y });
      if (c && (c.terrain === 'stairsUp' || c.terrain === 'stairsDown')) return true;
    }
    return false;
  }

  /** 楼层传送：去更高层落在目标层 downFloor 点，去更低层落在 upFloor 点（mota-js flyTo） */
  flyTo(id: number): boolean {
    if (!this.visited.has(id) || FLOORS[id]?.noFly) return false;
    if (id === this.floorId) {
      // 选择当前楼层：回到本层下楼梯旁（与「飞往更高层」的落点规则相同）
      const p = this.flyHomeSpot();
      if (!p || (p.x === this.pos.x && p.y === this.pos.y)) return false;
      this.changeFloor(id, p);
      return true;
    }
    this.changeFloor(id, id > this.floorId ? 'fromBelow' : 'fromAbove');
    return true;
  }

  /** 当前楼层的「下楼梯旁」落点（从下层上来时的位置；没有下楼梯的楼层退回上楼梯旁） */
  flyHomeSpot(): Point | undefined {
    const f = FLOORS[this.floorId];
    return f?.arriveFromBelow ?? f?.arriveFromAbove;
  }

  tryMove(dir: Dir): void {
    if (this.dead) return;
    this.beforeAction?.();
    this.facing = dir;
    const v = DIR_VEC[dir];
    const to = { x: this.pos.x + v.x, y: this.pos.y + v.y };
    const c = this.cell(to);
    if (!c || BLOCKING.has(c.terrain)) {
      this.emit({ type: 'bump', at: to, dir });
      return;
    }

    // 23F 隐形迷宫墙：碰到后显形为普通墙（原版事件：hide + closeDoor yellowWall）
    if (c.terrain === 'mazeWall') {
      c.terrain = 'wall';
      this.flags[`maze${this.floorId}`] = Number(this.flags[`maze${this.floorId}`] ?? 0) + 1;
      this.touchMap();
      this.addLog('撞到了一堵看不见的墙！', 'warn');
      this.emit({ type: 'doorOpen', at: to, kind: 'maze' });
      return;
    }

    // 单向花丛：只能沿指定方向穿过；从其他方向碰到时立即变成墙（原版 flower 事件）
    if (c.terrain === 'flower' && c.oneWay !== dir) {
      c.terrain = 'wall';
      delete c.oneWay;
      this.touchMap();
      this.addLog('通道被封住了！', 'warn');
      this.emit({ type: 'doorOpen', at: to, kind: 'maze' });
      return;
    }

    // 暗墙：外观与墙一致，撞上去即打开（原版 fakeWall，trigger openDoor 且无需钥匙）
    if (c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2') {
      this.openHidden(to);
      return;
    }

    if (c.npc) {
      this.emit({ type: 'talk', at: to, npc: c.npc });
      return;
    }

    // 门：消耗钥匙开门，勇士停留在原地（经典规则）
    if (c.door) {
      const kind = c.door;
      if (kind === 'special' || kind === 'iron') {
        const text = kind === 'iron' ? '铁门无法用钥匙打开' : '机关门：击败守卫后自动打开';
        this.addLog(text, 'warn');
        this.emit({ type: 'blocked', at: to, reason: 'locked', text: kind === 'iron' ? '铁门' : '机关门' });
        return;
      }
      if (this.hero.keys[kind] > 0) {
        this.hero.keys[kind]--;
        delete c.door;
        this.addLog(`打开了${DOOR_NAMES[kind]}门`);
        this.emit({ type: 'doorOpen', at: to, kind });
      } else {
        const text = `需要${DOOR_NAMES[kind]}钥匙`;
        this.addLog(`${text}才能打开${DOOR_NAMES[kind]}门`, 'warn');
        this.emit({ type: 'blocked', at: to, reason: 'noKey', text });
      }
      return;
    }

    // 怪物：按公式结算，打不过则拒绝战斗
    if (c.monster) {
      const id = c.monster;
      const def = this.monsterDef(id);
      const f = forecastBattle(this.hero, def);
      if (!f.canAttack) {
        this.addLog(`无法破防${def.name}！`, 'bad');
        this.emit({ type: 'blocked', at: to, reason: 'cannotAttack', text: '无法破防' });
        return;
      }
      if (!f.winnable) {
        this.addLog(`打不过！需损失 ${f.damage} 生命`, 'bad');
        this.emit({ type: 'blocked', at: to, reason: 'lethal', text: '打不过' });
        return;
      }
      this.resolveBattle(to, dir);
      return;
    }

    // 楼梯：踏上即换层
    if (c.terrain === 'stairsUp' || c.terrain === 'stairsDown') {
      this.emit({ type: 'stairs', at: to, dir: c.terrain === 'stairsUp' ? 'up' : 'down' });
      return;
    }

    // 地图伤害（领域 / 夹击）：伤害 ≥ 当前生命的格子不能进入（mota-js canMoveHero：canGoDeadZone = false）
    const dmg = this.damageAt(to);
    if (dmg > 0 && dmg >= this.hero.hp) {
      this.addLog(`前方危险：会受到 ${dmg} 点魔法伤害`, 'bad');
      this.emit({ type: 'blocked', at: to, reason: 'danger', text: '危险' });
      return;
    }

    // 普通移动（可能拾取道具）
    const from = { ...this.pos };
    const leaving = this.cell(from);
    this.pos = to;
    this.steps++;
    // 离开单向花丛后，花丛变为墙（原版 outEvent）
    if (leaving?.terrain === 'flower') {
      leaving.terrain = 'wall';
      delete leaving.oneWay;
      this.touchMap();
    }
    this.emit({ type: 'move', from, to });
    if (dmg > 0) this.applyMapDamage(to, dmg);
    if (this.dead) return;

    if (c.item) this.pickup(to);
  }

  /** 踏入领域 / 夹击格子后扣血（原版 checkBlock） */
  applyMapDamage(at: Point, dmg: number): void {
    const kinds = this.mapDamage().kinds[at.y]?.[at.x] ?? '';
    this.hero.hp -= dmg;
    this.addLog(`受到${kinds || '魔法'}伤害 ${dmg}`, 'bad');
    this.emit({ type: 'mapDamage', at, damage: dmg, kind: kinds });
    if (this.hero.hp <= 0) this.die(`${kinds || '魔法'}伤害`);
  }

  /** 地图（墙 / 怪物）发生变化 */
  touchMap(): void {
    this.mapVersion++;
  }

  /** 打开暗墙（撞墙或自动开暗墙） */
  openHidden(at: Point, auto = false): void {
    const c = this.cell(at);
    if (!c || (c.terrain !== 'hiddenWall' && c.terrain !== 'hiddenWall2')) return;
    c.terrain = 'floor';
    this.touchMap();
    if (!auto) this.addLog('墙壁松动了……发现一条暗道！', 'good');
    this.emit({ type: 'doorOpen', at, kind: 'hidden', auto });
  }

  /** 镐可破坏的勇士四周的墙（51 号塔：yellowWall / fakeWall 的 canBreak 为 true；fakeWall2、whiteWall2 不可破坏） */
  pickaxeTargets(): Point[] {
    const out: Point[] = [];
    for (const d of Object.values(DIR_VEC)) {
      const p = { x: this.pos.x + d.x, y: this.pos.y + d.y };
      const c = this.cell(p);
      if (c && (c.terrain === 'wall' || c.terrain === 'hiddenWall')) out.push(p);
    }
    return out;
  }

  /** 使用镐：破坏四周的墙并消耗一把镐。返回被破坏的格子 */
  usePickaxe(): Point[] {
    const targets = this.pickaxeTargets();
    if (!targets.length || bagCount(this.hero, 'pickaxe') <= 0) return [];
    this.beforeAction?.();
    bagAdd(this.hero, 'pickaxe', -1);
    for (const p of targets) {
      this.cell(p)!.terrain = 'floor';
      this.emit({ type: 'doorOpen', at: p, kind: 'hidden' });
    }
    this.touchMap();
    this.addLog(`使用镐：破坏了 ${targets.length} 堵墙`, 'good');
    this.emit({ type: 'map' });
    return targets;
  }

  /** 使用圣水：生命 + round(0.74 × (攻击 + 防御)) × 10 */
  useSuperPotion(): number {
    if (bagCount(this.hero, 'superPotion') <= 0) return 0;
    this.beforeAction?.();
    bagAdd(this.hero, 'superPotion', -1);
    const hp = superPotionHeal(this.hero);
    this.hero.hp += hp;
    this.addLog(`使用圣水，增加 ${hp} 生命`, 'good');
    this.emit({ type: 'map' });
    return hp;
  }

  /** 结算与 at 处怪物的战斗（调用方需已确认可以战胜）。auto = 自动清怪（勇士不移动） */
  resolveBattle(at: Point, dir: Dir, auto = false): void {
    const c = this.cell(at);
    if (!c?.monster) return;
    const id = c.monster;
    const def = this.monsterDef(id);
    const f = forecastBattle(this.hero, def);
    // 幸运金币：金币 ×2（functions.js afterBattle：if (core.hasItem('coin')) money *= 2）
    const gold = def.gold * (this.hero.tools.coin ? 2 : 1);
    this.hero.hp -= f.damage;
    this.hero.gold += gold;
    this.kills++;
    delete c.monster;
    this.touchMap();
    if (!auto) this.addLog(`击败${def.name}，损失 ${f.damage} 生命${this.hero.tools.coin ? `，金币 +${gold}（幸运金币）` : ''}`, f.damage === 0 ? 'good' : 'info');
    this.emit({ type: 'battle', at, monster: id, damage: f.damage, gold, dir, auto });
  }

  /** 剧情强制战斗（32F / 40F 骑士队长等）：打不过（含无法破防）即阵亡。返回是否存活 */
  forcedBattle(at: Point, id: MonsterId, dir: Dir = this.facing, revive = false): boolean {
    const def = this.monsterDef(id);
    let f = forecastBattle(this.hero, def);
    // 32F：被骑士队长击败时，若可以破防对方则可以喝圣水存活（原版说明）
    while (revive && f.canAttack && f.damage >= this.hero.hp && bagCount(this.hero, 'superPotion') > 0) {
      const hp = this.useSuperPotion();
      this.addLog(`危急关头喝下圣水（+${hp}）`, 'good');
      f = forecastBattle(this.hero, def);
    }
    if (!f.canAttack || f.damage >= this.hero.hp) {
      this.hero.hp -= f.canAttack ? f.damage : this.hero.hp;
      this.die(`被${def.name}击败`);
      return false;
    }
    const c = this.cell(at);
    if (c) c.monster = id;
    this.resolveBattle(at, dir);
    return true;
  }

  // —— 第三–五区的道具 ——

  /** 炸弹（items.js bomb）：炸死四周生命 < 500 的敌人，获得其金币（不受幸运金币加倍）并触发其战后事件 */
  bombTargets(): Point[] {
    return Object.values(DIR_VEC)
      .map((d) => ({ x: this.pos.x + d.x, y: this.pos.y + d.y }))
      .filter((p) => {
        const m = this.cell(p)?.monster;
        return !!m && this.monsterDef(m).hp < 500;
      });
  }

  useBomb(): Point[] {
    const targets = this.bombTargets();
    if (!targets.length || bagCount(this.hero, 'bomb') <= 0) return [];
    this.beforeAction?.();
    bagAdd(this.hero, 'bomb', -1);
    let money = 0;
    for (const p of targets) {
      const c = this.cell(p)!;
      const id = c.monster!;
      const def = this.monsterDef(id);
      money += def.gold;
      delete c.monster;
      this.kills++;
      this.emit({ type: 'battle', at: p, monster: id, damage: 0, gold: def.gold, dir: this.facing, bomb: true });
    }
    this.hero.gold += money;
    this.touchMap();
    this.addLog(`炸弹使用成功，你获得了 ${money} 金币`, 'good');
    this.emit({ type: 'itemFx', item: 'bomb', cells: targets });
    this.emit({ type: 'map' });
    return targets;
  }

  /** 瞬移（centerFly）：中心对称位置必须为空地（或空气墙） */
  centerTarget(): Point | null {
    const t = { x: this.size - 1 - this.pos.x, y: this.size - 1 - this.pos.y };
    const c = this.cell(t);
    if (!c || (t.x === this.pos.x && t.y === this.pos.y)) return null;
    const empty = (c.terrain === 'floor' || c.terrain === 'airwall') && !c.door && !c.item && !c.monster && !c.npc;
    return empty ? t : null;
  }

  useCenterFly(): boolean {
    const t = this.centerTarget();
    if (!t || bagCount(this.hero, 'centerFly') <= 0) return false;
    this.beforeAction?.();
    bagAdd(this.hero, 'centerFly', -1);
    const from = { ...this.pos };
    this.pos = t;
    this.addLog('瞬移使用成功', 'good');
    this.emit({ type: 'itemFx', item: 'centerFly', cells: [from, t] });
    this.emit({ type: 'map' });
    return true;
  }

  /** 向上 / 向下传送：目标楼层相同位置必须什么都没有 */
  verticalTarget(dir: 'up' | 'down'): { floor: number; ok: boolean; reason?: string } {
    const floor = this.floorId + (dir === 'up' ? 1 : -1);
    if (dir === 'up' && this.floorId >= 49) return { floor, ok: false, reason: '你已在最高层' };
    if (dir === 'down' && this.floorId < 1) return { floor, ok: false, reason: '你已在地下室' };
    const c = this.cell(this.pos, floor);
    const ok = !!c && c.terrain === 'floor' && !c.door && !c.item && !c.monster && !c.npc;
    return { floor, ok, reason: ok ? undefined : dir === 'up' ? '上一层此位置有东西' : '下一层此位置有东西' };
  }

  useVerticalFly(dir: 'up' | 'down'): boolean {
    const id = dir === 'up' ? 'upFly' : 'downFly';
    const t = this.verticalTarget(dir);
    if (!t.ok || bagCount(this.hero, id) <= 0) return false;
    this.beforeAction?.();
    bagAdd(this.hero, id, -1);
    this.changeFloor(t.floor, { ...this.pos });
    this.addLog(`${ITEMS[id].name}使用成功`, 'good');
    return true;
  }

  /** 冰魔法：冻结四周的岩浆 */
  snowTargets(): Point[] {
    return Object.values(DIR_VEC)
      .map((d) => ({ x: this.pos.x + d.x, y: this.pos.y + d.y }))
      .filter((p) => this.cell(p)?.terrain === 'lava');
  }

  useSnow(): Point[] {
    const t = this.snowTargets();
    if (!t.length || !this.hero.tools.snow) return [];
    this.beforeAction?.();
    for (const p of t) this.cell(p)!.terrain = 'floor';
    this.touchMap();
    this.addLog('冰魔法使用成功', 'good');
    this.emit({ type: 'itemFx', item: 'snow', cells: t });
    this.emit({ type: 'map' });
    return t;
  }

  /** 地震卷轴：摧毁本层所有可破坏的墙（canBreak：普通墙与暗墙） */
  earthquakeTargets(): Point[] {
    const out: Point[] = [];
    this.grid.forEach((row, y) => row.forEach((c, x) => {
      if (c.terrain === 'wall' || c.terrain === 'hiddenWall') out.push({ x, y });
    }));
    return out;
  }

  useEarthquake(): Point[] {
    const t = this.earthquakeTargets();
    if (bagCount(this.hero, 'earthquake') <= 0) return [];
    this.beforeAction?.();
    bagAdd(this.hero, 'earthquake', -1);
    for (const p of t) this.cell(p)!.terrain = 'floor';
    this.touchMap();
    this.addLog(`地震卷轴使用成功：摧毁了 ${t.length} 堵墙`, 'good');
    this.emit({ type: 'itemFx', item: 'earthquake', cells: t });
    this.emit({ type: 'map' });
    return t;
  }

  /** 魔法钥匙：打开本层所有的黄门 */
  bigKeyTargets(): Point[] {
    const out: Point[] = [];
    this.grid.forEach((row, y) => row.forEach((c, x) => {
      if (c.door === 'yellow') out.push({ x, y });
    }));
    return out;
  }

  useBigKey(): Point[] {
    const t = this.bigKeyTargets();
    if (bagCount(this.hero, 'bigKey') <= 0) return [];
    this.beforeAction?.();
    bagAdd(this.hero, 'bigKey', -1);
    for (const p of t) {
      delete this.cell(p)!.door;
      this.emit({ type: 'doorOpen', at: p, kind: 'yellow', auto: true });
    }
    this.touchMap();
    this.addLog(`魔法钥匙使用成功：打开了 ${t.length} 扇黄门`, 'good');
    this.emit({ type: 'map' });
    return t;
  }

  /** 拾取 at 处的道具（走上去或自动拾取） */
  pickup(at: Point, auto = false): void {
    const c = this.cell(at);
    if (!c?.item) return;
    const item = ITEMS[c.item];
    item.apply(this.hero, this.floor.ratio);
    delete c.item;
    if (!auto) this.addLog(`获得${item.name}：${itemEffect(item.id, this.floor.ratio)}`, 'good');
    this.emit({ type: 'pickup', at, item: item.id, auto });
  }

  /** 剧情用：直接修改格子 */
  setCell(p: Point, patch: Partial<Cell> | null, floorId = this.floorId): void {
    const g = this.floors[floorId];
    this.mapVersion++;
    if (patch === null) g[p.y][p.x] = { terrain: 'floor' };
    else {
      const c = g[p.y][p.x];
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete (c as unknown as Record<string, unknown>)[k];
        else (c as unknown as Record<string, unknown>)[k] = v;
      }
    }
    if (floorId === this.floorId) this.emit({ type: 'map' });
  }

  note(speaker: string, text: string): void {
    this.notes.push({ floor: this.floorId, speaker, text });
  }

  serialize(): SaveData {
    return JSON.parse(
      JSON.stringify({
        v: 2,
        time: Date.now(),
        floorId: this.floorId,
        pos: this.pos,
        facing: this.facing,
        hero: this.hero,
        floors: this.floors,
        visited: [...this.visited],
        flags: this.flags,
        steps: this.steps,
        kills: this.kills,
        notes: this.notes,
      }),
    );
  }

  deserialize(d: SaveData, message = `读取存档：${FLOORS[d.floorId]?.name ?? ''}`): void {
    const s = JSON.parse(JSON.stringify(d)) as SaveData;
    this.floorId = s.floorId;
    this.pos = s.pos;
    this.facing = s.facing;
    this.hero = s.hero;
    this.floors = s.floors;
    // 旧存档兼容：补齐存档之后新增的楼层（例如第一区存档进入第二区）
    for (const id of Object.keys(FLOORS)) if (!this.floors[+id]) this.floors[+id] = parseFloor(FLOORS[+id]);
    this.visited = new Set(s.visited);
    this.dead = false;
    this.mapVersion++;
    this.flags = s.flags;
    this.steps = s.steps;
    this.kills = s.kills;
    this.notes = s.notes ?? [];
    this.hero.tools.fly = true;
    this.hero.bag ??= {}; // 旧存档兼容：魔杖开局即拥有
    this.hero.weapon = deriveWeapon(this.hero.weapon, this.floors, this.flags);
    this.hero.shield ??= null;
    this.actors = [];
    this.log = [];
    this.addLog(message, 'good');
    this.emit({ type: 'load' });
  }
}

/** 武器名（hero.weapon）与对应的剑（由弱到强） */
const SWORDS: Array<[ItemId, string]> = [['ironSword', '铁剑'], ['silverSword', '银剑'], ['knightSword', '骑士剑'], ['sacredSword', '圣剑'], ['holySword', '神圣剑']];
let swordSpots: Array<{ floor: number; p: Point; name: string; order: number }> | null = null;
/**
 * 旧存档兼容：存档里的武器字段缺失 / 是道具 id / 无法识别时，按楼层状态推断当前武器
 * （剑所在格的道具已被拾取 = 已装备；取最强的一把）。序章（3F 魔王伏击前）沿用开局的神圣剑。
 */
export function deriveWeapon(weapon: unknown, floors: Record<number, Cell[][]>, flags: Record<string, unknown>): string | null {
  if (typeof weapon === 'string') {
    const byName = SWORDS.find(([, n]) => n === weapon);
    if (byName) return weapon;
    const byId = SWORDS.find(([id]) => id === weapon);
    if (byId) return byId[1];
    const loose = [...SWORDS].reverse().find(([id, n]) => weapon.includes(n) || weapon.toLowerCase().includes(id.toLowerCase()));
    if (loose) return loose[1];
  }
  if (weapon === null && flags.ambush3) {
    // 3F 被打劫后空手是合法状态；但若之后的剑已被拾取（旧版本写入失败），仍补齐
  } else if (weapon !== undefined && weapon !== null && weapon !== '') {
    // 无法识别的字符串：继续按楼层推断
  } else if (!flags.ambush3) return HERO_START.weapon;
  if (!swordSpots) {
    swordSpots = [];
    for (const id of Object.keys(FLOORS).map(Number)) {
      parseFloor(FLOORS[id]).forEach((row, y) => row.forEach((c, x) => {
        const i = SWORDS.findIndex(([sid]) => sid === c.item);
        if (i >= 0) swordSpots!.push({ floor: id, p: { x, y }, name: SWORDS[i][1], order: i });
      }));
    }
  }
  let best: { name: string; order: number } | null = null;
  for (const s of swordSpots) {
    const c = floors[s.floor]?.[s.p.y]?.[s.p.x];
    const taken = !!c && c.item !== SWORDS[s.order][0];
    if (taken && (!best || s.order > best.order)) best = s;
  }
  return best?.name ?? (typeof weapon === 'string' && weapon ? weapon : null);
}
