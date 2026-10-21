/**
 * 第五区（41F–50F）与地下室（0F）剧情脚本。文本、数值、坐标取自 h5mota 51 号塔 floors/MT41–MT50.js，
 * 坐标已换算为去掉外圈墙后的 11×11 坐标（原坐标 - 1）。详见 docs/research.md §16。
 */
import type { ScriptCtx } from './director';
import { VARIANT48 } from './variants';
import { altar, guardPair, hint, keyTrader, P, type FloorScripts } from './scriptlib';
import type { Point } from './types';
import { bagAdd } from './entities';

/** 49F 假魔王与 8 名魔法警卫（十字为可封印的 4 格，四角为不能动的 4 格） */
const KING49 = P(5, 2);
const CROSS49 = [P(5, 1), P(4, 2), P(6, 2), P(5, 3)];
const CORNER49 = [P(4, 1), P(6, 1), P(4, 3), P(6, 3)];

function setKing(c: ScriptCtx, hp: number, atk: number, def: number): void {
  c.flags.redKingHp = hp;
  c.flags.redKingAtk = atk;
  c.flags.redKingDef = def;
}
function kingStats(c: ScriptCtx): [number, number, number] {
  if (c.flags.redKingHp === undefined) setKing(c, 8000, 5000, 1000);
  return [Number(c.flags.redKingHp), Number(c.flags.redKingAtk), Number(c.flags.redKingDef)];
}

async function zeno49(c: ScriptCtx): Promise<void> {
  if (c.flags.zeno49) return;
  c.flags.zeno49 = true;
  kingStats(c);
  c.closeDoor(P(5, 6));
  await c.say('redKing', '你终于来了，我很想与你立刻决斗，但我的部下不同意。', '魔王');
  c.game.emit({ type: 'map' }); // 切换为 Zeno 曲
  c.set(KING49, { terrain: 'floor', monster: 'redKing' });
  for (const p of [...CROSS49, ...CORNER49]) c.set(p, { terrain: 'floor', monster: 'whiteKing' });
  await c.wait(200);
}

/** 骰子上「5」的封印：四角的警卫还在、十字的 4 名警卫全部消灭 → 魔王只剩一成功力 */
function seal49(c: ScriptCtx): Promise<void> | void {
  if (!c.flags.zeno49 || c.flags.sealed49 || c.flags.fakeKing49) return;
  if (c.game.cell(KING49)?.monster !== 'redKing') return;
  if (!CORNER49.every((p) => c.game.cell(p)?.monster === 'whiteKing')) return;
  if (CROSS49.some((p) => c.game.cell(p)?.monster)) return;
  c.flags.sealed49 = true;
  if (c.flags.talked50) c.flags.TE = true;
  const [hp, atk, def] = kingStats(c);
  setKing(c, Math.floor(hp / 10), Math.floor(atk / 10), Math.floor(def / 10));
  c.game.touchMap();
  return c.say('redKing', '啊！，我怎么被封印了，我只剩下一成的功力了！！！', '魔王');
}

async function fakeKingDefeated(c: ScriptCtx): Promise<void> {
  c.flags.fakeKing49 = true;
  await c.say('redKing', '哈哈哈，很好，你是个合格的战士。', '魔王');
  for (const p of [KING49, ...CROSS49, ...CORNER49]) c.set(p, { terrain: 'floor', monster: undefined });
  c.set(P(4, 1), { item: 'redKey' });
  c.set(P(6, 1), { item: 'knife' });
  for (const x of [1, 2, 3]) c.set(P(x, 3), { item: 'redGem' });
  for (const x of [7, 8, 9]) c.set(P(x, 3), { item: 'blueGem' });
  for (const x of [4, 5, 6]) c.set(P(x, 4), { item: 'bluePotion' });
  c.openDoor(P(5, 6));
  c.openDoor(P(5, 8));
  c.game.emit({ type: 'map' });
}

