/**
 * 第一区（1F–10F）剧情脚本。全部文本、数值、坐标取自 h5mota 51 号塔（flash 版复刻）的事件数据，
 * 坐标已换算为去掉外圈墙后的 11×11 坐标（原坐标 - 1）。详见 docs/research.md。
 */
import type { ScriptCtx } from './director';
import { PRISON_STATS } from './entities';
import type { Point } from './types';
import { ZONE2_SCRIPTS, zone2StepSpent } from './scripts2';
import { thief2, ZONE3_SCRIPTS, zone3StepSpent } from './scripts3';
import { ZONE4_SCRIPTS, zone4StepSpent } from './scripts4';
import { ZONE5_SCRIPTS, zone5StepSpent } from './scripts5';

export type { FloorScripts, ScriptFn } from './scriptlib';
export { altarPrice } from './scriptlib';
import { altar, guardPair, hint, keyTrader, P, type FloorScripts } from './scriptlib';

/** 第 10 层击败骷髅队长后的奖励与开门（afterBattle 6,1） */
async function captainDefeated(c: ScriptCtx): Promise<void> {
  if (c.flags.captainDefeated) return;
  await c.say(
    'skeletonCaptain',
    '不,这是不可能的， 你怎会打败我！ 你别太得意，后面还有许多强大的对手和机关存在，你稍有疏忽就必死无疑。',
  );
  for (const x of [0, 1, 2]) {
    c.set(P(x, 2), { item: 'redGem', monster: undefined });
    c.set(P(x, 3), { item: 'bluePotion', monster: undefined });
  }
  for (const x of [8, 9, 10]) {
    c.set(P(x, 2), { item: 'blueGem', monster: undefined });
    c.set(P(x, 3), { item: 'yellowKey', monster: undefined });
  }
  c.set(P(5, 8), { door: undefined }); // 红门直接移除
  c.set(P(5, 10), { terrain: 'stairsUp' }); // 显示隐藏的上楼楼梯
  c.openDoor(P(3, 3));
  c.openDoor(P(5, 6));
  c.openDoor(P(7, 3));
  c.flags.captainDefeated = true;
  c.tip('通往上层的楼梯出现了！');
}

const CHAMBER = [P(4, 3), P(5, 3), P(6, 3), P(4, 4), P(6, 4), P(4, 5), P(5, 5), P(6, 5)];

