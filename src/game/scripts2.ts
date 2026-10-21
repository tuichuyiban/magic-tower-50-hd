/**
 * 第二区（11F–20F）剧情脚本。文本、数值、坐标取自 h5mota 51 号塔 floors/MT11–MT20.js 与 commonEvents.json，
 * 坐标已换算为去掉外圈墙后的 11×11 坐标（原坐标 - 1）。详见 docs/research.md §12。
 */
import type { ScriptCtx } from './director';
import { altar, guardPair, hint, keyTrader, P, type FloorScripts } from './scriptlib';
import { bagAdd } from './entities';
import type { Actor } from './state';
import type { Point } from './types';

/** 20F：包围吸血鬼祭坛的 8 只大蝙蝠（原版 bg 层装饰 + setBlock bigBat） */
export const RING20 = [P(4, 4), P(5, 4), P(6, 4), P(4, 5), P(6, 5), P(4, 6), P(5, 6), P(6, 6)];
const CENTER20 = P(5, 5);

let actorSeq = 10_000;

/** 让若干只怪物（可斜向）同时滑向同一终点后消失（原版 move rightdown / leftup …，time 1000） */
async function converge(c: ScriptCtx, from: Point[], to: Point, ms: number): Promise<void> {
  const now = performance.now();
  const actors: Actor[] = from.map((p) => {
    const m = c.game.cell(p)?.monster ?? 'bigBat';
    c.set(p, { monster: undefined });
    return { id: ++actorSeq, monster: m, from: { ...p }, pos: { ...to }, t0: now, dur: ms };
  });
  c.game.actors.push(...actors);
  c.game.emit({ type: 'map' });
  await c.wait(ms);
  c.game.actors = c.game.actors.filter((a) => !actors.includes(a));
  c.game.emit({ type: 'map' });
}

async function vampireAppears(c: ScriptCtx): Promise<void> {
  if (c.flags.vampire20) return;
  c.flags.vampire20 = true;
  c.closeDoor(P(5, 8)); // 红门处变为机关门：退路被封
  c.game.emit({ type: 'map' }); // 触发界面切换为头目战音乐（原版 playSound 20F.mp3）
  for (const p of RING20) if (!c.game.cell(p)?.monster) c.set(p, { monster: 'bigBat' });
  await c.wait(300);
  await converge(c, RING20, CENTER20, 1000);
  c.set(CENTER20, { monster: 'vampire' });
  await c.wait(500);
  await c.say('vampire', '很好, 你打败了骷髅族，但别想象藐视骷髅人那样藐视我。我对于你就象是神一样，是不可战胜的。呵呵, 来吧!');
}

async function vampireDefeated(c: ScriptCtx): Promise<void> {
  if (c.flags.vampireDefeated) return;
  c.flags.vampireDefeated = true;
  await c.say('vampire', '上帝阿!我做梦也没想到我会被别人打败。毫无疑问你是比我强。但以你现在的状态对于大法师来说又太弱了，你仅仅取得了一个暂时的胜利。');
  c.game.emit({ type: 'map' }); // 停止头目战音乐
  for (const x of [4, 5, 6]) c.set(P(x, 3), { item: 'yellowKey' });
  for (const y of [4, 5, 6]) {
    c.set(P(3, y), { item: 'redGem' });
    c.set(P(7, y), { item: 'blueGem' });
  }
  for (const x of [4, 5, 6]) c.set(P(x, 7), { item: 'bluePotion' });
  c.openDoor(P(5, 2));
  c.openDoor(P(5, 8));
  c.tip('通往上层的道路打开了！');
}

