/**
 * 第四区（31F–40F）剧情脚本。文本、数值、坐标取自 h5mota 51 号塔 floors/MT31–MT40.js，
 * 坐标已换算为去掉外圈墙后的 11×11 坐标（原坐标 - 1）。详见 docs/research.md §16。
 */
import type { ScriptCtx } from './director';

import { VARIANT36 } from './variants';
import { altar, guardPair, hint, keyTrader, P, type FloorScripts } from './scriptlib';
import type { MonsterId, Point } from './types';

const KNIGHT_TROOPS: MonsterId[] = ['ghostSkeleton', 'soldier', 'swordsman', 'redKnight', 'yellowKnight'];
const setFirst = (c: ScriptCtx, on: boolean) => {
  for (const id of KNIGHT_TROOPS) c.flags[`first:${id}`] = on;
};

/** 32F：骑士队长伏击（强制战斗，先攻；可以破防时会自动喝圣水续命） */
async function knight32(c: ScriptCtx): Promise<void> {
  if (c.flags.knight32) return;
  c.flags.knight32 = true;
  c.flags.knight32Active = true;
  c.game.emit({ type: 'map' });
  c.set(P(5, 1), { terrain: 'floor' });
  c.set(P(5, 8), { terrain: 'floor' });
  c.set(P(9, 0), { monster: 'yellowKnight' });
  await c.wait(200);
  await c.walk(P(9, 0), ['left:4'], 150);
  await c.say('yellowKnight', '你打败了前两个区域的头目，这表明你是个勇士。但现在游戏结束了，我将在这里亲手杀死你！', '骑士队长');
  await c.walk(P(5, 0), ['down:8'], 120);
  c.flags['first:yellowKnight'] = true;
  c.game.facing = 'up';
  const alive = c.battle(P(5, 8), 'yellowKnight', true);
  c.flags['first:yellowKnight'] = false;
  c.flags.knight32Active = false;
  if (!alive) return;
  c.set(P(5, 8), { npc: 'goldKnight' });
  await c.wait(200);
  await c.say('goldKnight', '你以为你已非常强大了吗？嘿嘿错了，只是我今天状态不佳而已。我走了，有本事到40楼与我再打一次。');
  await c.walk(P(5, 8), ['up:8', 'right:5'], 120, false);
  c.game.emit({ type: 'map' });
}

const TRAP33 = [P(8, 4), P(10, 4), P(8, 6), P(10, 6)];
const RING34 = [P(4, 3), P(6, 3), P(8, 3), P(10, 3), P(4, 7), P(6, 7), P(8, 7), P(10, 7)];
const DOORS39 = [P(1, 1), P(3, 1), P(5, 1), P(1, 3), P(3, 3), P(5, 3), P(1, 5), P(3, 5), P(5, 5)];

/** 40F 骑士队长的车轮战（原版 MT40 6,7：依次让手下冲向勇士，全部先攻） */
const WAVE40: Point[] = [
  P(4, 3), P(3, 3), P(2, 3), P(6, 3), P(7, 3), P(8, 3), P(3, 1), P(2, 1), P(1, 1), P(7, 1), P(8, 1), P(9, 1), P(5, 0),
];
const LINES40: Record<number, string> = {
  2: '哼，没关系，士兵们给我上！',
  5: '真正的战斗才刚开始，让我们继续，双手剑士给我上！',
  8: '哼，你们这战怎么打得？骑士们给我冲！',
  11: '你怎会击败我所有的手下？我和你誓不两立我决不认输。（骑士队长失去了理智）',
};

/** 从 from 走到勇士身旁（先横向再纵向，停在勇士上方一格） */
function pathTo(from: Point, to: Point): string[] {
  const steps: string[] = [];
  const dx = to.x - from.x;
  if (dx) steps.push(`${dx > 0 ? 'right' : 'left'}:${Math.abs(dx)}`);
  const dy = to.y - from.y;
  if (dy) steps.push(`${dy > 0 ? 'down' : 'up'}:${Math.abs(dy)}`);
  return steps;
}