/** 50F：小偷原来是真魔王 */
async function lastTalk(c: ScriptCtx): Promise<void> {
  c.flags.talked50 = true; // 原版 flag「与50层小偷对话」
  c.game.emit({ type: 'map' }); // 切换为 LastFight 曲
  await c.say('hero', '你怎会在这里！你到底是谁？');
  await c.say('thief', '我在这里只有一个理由，那就是...');
  setKing(c, 5000, 1580, 190);
  c.set(c.at, { npc: undefined, monster: 'redKing' });
  await c.wait(400);
  const K = (t: string) => c.say('redKing', t, '魔王');
  await c.say('hero', '啊！你就是魔王！你怎么还活着？');
  await K('我是不会死的。以前我只是对你的能力做测试而已。');
  await c.say('hero', '什么？你这是什么意思？你为什么要做这样的事情？');
  await K('神圣剑 就是你装备的武器，智慧权杖 我所装备的武器。先知说过无论谁使用它们都必需要有足够的智慧，且剑只能被真正的战士使用。');
  await c.say('hero', '如你所说我就是那个战士');
  await K('是的，你是最合适的人选。但你刚到魔塔时，你的能力还不足以支配神圣剑。因此我在塔内安排了各类机关，让你通过战斗直到可以控制神圣剑。');
  await c.say('hero', '很好，那么外面传说有一个公主被困在魔塔，就是为了把我骗到这里。是这样的吗？');
  await K('是的。现在如果我们能够合作那么这场闹剧就结束了。现在让我们一起用权杖破坏神圣剑，这样伟大的时代就要降临了。');
  c.game.touchMap();
}