export const SCRIPTS: Record<number, FloorScripts> = {
  ...ZONE2_SCRIPTS,
  ...ZONE3_SCRIPTS,
  ...ZONE4_SCRIPTS,
  ...ZONE5_SCRIPTS,
  2: {
    talk: {
      // 29F 暗道完成后回到 2F 的小偷（原版 MT2 10,11）
      '9,10': thief2,
      // 牢房里的小偷：打开越狱暗道后走到出口
      '2,6': async (c) => {
        await c.say(
          'thief',
          '你清醒了吗？你到监狱时还处在昏迷中，魔法警卫把你扔到我这个房间。但你很幸运，我刚完成逃跑的暗道你就醒了，我们一起越狱吧。',
        );
        c.openDoor(P(1, 6));
        await c.wait(200);
        await c.walk(P(2, 6), ['left:2', 'down:2']);
      },
      '0,8': async (c) => {
        await c.say(
          'thief',
          '我们终于逃出来了。你的剑和盾被警卫拿走了，你必须先找到武器。我知道铁剑在5楼，铁盾在9楼，你最好先取到它们。我现在有事要做没法帮你，再见。',
        );
        await c.walk(P(0, 8), ['down:2'], 200, false);
      },
      '10,3': async (c) => {
        const text = '谢谢你救了我，为了感谢你的帮助请收下这些礼物.（收到1000金币）';
        await c.choose('oldman', text, ['谢谢']);
        c.hero.gold += 1000;
        c.tip('获得1000金币');
        c.note('oldman', text);
        c.flags.talk2 = true;
        c.hideSelf();
      },
      '10,6': async (c) => {
        const pick = await c.choose(
          'blessTrader',
          '谢谢你救了我，我能用祝福魔法提升你 3% 的攻击力和防御力。现在就提升吗？',
          ['现在提升', '等会再说'],
        );
        if (pick !== 0) return;
        c.hero.atk += Math.round(c.hero.atk * 0.03);
        c.hero.def += Math.round(c.hero.def * 0.03);
        c.tip('你受到了祝福，攻击和防御都提升了3%');
        c.hideSelf();
      },
    },
    battle: {
      '5,1': guardPair('guards2', [P(4, 4), P(4, 7), P(4, 10), P(8, 4), P(8, 7), P(8, 10)]),
      '7,1': guardPair('guards2', [P(4, 4), P(4, 7), P(4, 10), P(8, 4), P(8, 7), P(8, 10)]),
    },
  },
  3: {
    step: {
      // 魔王伏击：属性被打回 400/10/10，神圣剑盾被夺走，关进 2 层监狱
      '4,8': async (c) => {
        if (c.flags.ambush3) return;
        c.flags.ambush3 = true;
        await c.wait(300);
        c.set(P(4, 6), { terrain: 'floor', npc: 'demonKing' });
        await c.wait(500);
        await c.say('demonKing', '欢迎来到魔塔，你是第一百位挑战者。你若能打败我所有的手下，我就与你一对一的决斗。现在你必须接受我的安排。');
        for (const p of [P(4, 7), P(3, 8), P(5, 8), P(4, 9)]) c.set(p, { npc: 'magicGuard' });
        await c.wait(500);
        await c.say('hero', '什么？');
        c.game.emit({ type: 'hit', at: c.game.pos });
        await c.wait(250);
        c.game.emit({ type: 'hit', at: c.game.pos });
        await c.wait(250);
        await c.host.curtain(true, 600);
        Object.assign(c.hero, PRISON_STATS);
        c.hero.weapon = null;
        c.hero.shield = null;
        for (const p of [P(4, 6), P(4, 7), P(3, 8), P(5, 8), P(4, 9)]) c.set(p, null);
        await c.changeFloor(2, P(2, 7), 'down');
        c.game.addLog('勇士被魔法警卫击晕，关进了监狱……', 'bad');
        await c.wait(500);
        await c.say('thief', '------', '???');
        await c.say('thief', '------ 喂！', '???');
        await c.say('thief', '------ 喂！醒醒！', '???');
        await c.host.curtain(false, 500);
        c.host.autosave();
      },
    },
    talk: {
      '10,3': async (c) => {
        const text = '我可以给你怪物手册. 你可以用快捷键 X 去使用它。它能预测出当前楼层各类怪物对你的伤害。';
        await c.choose('oldman', text, ['谢谢']);
        c.hero.tools.book = true;
        c.tip('获得 怪物手册');
        c.note('oldman', text);
        c.flags.talk3 = true;
        c.hideSelf();
      },
    },
  },
  4: {
    talk: {
      '5,0': altar,
      '9,0': hint('oldman', '有些门不能用钥匙打开，只有当你打败它的守卫后才会自动打开。', 'talk4'),
    },
  },
  6: {
    talk: {
      '7,3': keyTrader(
        6,
        '我有一把兰钥匙你出50个金币就卖给你。',
        50,
        (c) => void (c.hero.keys.blue += 1),
        '魔塔一共50层，每10层为一个区域。如果不打败此区域的头目就不能到更高的地方。',
      ),
      '3,7': hint('oldman', '你购买了礼物后再与商人对话，他会告诉你一些重要的消息。', 'talk6'),
    },
  },
  7: {
    talk: {
      '5,0': keyTrader(
        7,
        '我有五把黄钥匙你出50个金币就卖给你。',
        50,
        (c) => void (c.hero.keys.yellow += 5),
        '在商店里你最好选择提升防御，只有在攻击力低于敌人的防御力时才提升攻击力',
      ),
    },
  },
  8: {
    battle: {
      '8,4': guardPair('guards8', [P(9, 3)]),
      '10,4': guardPair('guards8', [P(9, 3)]),
    },
  },
  10: {
    step: {
      // 伏击：踏入骷髅队长前方的小屋后，8 只骷髅包围勇士
      '5,4': async (c) => {
        if (c.flags.ambush10) return;
        c.flags.ambush10 = true;
        c.closeDoor(P(5, 6));
        await c.wait(150);
        for (const p of [P(3, 3), P(7, 3), P(4, 5), P(6, 5)]) c.openDoor(p);
        for (const p of [P(4, 3), P(5, 2), P(6, 3), P(4, 4), P(6, 4)]) c.set(p, { terrain: 'floor' });
        await c.wait(200);
        await c.say('skeletonCaptain', '哈哈哈, 你是如此的幸运能安全到达这里。 但现在好运离你而去了，你中埋伏了，弟兄们给我上。');
        // 原版：若两侧小屋里的骷髅已被击败，伏击时依然会生成新的骷髅
        const ensure = (p: Point, m: 'skeleton' | 'skeletonSoldier' | 'skeletonCaptain') => {
          if (!c.game.cell(p)?.monster) c.set(p, { monster: m });
        };
        ensure(P(5, 3), 'skeletonCaptain');
        ensure(P(1, 3), 'skeletonSoldier');
        ensure(P(9, 3), 'skeletonSoldier');
        for (const p of [P(2, 2), P(8, 2), P(1, 2), P(9, 2), P(0, 2), P(10, 2)]) ensure(p, 'skeleton');
        const g1 = [c.walk(P(5, 3), ['up:3']), c.walk(P(1, 3), ['right:3', 'down:2', 'right:1']), c.walk(P(9, 3), ['left:4'])];
        await c.wait(600);
        c.closeDoor(P(5, 2));
        const g2 = [c.walk(P(2, 2), ['down:1', 'right:2', 'down:2']), c.walk(P(8, 2), ['down:1', 'left:2', 'down:2'])];
        await c.wait(200);
        const g3 = [c.walk(P(1, 2), ['down:1', 'right:3', 'down:1']), c.walk(P(9, 2), ['down:1', 'left:3', 'down:1'])];
        await c.wait(200);
        const g4 = [c.walk(P(0, 2), ['down:1', 'right:4']), c.walk(P(10, 2), ['down:1', 'left:4'])];
        await Promise.all([...g1, ...g2, ...g3, ...g4]);
        c.closeDoor(P(3, 3));
        c.closeDoor(P(7, 3));
      },
      // 杀出重围后：骷髅队长的宣战
      '5,1': async (c) => {
        if (c.flags.captainChallenge || c.flags.captainDefeated) return;
        c.flags.captainChallenge = true;
        await c.say('skeletonCaptain', '你怎能杀出重围？我是决不会让你通过的，来吧，我要与你决斗!');
      },
      // 原版 flash 特性：未触发机关就走到 (6,1) 也会直接判定战胜（正常流程中不可能发生）
      '5,0': async (c) => {
        if (!c.flags.ambush10) await captainDefeated(c);
      },
      // 战胜头目后，小偷来道别并告知银盾、银剑的位置
      '5,8': async (c) => {
        if (!c.flags.captainDefeated || c.flags.thief10) return;
        c.flags.thief10 = true;
        c.set(P(0, 10), { npc: 'thief' });
        await c.wait(300);
        await c.walk(P(0, 10), ['up:3', 'right:2', 'down:3', 'right:2', 'up:1', 'right:1']);
        await c.say(
          'thief',
          '嘿！我们又见面了！非常感谢你打败了此区域的头目。我正苦恼于如何到更高的楼层，现在我终于可以上去了。 我听说银盾在11楼，银剑在17楼，这消息不知道对你是否有用。',
        );
        await c.walk(P(5, 9), ['down:1'], 200, false);
      },
    },
    battle: {
      '5,0': captainDefeated,
    },
    // 自动事件：包围圈 8 格全部清空后打开北侧机关门
    watch: CHAMBER,
    afterAnyBattle: (c) => {
      if (!c.flags.ambush10 || c.flags.chamberOpen) return;
      if (CHAMBER.every((p) => !c.game.cell(p)?.monster)) {
        c.flags.chamberOpen = true;
        c.openDoor(P(5, 2));
      }
    },
  },
};

/** 剧情踏点是否已经失效（触发过 / 不会再触发）。自动清怪 / 拾取只会穿过已失效的踏点 */
export function stepSpent(floor: number, key: string, flags: Record<string, unknown>): boolean {
  switch (`${floor}:${key}`) {
    case '3:4,8': return !!flags.ambush3;
    case '10:5,4': return !!flags.ambush10;
    case '10:5,1': return !!(flags.captainChallenge || flags.captainDefeated);
    case '10:5,0': return !!flags.ambush10;
    case '10:5,8': return !!flags.thief10;
    default: return zone2StepSpent(floor, key, flags) || zone3StepSpent(floor, key, flags) || zone4StepSpent(floor, key, flags) || zone5StepSpent(floor, key, flags);
  }
}
