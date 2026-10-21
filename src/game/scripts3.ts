/**
 * 第三区（21F–30F）剧情脚本。文本、数值、坐标取自 h5mota 51 号塔 floors/MT21–MT30.js 与 commonEvents.json，
 * 坐标已换算为去掉外圈墙后的 11×11 坐标（原坐标 - 1）。详见 docs/research.md §16。
 */
import type { ScriptCtx } from './director';
import { hint, P, type FloorScripts } from './scriptlib';

/** 23F 隐形迷宫的墙（mazeWall）是否还有没被撞出来的 */
export function mazeRemaining(c: ScriptCtx): number {
  let n = 0;
  for (const row of c.game.floors[23]) for (const cell of row) if (cell.terrain === 'mazeWall') n++;
  return n;
}

/** 26F 救出「公主」后，24F 中央出现通往 50F 的暗道（原版 setBlock / show MT24） */
function open24(c: ScriptCtx): void {
  c.setOn(24, P(5, 0), { terrain: 'airwall' });
  c.setOn(24, P(4, 0), { terrain: 'wall' });
  c.setOn(24, P(6, 0), { terrain: 'wall' });
  for (const y of [1, 2, 3]) c.setOn(24, P(5, y), { terrain: 'floor' });
}

const SLIMES30 = [P(2, 4), P(3, 4), P(4, 4), P(6, 4), P(7, 4), P(8, 4)];

export const ZONE3_SCRIPTS: Record<number, FloorScripts> = {
  21: {
    talk: {
      '5,5': hint('oldman', '大法师住在25楼，他是魔塔的主人。以你现在的状态去攻击他简直就是自杀。 你应当在取得更高级别的道具后再去打败他。', 'talk21'),
    },
  },
  23: {
    talk: {
      '10,10': hint('oldman', '我没有什么可说的，但有一个确切的消息藏在这个楼层里。', 'talk23'),
    },
  },
  24: {
    step: {
      // 暗道尽头：时空穿越到 50F（原版：黑幕 + 楼层数字滚动 24 → 50）
      '5,1': async (c) => {
        if (!c.flags.princess) return;
        await c.host.curtain(true, 400);
        for (let f = 24; f <= 50; f += 2) {
          c.host.tip(`${f}F`);
          await c.wait(60);
        }
        await c.host.transition(() => c.game.changeFloor(50, P(5, 6)));
        c.game.facing = 'up';
        await c.host.curtain(false, 400);
        c.host.autosave();
      },
    },
  },
  25: {
    step: {
      '5,8': async (c) => {
        if (c.flags.magician25) return;
        c.flags.magician25 = true;
        if (c.game.cell(P(5, 5))?.monster === 'blackMagician') await c.say('blackMagician', '杀-死-入-侵-者-');
      },
    },
    battle: {
      '5,5': async (c) => {
        c.flags.magicianDefeated = true;
        for (const x of [3, 4, 6, 7]) c.set(P(x, 7), { item: 'redKey' });
        c.tip('出现了 4 把红钥匙！');
      },
    },
  },
  26: {
    talk: {
      '5,5': async (c) => {
        await c.say('princess', '时间到了，你已被命运选中。如果你不怕死亡,你最终将通过时空来到我这里。');
        await c.say('hero', '哦! 什么? 这只是个洋娃娃!');
        if (!c.flags.princess) {
          c.flags.princess = true; // 原版 flag「营救公主」
          open24(c);
          c.game.emit({ type: 'map' }); // 切换为 Princess 曲
          c.tip('似乎有什么地方发生了变化……');
        }
      },
    },
  },
  27: {
    talk: {
      '5,0': hint('oldman', '如果你到27楼时状态为：生命1500，攻击80，防御98，拥有1兰钥匙，5黄钥匙。那么祝贺你，你前期是比较成功的。', 'talk27'),
    },
  },
  28: {
    talk: {
      // 回收黄钥匙的商人（原版 MT28 4,8：每把 100 金币，可反复交易，不会消失）
      '7,3': async (c) => {
        await c.shop('trader', {
          text: () => '我按100个金币一把的价格回收黄钥匙，你出售吗？',
          options: () => ['我太需要了', '下次再说'],
          exit: 1,
          buy: () => {
            if (c.hero.keys.yellow <= 0) return { ok: false, msg: '你没有黄钥匙！' };
            c.hero.keys.yellow -= 1;
            c.hero.gold += 100;
            c.game.addLog('卖出 1 把黄钥匙，金币 +100', 'good');
            c.game.emit({ type: 'map' });
            c.game.emit({ type: 'statGain', stat: 'gold', delta: 100 });
            return { ok: true, msg: '卖出 1 把黄钥匙，金币 +100' };
          },
        });
      },
    },
  },
  29: {
    talk: {
      '5,1': async (c) => {
        // 原版 flash：23F 的隐形墙必须全部撞出来，小偷才会「挖好」暗道（著名的原版 bug）。
        // h5 51 号塔默认开启「额外功能」（MT1 firstArrive 设 flag:额外功能开关 = true）：
        // 墙没撞完时小偷开个玩笑，然后照样打通暗道 —— 这里采用 h5 默认行为。
        if (mazeRemaining(c) > 0) {
          await c.say('thief', '你先到别的地方走走，我还在挖暗道。');
          await c.say('thief', '也许，你需要把之前某层的所有墙还原暗道才能挖好？');
          await c.wait(500);
          await c.say('thief', '哈哈，开玩笑的，怎么会有人这么干呢？');
        }
        await c.say('thief', '哦，我刚完成暗道。你每次都及时赶到，看在朋友的份上，你可以免费使用。好了下次见。');
        c.flags.thief29 = true;
        c.openDoor(P(5, 2));
        await c.wait(150);
        await c.walk(P(5, 1), ['down:9'], 150, false);
        c.setOn(2, P(9, 10), { npc: 'thief' });
      },
    },
  },
  30: {
    // 6 只史莱姆全部被消灭后打开中间的机关门（原版 afterBattle 计数）
    watch: SLIMES30,
    afterAnyBattle: (c) => {
      if (c.flags.door30) return;
      if (SLIMES30.every((p) => !c.game.cell(p)?.monster)) {
        c.flags.door30 = true;
        c.openDoor(P(5, 3));
        c.tip('机关门打开了！');
      }
    },
  },
};

/** 2F 的小偷（29F 暗道完成之后出现）：去 35F 魔龙前打开暗道 */
export async function thief2(c: ScriptCtx): Promise<void> {
  await c.say('thief', '哈哈，我们又见面了! 谢谢你救了我。我可以帮你在魔龙前打开一条暗道，我现在就去35楼。');
  c.flags.thief2b = true;
  c.setOn(35, P(3, 8), { terrain: 'floor' });
  c.setOn(35, P(4, 9), { npc: 'thief' });
  c.hideSelf();
}

export function zone3StepSpent(floor: number, key: string, flags: Record<string, unknown>): boolean {
  switch (`${floor}:${key}`) {
    case '25:5,8': return !!flags.magician25;
    case '24:5,1': return false;
    default: return false;
  }
}