async function knight40(c: ScriptCtx): Promise<void> {
  if (c.flags.knight40) return;
  c.flags.knight40 = true;
  c.flags.knight40Active = true;
  setFirst(c, true);
  c.game.emit({ type: 'map' }); // 切换为 Knight 曲
  const hero = { ...c.game.pos };
  const front = P(hero.x, hero.y - 1);
  await c.say('yellowKnight', '我还在担心你不能来了。我确信这次我一定能杀了你。鬼战士给我上！', '骑士队长');
  for (let i = 0; i < WAVE40.length; i++) {
    const p = WAVE40[i];
    const id = c.game.cell(p)?.monster;
    if (i === 12) {
      // 原版 MT40：队长若还在 (6,1)（本作 5,0）就先亲自冲下来与勇士战斗一次（仍是先攻）；
      // 之后无论如何：原处变成上楼梯，队长在勇士面前出现、放狠话并逃上楼（up:6，本作从勇士上方一格 up:5）
      if (id) {
        await c.walk(p, pathTo(p, front), 110);
        c.game.facing = 'up';
        if (!c.battle(front, id)) {
          setFirst(c, false);
          c.flags.knight40Active = false;
          return;
        }
        await c.wait(200);
      }
      c.set(P(5, 0), { terrain: 'stairsUp', monster: undefined, npc: undefined });
      c.set(front, { monster: undefined, npc: 'goldKnight' });
      await c.say('goldKnight', '这次先饶了你，下次碰到我会和你正式的决斗，你最好投降。（骑士队长逃走了）', '骑士队长');
      await c.walk(front, [`up:${front.y}`], 70, false);
      break;
    }
    if (id) {
      await c.walk(p, pathTo(p, front), 110);
      c.game.facing = 'up';
      if (!c.battle(front, id)) {
        setFirst(c, false);
        c.flags.knight40Active = false;
        return;
      }
      await c.wait(120);
    }
    if (LINES40[i]) await c.say('yellowKnight', LINES40[i], '骑士队长');
  }
  setFirst(c, false);
  c.flags.knight40Active = false;
  for (const x of [1, 2, 3]) c.set(P(x, 1), { item: 'yellowKey' });
  for (const x of [7, 8, 9]) c.set(P(x, 1), { item: 'redGem' });
  for (const x of [2, 3, 4]) c.set(P(x, 3), { item: 'bluePotion' });
  for (const x of [6, 7, 8]) c.set(P(x, 3), { item: 'blueGem' });
  c.game.emit({ type: 'map' });
  c.tip('通往 41F 的楼梯出现了！');
}

