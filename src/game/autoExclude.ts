/**
 * 自动清怪的「剧情怪」排除规则：与剧情 / 事件有任何关联的怪物，自动清怪永远不碰（它们也挡住自动搜索）。
 *
 * 排除集合由数据自动构建，而不是手写名单：
 *  1. h5 51 号塔原始楼层数据（docs/h5-51-source/floors/MT1–50.js）中所有带事件的怪物格：
 *     events / afterBattle / beforeBattle 的键，以及事件代码里引用到坐标的初始怪物（守卫、伏兵、队长小队……）
 *     → 由 scripts/gen-event-monsters.cjs 生成 h5EventMonsters.ts；
 *  2. 本作脚本（scripts*.ts / variants.ts）：battle 表里的怪物格、afterAnyBattle 计数的 watch 格；
 *     有 afterAnyBattle 却没声明 watch 的楼层（49F 封印）整层不自动清；
 *  3. 头目（BOSSES）；
 *  4. 不在楼层初始地图上的怪物：剧情生成 / 现身的怪物（伏兵、隐藏怪、魔王、49F 警卫……）；
 *  5. 本层还有未触发的剧情踏点（如 40F 骑士队长登场前、32F）或骑士战进行中：整层不自动清。
 */
import { BOSSES } from './entities';
import { FLOORS } from './floors';
import { parseFloor } from './floors/legend';
import { H5_EVENT_MONSTERS } from './h5EventMonsters';
import { SCRIPTS, stepSpent } from './scripts';
import { knightBattleActive } from './scripts4';
import type { Game } from './state';
import type { Cell, Point } from './types';

const initial = new Map<number, Cell[][]>();
function initialCell(floor: number, p: Point): Cell | undefined {
  if (!FLOORS[floor]) return undefined;
  if (!initial.has(floor)) initial.set(floor, parseFloor(FLOORS[floor]));
  return initial.get(floor)![p.y]?.[p.x];
}

const H5 = new Map<number, Set<string>>(Object.entries(H5_EVENT_MONSTERS).map(([f, ks]) => [Number(f), new Set(ks)]));

/** 本层是否有「整层不自动清」的剧情状态 */
export function storyFloor(game: Game, floor = game.floorId): boolean {
  const sc = SCRIPTS[floor];
  if (knightBattleActive(floor, game.flags)) return true;
  if (sc?.afterAnyBattle && !sc.watch) return true;
  // 未触发的剧情踏点：剧情还没演完，本层怪物都可能是它的一部分
  for (const k of Object.keys(sc?.step ?? {})) if (!stepSpent(floor, k, game.flags)) return true;
  return false;
}

/** 该格的怪物是否与剧情 / 事件有关（自动清怪永远不碰） */
export function storyMonster(game: Game, p: Point, floor = game.floorId): boolean {
  const c = game.cell(p, floor);
  if (!c?.monster) return false;
  const k = `${p.x},${p.y}`;
  if (BOSSES.has(c.monster)) return true;
  if (H5.get(floor)?.has(k)) return true;
  const sc = SCRIPTS[floor];
  if (sc?.battle?.[k] || sc?.bump?.[k]) return true;
  if (sc?.watch?.some((q) => q.x === p.x && q.y === p.y)) return true;
  if (initialCell(floor, p)?.monster !== c.monster) return true;
  return storyFloor(game, floor);
}
