/**
 * 可选的「上古版」变体（开局询问，存于 flags，随存档保存）。
 * 数据直接取自原作 Tower of the Sorcerer for Windows 1.2（英文原版，即「上古版」所复刻的版本）的地图表：
 * github.com/fyt000/Tower-of-the-Sorcerer  cpp/src/original_constants.hpp（从 TSW 1.2 EXE 提取，tile 9 = SecretWall）
 *  - 36F 四条对称暗道（原版 tile 9，共 20 格）：每块角落墙体里一条 L 形暗道，
 *    连接左右两侧走廊（第 3 / 7 行）与最上 / 最下一行（第 3 / 7 列）。
 *    例：右上暗道 = (9,3)(8,3)(7,3) 横向 + (7,2)(7,1) 纵向，从右侧走廊 (10,3) 通到上方一行 (7,0)。
 *    按原版：每格暗墙要各自撞开（不会整条一起出现）。
 *  - 48F 隐藏的魔法警卫（本作「白衣武士」whiteKing，原版 tile 93）：原版左上角 (0,0) 是 SpecialRoad（看起来是空地），
 *    撞上它时警卫现身；击败后 (0,0) 变成空地，floor check「(0,0) 空地 + (7,7) 机关门」打开圣剑房的门。
 * 经典版（h5 51 号塔 / 汉化 Flash 版）没有这两处机关。资料与对照见 docs/research.md §「上古版变体」。
 */
import type { ScriptCtx } from './director';
import type { Game } from './state';
import { hint, P, type FloorScripts } from './scriptlib';
import type { Point } from './types';

export interface VariantOptions {
  secret36: boolean;
  hidden48: boolean;
}

/** 36F 四条暗道（原版 TSW 1.2 MT36 中的 tile 9；每条 5 格，按从走廊进入的顺序） */
export const PASSAGES36: Point[][] = [
  [P(1, 3), P(2, 3), P(3, 3), P(3, 2), P(3, 1)], // 左上：左侧走廊 (0,3) → 上方一行 (3,0)
  [P(9, 3), P(8, 3), P(7, 3), P(7, 2), P(7, 1)], // 右上：右侧走廊 (10,3) → 上方一行 (7,0)
  [P(1, 7), P(2, 7), P(3, 7), P(3, 8), P(3, 9)], // 左下：左侧走廊 (0,7) → 下方一行 (3,10)
  [P(9, 7), P(8, 7), P(7, 7), P(7, 8), P(7, 9)], // 右下：右侧走廊 (10,7) → 下方一行 (7,10)
];
/** 48F 隐藏白衣武士的位置 / 圣剑房的机关门 */
export const GUARD48 = P(0, 0);
export const SWORD_DOOR48 = P(7, 7);
/** 48F 的隐藏白衣武士此刻是否还是「残影」（尚未被撞出） */
export const ghost48 = (game: Game): boolean =>
  game.floorId === 48 && !!game.flags.variant48 && !game.flags.guard48 && game.cell(GUARD48, 48)?.terrain === 'airwall';

/** 新游戏开始时调用：写入 flags，并改动 36F / 48F 的地图（之后随存档保存，不再重复改动） */
export function applyVariants(game: Game, v: VariantOptions): void {
  game.flags.variant36 = v.secret36;
  game.flags.variant48 = v.hidden48;
  if (v.secret36) {
    for (const path of PASSAGES36) for (const p of path) {
      const c = game.cell(p, 36);
      if (c) Object.assign(c, { terrain: 'hiddenWall' });
    }
  }
  if (v.hidden48) {
    const c = game.cell(GUARD48, 48);
    // 「残影」：渲染成半透明、微微闪动的白衣武士轮廓（renderer.drawGhost48），走不过去；撞上时现身并开口
    if (c) Object.assign(c, { terrain: 'airwall' });
  }
  game.touchMap();
}

export const VARIANT36: FloorScripts = {
  talk: {
    '0,0': (c) =>
      c.flags.variant36
        ? hint('oldman', '如果你能用好4条密道，你不用与强敌作战就能上楼。', 'talk36')(c)
        : hint('oldman', '如果你能用好4种移动宝物，你不用与强敌作战就能上楼。', 'talk36')(c),
  },
};

export const VARIANT48 = {
  bump: {
    [`${GUARD48.x},${GUARD48.y}`]: async (c: ScriptCtx) => {
      if (!c.flags.variant48 || c.flags.guard48) return;
      c.flags.guard48 = 1;
      // 残影凝成实体：先现身，再开口（之后就是一只普通、可战斗的白衣武士，自动清怪永远不会碰它）
      c.set(GUARD48, { terrain: 'floor', monster: 'whiteKing' });
      c.game.emit({ type: 'doorOpen', at: GUARD48, kind: 'sealed' });
      await c.say('whiteKing', '……你竟然能找到我！', '白衣武士');
      await c.say('whiteKing', '我在这角落里藏了不知多少年，从没有人看穿过我的身影。既然被你发现了，那就拔剑吧——圣剑房的钥匙，可不会白白交给你！', '白衣武士');
      c.tip('隐藏的白衣武士现身了！');
    },
  },
  battle: {
    [`${GUARD48.x},${GUARD48.y}`]: (c: ScriptCtx) => {
      if (!c.flags.variant48 || c.flags.guard48 !== 1) return;
      c.flags.guard48 = 2;
      if (c.game.cell(SWORD_DOOR48)?.door === 'special') c.openDoor(SWORD_DOOR48);
      c.tip('存放圣剑的房间的门打开了！');
    },
  },
} satisfies FloorScripts;
