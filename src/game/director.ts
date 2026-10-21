import { NPC_NAMES } from './entities';
import { FLOORS, stairTarget } from './floors';
import { SCRIPTS, type ScriptFn } from './scripts';
import type { Actor, Game, GameEvent } from './state';
import { MONSTERS } from './entities';
import { DIR_VEC, type Cell, type Dir, type MonsterId, type NpcId, type Point } from './types';

export type Face = 'hero' | NpcId | MonsterId;

export interface Speaker {
  name: string;
  face: Face;
}

/** 商店一次购买的结果：ok = 成交；msg = 轻量反馈文字；'close' = 关闭商店 */
export type ShopResult = { ok: boolean; msg?: string } | 'close';

/** 可连续购买的商店（祭坛、钥匙商人等）：选项点下去后对话框不关闭，只刷新价格 / 文字并给出轻微反馈 */
export interface ShopSpec {
  text: () => string;
  options: () => string[];
  /** 「离开」选项的序号 */
  exit: number;
  buy: (i: number) => ShopResult;
}

/** 由界面层（或测试/模拟器）实现：对话框、选项、等待、黑幕、换层过场 */
export interface ScriptHost {
  say(who: Speaker, text: string): Promise<void>;
  choose(who: Speaker, text: string, options: string[]): Promise<number>;
  /** 可选：常驻商店界面；未实现时退回「每次购买后重新弹出选项」 */
  shop?(who: Speaker, spec: ShopSpec): Promise<void>;
  wait(ms: number): Promise<void>;
  /** 黑幕：true 渐黑，false 渐亮 */
  curtain(dark: boolean, ms?: number): Promise<void>;
  /** 换层过场：在黑场中执行 fn */
  transition(fn: () => void): Promise<void>;
  tip(text: string): void;
  /** 换层后自动存档 */
  autosave(): void;
}

let actorSeq = 0;

export const key = (x: number, y: number) => `${x},${y}`;

/** 剧情脚本上下文 */
export class ScriptCtx {
  constructor(
    readonly game: Game,
    readonly host: ScriptHost,
    /** 触发脚本的格子 */
    readonly at: Point,
  ) {}

  get hero() {
    return this.game.hero;
  }
  get flags() {
    return this.game.flags;
  }

  speaker(face: Face, name?: string): Speaker {
    if (face === 'hero') return { face, name: name ?? '勇士' };
    return { face, name: name ?? (NPC_NAMES as Record<string, string>)[face] ?? (MONSTERS as Record<string, { name: string }>)[face]?.name ?? '???' };
  }

  async say(face: Face, text: string, name?: string): Promise<void> {
    await this.host.say(this.speaker(face, name), text);
  }

  async choose(face: Face, text: string, options: string[], name?: string): Promise<number> {
    return this.host.choose(this.speaker(face, name), text, options);
  }

  /** 常驻商店：连续购买时不关闭对话框（界面层不支持时退回选项循环） */
  async shop(face: Face, spec: ShopSpec, name?: string): Promise<void> {
    const who = this.speaker(face, name);
    if (this.host.shop) return this.host.shop(who, spec);
    for (;;) {
      const pick = await this.host.choose(who, spec.text(), spec.options());
      if (pick === spec.exit || pick < 0) return;
      const r = spec.buy(pick);
      if (r === 'close') return;
      if (!r.ok && r.msg) this.host.tip(r.msg);
    }
  }

  /** 记入备忘录（与原版"留言簿"相同，只记录老人/商人的情报） */
  note(face: Face, text: string): void {
    this.game.note(this.speaker(face).name, text);
  }

  wait(ms: number) {
    return this.host.wait(ms);
  }

  tip(text: string): void {
    this.host.tip(text);
    this.game.addLog(text, 'good');
  }

  set(p: Point, patch: Partial<Cell> | null): void {
    this.game.setCell(p, patch);
  }

  /** 修改其他楼层的格子（原版 setBlock / show / hide 带 floorId） */
  setOn(floor: number, p: Point, patch: Partial<Cell> | null): void {
    this.game.setCell(p, patch, floor);
  }

  /** 剧情强制战斗：打不过即阵亡（返回 false） */
  battle(at: Point, id: MonsterId, revive = false): boolean {
    return this.game.forcedBattle(at, id, this.game.facing, revive);
  }

  /** 删除触发脚本的格子上的 NPC */
  hideSelf(): void {
    this.set(this.at, { npc: undefined });
  }

  openDoor(p: Point): void {
    const c = this.game.cell(p);
    if (!c) return;
    // 原版 openDoor 也能打开墙（yellowWall 带 doorInfo，例如 41F 击败隐藏巫师后打开 (4,6)/(6,6) 两堵墙）
    const wallLike = c.terrain === 'sealedWall' || c.terrain === 'airwall' || c.terrain === 'wall';
    const kind = c.door ?? (wallLike && c.terrain !== 'airwall' ? 'sealed' : 'special');
    this.set(p, { door: undefined, terrain: wallLike ? 'floor' : c.terrain });
    this.game.emit({ type: 'doorOpen', at: p, kind });
  }

