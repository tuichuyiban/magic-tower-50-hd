/**
 * 自动清怪 / 自动拾取 / 自动开暗墙。
 *
 * 参照 h5mota 样板的 autoGet 插件（project/plugins.js，`flags.__auto__ = AUTO_BATTLE | AUTO_ITEM`）：
 *  - 每次玩家移动 / 交互结束后，从勇士所在格做广度优先搜索；
 *  - 只穿过「已经打开」的通路：空地，以及本次被自动处理掉的格子（拾取的道具、清掉的怪物）；
 *  - 遇到道具：拾取（勇士不移动，道具以「磁吸」动画飞向勇士），该格随即可通行、继续搜索；
 *  - 遇到怪物：仅当无事件、且伤害为 0 时直接战斗（勇士不移动），继续搜索；
 *  - 门、墙、楼梯、NPC、剧情触发格、带战斗剧情的怪物（守卫、头目）都会挡住搜索，永远不会自动开门或消耗钥匙。
 */
import { forecastBattle } from './combat';
import { ITEMS, MONSTERS } from './entities';
import type { Game } from './state';
import { DIR_VEC, type Dir, type ItemId, type MonsterId, type Point } from './types';

export interface AutoOptions {
  clear: boolean;
  pickup: boolean;
  /** 自动拾取是否包含血瓶 */
  potions: boolean;
  /** 自动打开与勇士相邻的暗墙 */
  hidden: boolean;
}

export interface AutoResult {
  items: Partial<Record<ItemId, number>>;
  kills: Partial<Record<MonsterId, number>>;
  gold: number;
  walls: number;
  count: number;
  /** 本批因剧情（含 30F / 33F / 34F 等「每次战斗后」计数脚本）而中途停止，剧情结束后应接着做完 */
  stopped: boolean;
}

/** 永远不自动拾取的道具：拾取时会弹出剧情对话的工具类道具 */
const NEVER_PICK = new Set<ItemId>([
  'fly', 'notebook', 'pickaxe', 'cross', 'superPotion', 'holySword',
  'knightSword', 'knightShield', 'sacredSword', 'sacredShield', 'divineShield',
  'bomb', 'centerFly', 'upFly', 'downFly', 'coin', 'snow', 'earthquake', 'bigKey', 'knife',
]);
const POTIONS = new Set<ItemId>(['redPotion', 'bluePotion']);

const dirOf = (from: Point, to: Point): Dir => (to.x > from.x ? 'right' : to.x < from.x ? 'left' : to.y > from.y ? 'down' : 'up');

/**
 * 执行一批自动动作并返回统计；什么都没做时返回 null。
 * blocked(p)：剧情触发格 / 带剧情的怪物（由导演提供）。
 * beforeFirst：执行第一个动作前调用（用于回退快照）。
 */
export function runAuto(
  game: Game,
  opts: AutoOptions,
  blocked: (p: Point) => boolean,
  beforeFirst: () => void,
  /** 某个动作引发了剧情（导演忙）时立即停止本批 */
  stop: () => boolean = () => false,
): AutoResult | null {
  if (!opts.clear && !opts.pickup && !opts.hidden) return null;
  const res: AutoResult = { items: {}, kills: {}, gold: 0, walls: 0, count: 0, stopped: false };
  const touch = () => {
    if (res.count++ === 0) beforeFirst();
  };
  // 序章（3F 魔王伏击前）属性会被重置：只自动拾取钥匙，避免浪费宝石 / 血瓶
  const prologue = !game.flags.ambush3;
  const hero = game.pos;
  const key = (p: Point) => p.y * 64 + p.x;
  // 地图伤害（领域 / 夹击）格子既不作为通路，也不在其上自动战斗 / 拾取
  const dmg = game.mapDamage();

  // 广搜：拾取 / 清怪 / 开暗墙。
  // 自动开暗墙：本层所有「勇士可直接走到」的暗墙一次全部打开（打开后继续向里搜，连续的暗道一步全开，如 35F 小偷挖的暗道）
  {
    const seen = new Set<number>([key(hero)]);
    const queue: Point[] = [{ ...hero }];
    while (queue.length && !stop()) {
      const cur = queue.shift()!;
      for (const d of Object.values(DIR_VEC)) {
        const n = { x: cur.x + d.x, y: cur.y + d.y };
        const c = game.cell(n);
        if (!c || seen.has(key(n)) || stop()) continue;
        seen.add(key(n));
        if (opts.hidden && (c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2') && !blocked(n)) {
          touch();
          game.openHidden(n, true);
          res.walls++;
          queue.push(n);
          continue;
        }
        if (c.terrain !== 'floor' || c.door || c.npc || blocked(n)) continue;
        if (dmg.any && dmg.damage[n.y][n.x] > 0) continue;
        if (c.monster) {
          const def = game.monsterDef(c.monster);
          const f = forecastBattle(game.hero, def);
          if (!opts.clear || !f.canAttack || !f.winnable || f.damage !== 0) continue;
          touch();
          const id = c.monster;
          game.resolveBattle(n, dirOf(cur, n), true);
          res.kills[id] = (res.kills[id] ?? 0) + 1;
          res.gold += def.gold * (game.hero.tools.coin ? 2 : 1);
        } else if (c.item) {
          const it = c.item;
          const ok = opts.pickup && !NEVER_PICK.has(it) && (opts.potions || !POTIONS.has(it)) && (!prologue || it.endsWith('Key'));
          if (!ok) continue;
          touch();
          game.pickup(n, true);
          res.items[it] = (res.items[it] ?? 0) + 1;
        }
        queue.push(n);
      }
    }
  }
  res.stopped = stop();
  return res.count ? res : null;
}

/** 把一批自动动作写成消息日志 */
export function describeAuto(r: AutoResult): string[] {
  const out: string[] = [];
  if (r.walls) out.push(`自动打开暗墙 ×${r.walls}`);
  const kills = Object.entries(r.kills).map(([id, n]) => `${MONSTERS[id as MonsterId].name}×${n}`);
  if (kills.length) out.push(`自动清怪：${kills.join('、')}（金币 +${r.gold}）`);
  const items = Object.entries(r.items).map(([id, n]) => `${ITEMS[id as ItemId].name}×${n}`);
  if (items.length) out.push(`自动拾取：${items.join('、')}`);
  return out;
}