export const ZONE2_SCRIPTS: Record<number, FloorScripts> = {
  11: {
    battle: {
      // 两只高级法师都被击败后打开机关门（afterBattle 1,5 / 3,5 → openDoor 2,4）
      '0,4': guardPair('guards11', [P(1, 3)]),
      '2,4': guardPair('guards11', [P(1, 3)]),
    },
  },
  12: {
    talk: {
      '0,0': keyTrader(
        12,
        '我有一把红钥匙你出800个金币就卖给你。',
        800,
        (c) => void (c.hero.keys.red += 1),
        '你是否注意到 5,9,14,16,18 楼有的墙与众不同？',
      ),
      // 暗墙后的特殊商人：黄钥匙 1000 金币一把，可反复购买
      '10,0': async (c) => {
        await c.shop('specialTrader', {
          text: () => '我有许多黄钥匙1000个金币一把你要吗？',
          options: () => ['我太需要了', '下次再说'],
          exit: 1,
          buy: () => {
            if (c.hero.gold < 1000) return { ok: false, msg: '你的金币不足1000枚，无法交易！' };
            c.hero.gold -= 1000;
            c.hero.keys.yellow += 1;
            c.game.addLog('花费 1000 金币购买了 1 把黄钥匙', 'good');
            c.game.emit({ type: 'map' });
            c.game.emit({ type: 'statGain', stat: 'yellow', delta: 1, cost: 1000 });
            return { ok: true, msg: '黄钥匙 +1（-1000 金币）' };
          },
        });
      },
      '5,8': altar,
    },
    opened: {
      '10,0': (c) => {
        c.set(P(10, 0), { npc: 'specialTrader' });
        c.flags.specialTrader12 = true;
      },
    },
  },
  14: {
    // 自动事件：(0,0)(2,0)(1,1) 的兽人武士全部消灭后，牢墙打开并出现隐藏的红钥匙
    watch: [P(0, 0), P(2, 0), P(1, 1)],
    afterAnyBattle: (c) => {
      if (c.flags.redKey14) return;
      if ([P(0, 0), P(2, 0), P(1, 1)].every((p) => !c.game.cell(p)?.monster)) {
        c.flags.redKey14 = true;
        c.openDoor(P(0, 2));
        c.set(P(0, 2), { item: 'redKey' });
        c.tip('墙后出现了一把红钥匙！');
      }
    },
  },
  15: {
    talk: {
      '8,0': async (c) => {
        await c.say('thief', '阿哈! 你还好吗? 这大章鱼挡住了我前进的道路，现在暗道终于完工了,你现在最好也躲开它。我要走了，再见。');
        c.openDoor(P(7, 0));
        c.flags.thief15 = true;
        await c.walk(P(8, 0), ['left:3'], 200, false);
      },
      '10,10': keyTrader(
        15,
        '我有一把兰钥匙你出200个金币就卖给你。',
        200,
        (c) => void (c.hero.keys.blue += 1),
        '如果你持有十字架，面对兽人和吸血鬼时你的攻击力加倍。在没有十字架的情况下你不可能打败吸血鬼。十字架被藏在高于15楼的墙内。',
      ),
    },
    battle: {
      // 击败大乌贼：移除身体占据的空气墙，打开机关门（afterBattle 6,6）
      '5,5': (c) => {
        for (const p of [P(4, 3), P(5, 3), P(6, 3), P(4, 4), P(6, 4), P(4, 5), P(6, 5)]) c.set(p, { terrain: 'floor' });
        c.openDoor(P(5, 2));
        c.flags.octopus15 = true;
      },
    },
  },
  16: {
    talk: {
      '0,10': hint('oldman', '我听说在塔内有2把隐藏的红钥匙。', 'talk16'),
      '10,10': async (c) => {
        const text = '很好，你居然找到了我，做为奖励我将给你一瓶圣水。喝了它将按你的攻击和防御力的总和增加你的生命点数，你越晚用它效果越好。';
        await c.choose('oldman', text, ['谢谢']);
        bagAdd(c.hero, 'superPotion', 1);
        c.note('oldman', text);
        c.tip('获得 圣水');
        c.flags.superPotion16 = true;
        c.hideSelf();
      },
    },
    opened: {
      '10,10': (c) => c.set(P(10, 10), { npc: 'oldman' }),
    },
  },
  17: {
    battle: {
      '0,7': guardPair('guards171', [P(1, 6)]),
      '2,7': guardPair('guards171', [P(1, 6)]),
      '0,4': guardPair('guards172', [P(1, 3)]),
      '2,4': guardPair('guards172', [P(1, 3)]),
      '8,7': guardPair('guards173', [P(9, 6)]),
      '10,7': guardPair('guards173', [P(9, 6)]),
      '8,4': guardPair('guards174', [P(9, 3)]),
      '10,4': guardPair('guards174', [P(9, 3)]),
    },
  },
  18: {
    talk: {
      '2,1': hint('oldman', '在这区域不多次提升攻击力，就不能打败 石头人。切记前人教训！', 'talk18'),
    },
  },
  19: {
    opened: {
      // 十字架藏在暗墙里（afterOpenDoor 6,3 → setBlock cross）
      '5,2': (c) => c.set(P(5, 2), { item: 'cross' }),
    },
  },
  20: {
    step: { '5,7': vampireAppears },
    battle: { '5,5': vampireDefeated },
  },
};

export function zone2StepSpent(floor: number, key: string, flags: Record<string, unknown>): boolean {
  switch (`${floor}:${key}`) {
    case '20:5,7': return !!flags.vampire20;
    default: return false;
  }
}

/** 20F 头目战音乐：吸血鬼现身后到被击败之前 */
export const vampireBattleActive = (floor: number, flags: Record<string, unknown>) => floor === 20 && !!flags.vampire20 && !flags.vampireDefeated;