export const ZONE4_SCRIPTS: Record<number, FloorScripts> = {
  31: {
    talk: {
      '10,0': hint('oldman', '双手剑士的攻击力太高了，你最好到能对他一击必杀时再与他战斗。', 'talk31'),
      '0,10': keyTrader(31, '我有四把黄钥匙一把兰钥匙你出1000个金币就都给你。', 1000, (c) => {
        c.hero.keys.yellow += 4;
        c.hero.keys.blue += 1;
      }, '魔塔有50层高,但似乎你不能直接到50楼。'),
    },
  },
  32: {
    talk: { '9,9': altar },
    battle: {
      '0,9': guardPair('guard32', [P(1, 8)]),
      '2,9': guardPair('guard32', [P(1, 8)]),
    },
    step: { '5,9': knight32 },
  },
  33: {
    talk: { '3,2': hint('oldman', '别匆忙，放慢速度。', 'talk33') },
    step: {
      // 机关：踏入后封住退路，4 只怪全部消灭才重新打开
      '9,4': async (c) => {
        if (c.flags.trap33) return;
        c.flags.trap33 = true;
        c.set(P(10, 3), { terrain: 'wall' });
        if (TRAP33.some((p) => c.game.cell(p)?.monster)) {
          c.closeDoor(P(9, 3));
          c.closeDoor(P(9, 7));
          c.tip('机关门关上了！');
        } else c.flags.trap33Open = true;
      },
    },
    watch: TRAP33,
    afterAnyBattle: (c) => {
      if (!c.flags.trap33 || c.flags.trap33Open) return;
      if (TRAP33.every((p) => !c.game.cell(p)?.monster)) {
        c.flags.trap33Open = true;
        c.openDoor(P(9, 3));
        c.openDoor(P(9, 7));
      }
    },
  },
  34: {
    // 第二把隐藏红钥匙：消灭两排共 8 只怪后，左侧牢墙消失
    watch: RING34,
    afterAnyBattle: (c) => {
      if (c.flags.redKey34) return;
      if (RING34.every((p) => !c.game.cell(p)?.monster)) {
        c.flags.redKey34 = true;
        c.set(P(1, 5), { terrain: 'floor', item: 'redKey' });
        for (const p of [P(0, 4), P(2, 4), P(0, 6), P(2, 6)]) c.set(p, { item: 'yellowKey' });
        c.game.emit({ type: 'doorOpen', at: P(1, 5), kind: 'sealed' });
        c.tip('隐藏的红钥匙出现了！');
      }
    },
  },
  35: {
    talk: {
      '4,9': async (c) => {
        await c.say('thief', '你好，暗道已挖好，你可用它绕过魔龙。');
        await c.say('thief', '我听说骑士队长（本区的头目）实力差又爱吹牛，所以被魔法警卫们讨厌。');
        await c.say('thief', '这魔塔太危险了，我可不想再次被抓，我要离塔回去了，再见。');
        c.flags.thief35 = true;
        await c.walk(P(4, 9), ['right:1', 'down:1'], 180, false);
      },
    },
    battle: {
      '5,6': async (c) => {
        c.flags.dragon35 = true;
        c.openDoor(P(5, 2));
        c.set(P(4, 6), { terrain: 'floor' });
        c.set(P(6, 6), { terrain: 'floor' });
        for (const x of [4, 5, 6]) c.set(P(x, 4), { item: 'bluePotion' });
        if (!c.hero.tools.snow) c.set(P(5, 5), { item: 'snow' });
      },
    },
  },
  36: VARIANT36,
  37: { talk: { '0,10': hint('oldman', '你需要用 地震卷轴  取出37楼仓库内的所有宝物。', 'talk37') } },
  38: {
    talk: {
      '4,1': keyTrader(38, '我有3把黄钥匙你出200个金币就都给你。', 200, (c) => {
        c.hero.keys.yellow += 3;
      }, '存放圣剑的房间的门坏了，你必须用镐破墙而入。'),
    },
    battle: {
      '0,9': guardPair('guard38', [P(1, 8)]),
      '2,9': guardPair('guard38', [P(1, 8)]),
    },
  },
  39: {
    talk: {
      '0,10': hint('oldman', '谜题：“在3点，拥有传送功能的密宝 就会出现。', 'talk39'),
      '8,1': keyTrader(39, '我有3把兰钥匙你出2000个金币就都给你。', 2000, (c) => {
        c.hero.keys.blue += 3;
      }, '塔内有个 幸运金币。拥有它在打败敌人后能获得2倍的金钱。'),
    },
    // 「3 点」谜题：九扇黄门中只打开 (3,1) 与 (5,3) 两扇（时钟指针指向 3 点），中间那扇门变成瞬移卷轴
    afterAnyDoor: (c) => {
      if (c.flags.puzzle39) return;
      const open = DOORS39.filter((p) => !c.game.cell(p)?.door).map((p) => `${p.x},${p.y}`);
      if (open.length === 2 && open.includes('3,1') && open.includes('5,3')) {
        c.flags.puzzle39 = true;
        c.set(P(3, 3), { door: undefined, item: 'centerFly' });
        c.tip('「在 3 点」——瞬移卷轴出现了！');
      }
    },
  },
  40: { step: { '5,6': knight40 } },
};

export function zone4StepSpent(floor: number, key: string, flags: Record<string, unknown>): boolean {
  switch (`${floor}:${key}`) {
    case '32:5,9': return !!flags.knight32;
    case '33:9,4': return !!flags.trap33;
    case '40:5,6': return !!flags.knight40;
    default: return false;
  }
}

/** 第四区的剧情音乐 */
export const knightBattleActive = (floor: number, flags: Record<string, unknown>) =>
  (floor === 32 && !!flags.knight32Active) || (floor === 40 && !!flags.knight40Active);