export const ZONE5_SCRIPTS: Record<number, FloorScripts> = {
  41: {
    battle: {
      '1,1': (c) => {
        if (!c.flags.wiz41) c.flags.wiz41 = 1;
      },
      // 右侧牢墙里现身的红衣巫师（左右对称）：击败后中间的格局改变，出现降临之翼
      '9,1': async (c) => {
        if (c.flags.wiz41 !== 2) return;
        c.flags.wiz41 = 3;
        for (const p of [P(4, 5), P(5, 5), P(6, 5)]) c.set(p, { terrain: 'wall', door: undefined });
        c.openDoor(P(4, 6));
        c.openDoor(P(6, 6));
        c.set(P(5, 4), { item: 'downFly' });
        c.set(P(6, 0), { terrain: 'wall' });
        c.tip('降临之翼出现了');
      },
    },
    bump: {
      '9,1': (c) => {
        if (Number(c.flags.wiz41 ?? 0) >= 2) return;
        // 原版条件（MT41 10,2）：先击败左上角的高级巫师、到过 42F、从左侧 (8,1) 撞墙。
        // 原版不满足时毫无反应，玩家常以为「暗墙打不开」——这里给出温和的提示。
        if (c.flags.wiz41 !== 1) {
          c.tip('墙壁纹丝不动……对面角落的巫师似乎在守护着什么。');
          return;
        }
        if (!c.game.visited.has(42)) {
          c.tip('墙后隐约有动静，但时机未到（先去 42 层看看）。');
          return;
        }
        if (c.game.pos.x !== 8 || c.game.pos.y !== 1) {
          c.tip('墙壁纹丝不动……试试从左侧撞墙。');
          return;
        }
        c.flags.wiz41 = 2;
        c.set(P(9, 1), { terrain: 'floor', monster: 'redWizard' });
        c.game.emit({ type: 'doorOpen', at: P(9, 1), kind: 'sealed' });
      },
    },
  },
  42: {
    talk: { '0,3': hint('oldman', '巫师 会用魔法攻击路过的人，在2个 魔法警卫 间通过会使你的生命减少一半。', 'talk42') },
    step: {
      '4,9': async (c) => {
        if (c.flags.scene42) return;
        c.flags.scene42 = true;
        if (c.game.cell(P(5, 9))?.npc !== 'goldKnight') return;
        await c.say('goldKnight', '啊！又是你！！”（转身逃跑）');
        await c.walk(P(5, 9), ['up:2'], 160);
        c.set(P(5, 5), { npc: 'demonKing' });
        await c.say('redKing', '你敢临阵脱逃！', '魔王');
        await c.say('goldKnight', '哦，大王，我打不过这个勇士，不得不逃，绕了我吧？');
        await c.say('redKing', '你说什么？你敢再说一次！你象个胆小鬼一样逃离你负责的区域,并说出那样的话。魔塔不需要象你这样的败类，来人给我杀了。', '魔王');
        for (const p of [P(5, 6), P(4, 7), P(6, 7), P(5, 8)]) c.set(p, { npc: 'magicGuard' });
        await c.wait(300);
        await c.say('goldKnight', '大王，饶了我吧，再给我一次机会阿.....');
        c.game.emit({ type: 'itemFx', item: 'bomb', cells: [P(5, 7)] });
        c.set(P(5, 7), { npc: undefined });
        await c.wait(500);
        await c.say('redKing', '虽然我刚才态度异常，但别担心在决斗时，我不会像刚才这个无用的家伙一样让手下一拥而上。我期待着与你决斗。', '魔王');
        for (const p of [P(5, 5), P(5, 6), P(4, 7), P(6, 7), P(5, 8)]) c.set(p, { npc: undefined });
      },
    },
  },
  43: {
    step: {
      // 黄门后的陷阱：魔法警卫退到角落，墙把通路封住（原版 MT43 8,1）
      '7,0': async (c) => {
        if (c.flags.trap43) return;
        c.flags.trap43 = true;
        if (c.game.cell(P(8, 0))?.monster !== 'whiteKing') return;
        c.set(P(7, 1), { terrain: 'wall' });
        c.set(P(9, 1), { terrain: 'wall' });
        c.set(P(6, 0), { terrain: 'wall', door: undefined });
        await c.walk(P(8, 0), ['right:2'], 160);
        c.set(P(9, 0), { terrain: 'wall' });
      },
    },
    battle: {
      '8,0': (c) => {
        c.set(P(7, 1), { terrain: 'wall' });
        c.set(P(9, 1), { terrain: 'wall' });
      },
    },
  },
  44: {
    battle: {
      '4,8': guardPair('guard44', [P(5, 7)]),
      '6,8': guardPair('guard44', [P(5, 7)]),
    },
  },
  45: {
    talk: {
      '8,5': hint('oldman', '神圣盾 能防御魔法攻击，但它被藏在异空间的楼层内。', 'talk45'),
      '8,2': keyTrader(45, '给我1000个金币我就提升你的生命2000点。', 1000, (c) => {
        c.hero.hp += 2000;
      }, '44楼 被藏在异空间，你只能用密宝才能到达'),
    },
    battle: {
      '7,8': guardPair('guard451', [P(6, 9)]),
      '7,10': guardPair('guard451', [P(6, 9)]),
      '4,8': guardPair('guard452', [P(3, 9)]),
      '4,10': guardPair('guard452', [P(3, 9)]),
    },
  },
  46: {
    talk: {
      '5,0': altar,
      '7,8': hint('oldman', '41楼 事实上是左右对称的。', 'talk46'),
    },
  },
  47: {
    talk: {
      '4,1': keyTrader(47, '给我4000个金币我就给你地震卷轴，它可摧毁一层楼所有的墙', 4000, (c) => {
        bagAdd(c.hero, 'earthquake', 1);
      }, '如果要打败魔龙你需要 圣剑，圣盾，屠龙匕 或更高等级的装备。'),
    },
  },
  48: {
    talk: { '2,1': hint('oldman', '象骰子上5的形状是一种封印魔法，你最好记住它在你与49楼假魔王战斗时有用。', 'talk48') },
    ...VARIANT48,
  },
  49: {
    step: { '5,5': zeno49 },
    battle: {
      '4,9': guardPair('guard491', [P(5, 8)]),
      '6,9': guardPair('guard491', [P(5, 8)]),
      '4,7': guardPair('guard492', [P(5, 6)]),
      '6,7': guardPair('guard492', [P(5, 6)]),
      '5,2': fakeKingDefeated,
    },
    afterAnyBattle: seal49,
  },
  50: {
    talk: { '5,4': lastTalk },
    battle: {
      '5,4': async (c) => {
        const kind = c.flags.TE ? 'TE' : 'NE';
        c.flags.ending = kind;
        await c.say('redKing', '祝贺你顺利过关，此游戏为本人的第一个falsh作品。制作的比较简陋请谅解，再次谢谢你的使用。', '作者');
        c.game.emit({ type: 'ending', kind });
      },
    },
  },
};

export function zone5StepSpent(floor: number, key: string, flags: Record<string, unknown>): boolean {
  switch (`${floor}:${key}`) {
    case '42:4,9': return !!flags.scene42;
    case '43:7,0': return !!flags.trap43;
    case '49:5,5': return !!flags.zeno49;
    default: return false;
  }
}

/** 第五区的剧情音乐 */
export function zone5Music(floor: number, flags: Record<string, unknown>): 'zeno' | 'lastfight' | 'ending' | null {
  if (flags.ending) return 'ending';
  if (floor === 49 && flags.zeno49 && !flags.fakeKing49) return 'zeno';
  if (floor === 50 && flags.talked50) return 'lastfight';
  return null;
}

export const ZONE5_KING_AT: Point = KING49;
