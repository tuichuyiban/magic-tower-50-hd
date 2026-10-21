/** 剧情脚本的公共工具：老人 / 商人对话、钥匙商人、祭坛、双守卫机关（第一区与第二区共用） */
import type { ScriptCtx } from './director';
import type { Point } from './types';

export type ScriptFn = (c: ScriptCtx) => Promise<void> | void;

export interface FloorScripts {
  /** 与 NPC 对话（撞向 NPC 时触发） */
  talk?: Record<string, ScriptFn>;
  /** 踏上该格时触发 */
  step?: Record<string, ScriptFn>;
  /** 击败该格的怪物后触发 */
  battle?: Record<string, ScriptFn>;
  /** 暗墙（fakeWall2）被打开之后 */
  opened?: Record<string, ScriptFn>;
  /** 本层任意战斗之后 */
  afterAnyBattle?: ScriptFn;
  /** afterAnyBattle 计数的怪物格（这些怪物的死亡会触发机关；自动清怪永远不碰）。
   *  有 afterAnyBattle 却没有声明 watch 的楼层，整层怪物都不自动清 */
  watch?: Point[];
  /** 本层任意门 / 暗墙打开之后（39F 谜题等「自动事件」） */
  afterAnyDoor?: ScriptFn;
  /** 撞向该格（墙 / 牢墙）时触发 */
  bump?: Record<string, ScriptFn>;
}

export const P = (x: number, y: number): Point => ({ x, y });

/** 老人 / 商人情报对话：说完后消失，并记入备忘录（原版公共事件"对话"） */
export function hint(face: 'oldman' | 'trader', text: string, flag: string): ScriptFn {
  return async (c) => {
    await c.say(face, text);
    c.note(face, text);
    c.flags[flag] = true;
    c.hideSelf();
  };
}

/** 钥匙商人（原版公共事件"商人"）：买过之后再对话会给出情报并消失 */
export function keyTrader(floor: number, text: string, price: number, give: (c: ScriptCtx) => void, afterText: string): ScriptFn {
  return async (c) => {
    const bought = `trader${floor}`;
    if (c.flags[bought]) return hint('trader', afterText, `talk${floor}02`)(c);
    const pick = await c.choose('trader', text, ['我太需要了', '下次再说']);
    if (pick !== 0) return;
    if (c.hero.gold >= price) {
      c.hero.gold -= price;
      give(c);
      c.flags[bought] = true;
      c.game.emit({ type: 'map' });
    } else {
      await c.say('trader', `你的金币不够${price}枚，无法交易！`);
    }
  };
}

/** 4 层祭坛（原版公共事件"商店"）：价格 20 + 10·t·(t+1)，t 为已供奉次数 */
export function altarPrice(times: number): number {
  return 20 + 10 * times * (times + 1);
}

export async function altar(c: ScriptCtx): Promise<void> {
  const ratio = c.game.floor.ratio;
  const t = () => Number(c.flags.altarTimes ?? 0);
  await c.shop('altar', {
    text: () => `如果供奉${altarPrice(t())}金币, 便可以增加你的力量, 你想要什么呢…`,
    options: () => [`生命+${100 * (t() + 1)}`, `攻击+${2 * ratio}`, `防御+${4 * ratio}`, '离开'],
    exit: 3,
    buy: (pick) => {
      const n = t();
      const price = altarPrice(n);
      if (c.hero.gold < price) return { ok: false, msg: `你的金币不足${price}枚，无法供奉！` };
      c.hero.gold -= price;
      const gain = [100 * (n + 1), 2 * ratio, 4 * ratio][pick];
      if (pick === 0) c.hero.hp += gain;
      if (pick === 1) c.hero.atk += gain;
      if (pick === 2) c.hero.def += gain;
      c.flags.altarTimes = n + 1;
      const what = ['生命', '攻击', '防御'][pick];
      c.game.addLog(`供奉 ${price} 金币：${what}提升`, 'good');
      c.game.emit({ type: 'map' });
      c.game.emit({ type: 'statGain', stat: (['hp', 'atk', 'def'] as const)[pick], delta: gain, cost: price });
      return { ok: true, msg: `${what} +${gain}（-${price} 金币）` };
    },
  });
}

/** 双守卫机关：两只都被击败后打开对应的门 */
export function guardPair(flag: string, doors: Point[]): ScriptFn {
  return async (c) => {
    const n = Number(c.flags[flag] ?? 0) + 1;
    c.flags[flag] = n;
    if (n >= 2) {
      await c.wait(150);
      for (const d of doors) c.openDoor(d);
      c.tip('机关门打开了！');
    }
  };
}