  closeDoor(p: Point): void {
    this.set(p, { door: 'special' });
  }

  /**
   * 让格子上的怪物 / NPC 沿路线行走（与原版 move / generateMove 一致，行走时显示在其他物体上方）。
   * steps 形如 ['left:2', 'down:2']。keep = true 时到达后留在终点格，否则消失。
   */
  async walk(from: Point, steps: string[], stepMs = 200, keep = true): Promise<Point> {
    const dirs: Dir[] = [];
    for (const s of steps) {
      const [d, n] = s.split(':');
      for (let i = 0; i < Number(n ?? 1); i++) dirs.push(d as Dir);
    }
    const cur = this.game.cell(from)!;
    const actor: Actor = { id: ++actorSeq, monster: cur.monster, npc: cur.npc, pos: { ...from }, from: { ...from }, t0: 0, dur: stepMs };
    this.set(from, { monster: undefined, npc: undefined });
    this.game.actors.push(actor);
    for (const d of dirs) {
      actor.from = { ...actor.pos };
      actor.pos = { x: actor.pos.x + DIR_VEC[d].x, y: actor.pos.y + DIR_VEC[d].y };
      actor.t0 = performance.now();
      this.game.emit({ type: 'map' });
      await this.wait(stepMs);
    }
    this.game.actors = this.game.actors.filter((a) => a !== actor);
    if (keep) this.set(actor.pos, { monster: actor.monster, npc: actor.npc });
    else this.game.emit({ type: 'map' });
    return actor.pos;
  }

  async changeFloor(id: number, pos: Point, facing: Dir = 'down'): Promise<void> {
    this.game.changeFloor(id, pos);
    this.game.facing = facing;
  }
}

/**
 * 导演：监听游戏事件，运行对应楼层脚本。脚本运行期间 busy = true，界面应忽略玩家输入。
 */
export class Director {
  busy = false;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    readonly game: Game,
    readonly host: ScriptHost,
  ) {
    game.on((e) => this.onEvent(e));
  }

  /** 等待所有排队的脚本执行完毕（测试 / 模拟器用） */
  settle(): Promise<void> {
    return this.chain;
  }

  run(at: Point, fn: (c: ScriptCtx) => Promise<void> | void): void {
    this.busy = true;
    this.chain = this.chain
      .then(async () => {
        this.busy = true;
        await fn(new ScriptCtx(this.game, this.host, at));
      })
      .catch((err) => console.error('脚本错误', err))
      .finally(() => {
        this.busy = false;
      });
  }

  private script(kind: 'talk' | 'step' | 'battle' | 'opened' | 'bump', at: Point): ScriptFn | undefined {
    return SCRIPTS[this.game.floorId]?.[kind]?.[key(at.x, at.y)];
  }

  private onEvent(e: GameEvent): void {
    switch (e.type) {
      case 'talk': {
        const fn = this.script('talk', e.at);
        if (fn) this.run(e.at, fn);
        break;
      }
      case 'move': {
        const fn = this.script('step', e.to);
        if (fn) this.run(e.to, fn);
        break;
      }
      case 'battle': {
        const fn = this.script('battle', e.at);
        if (fn) this.run(e.at, fn);
        const after = SCRIPTS[this.game.floorId]?.afterAnyBattle;
        if (after) this.run(e.at, after);
        break;
      }
      case 'doorOpen': {
        const after = SCRIPTS[this.game.floorId]?.afterAnyDoor;
        if (after) this.run(e.at, after);
        // 暗墙（fakeWall2）被撞开后的事件：出现商人 / 老人 / 十字架（原版 events / afterOpenDoor）
        if (e.kind !== 'hidden') break;
        const fn = this.script('opened', e.at);
        if (fn) this.run(e.at, fn);
        break;
      }
      case 'bump': {
        // 撞向带事件的墙（41F 右侧的牢墙等）
        const fn = this.script('bump', e.at);
        if (fn) this.run(e.at, fn);
        break;
      }
      case 'stairs': {
        const target = stairTarget(this.game.floorId, e.dir);
        this.run(e.at, async () => {
          if (!FLOORS[target]) return;
          await this.host.transition(() => this.game.changeFloor(target, e.dir === 'up' ? 'fromBelow' : 'fromAbove'));
          this.host.autosave();
        });
        break;
      }
      default:
        break;
    }
  }

  /** 魔杖楼层传送（界面层已检查 nearStairs 与已到达楼层） */
  fly(id: number): void {
    this.run(this.game.pos, async () => {
      await this.host.transition(() => this.game.flyTo(id));
      this.host.autosave();
    });
  }
}

