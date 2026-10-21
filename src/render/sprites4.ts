/**
 * 第三–五区（21F–50F）与 0F 新增的程序化像素美术：
 * 骑士 / 战士 / 双手剑士 / 骑士队长 / 黑暗骑士（同一套铠甲人形，按配色与武器区分）、鬼战士、史莱姆王、吸血蝙蝠、
 * 初级 / 高级巫师、高级卫兵、大法师、魔龙（96×96，3×3 格）、公主（洋娃娃），以及 14 种新道具与星空地形。
 * 与 sprites.ts / sprites3.ts 使用同一套 32×32 网格、调色与描边规范，每个角色 4 帧待机动画 + 眨眼帧。
 */
import { Pix } from './pixel';
import { swap } from './sprites3';
import { bigBatSprite, coinIcon, keyIcon, shieldIcon, skeletonSprite, slimeSprite, swordIcon, wizardSprite } from './sprites';
import { guardSprite } from './sprites2';

const OUT = '#2a1b3d';
const GOLD = '#ffcf4a';
const GOLD_L = '#fff1a6';
const GOLD_D = '#d08a1c';
const SILVER = '#e2e9f6';
const SILVER_L = '#ffffff';
const SILVER_D = '#98a6c6';
const SKIN = '#ffd3aa';
const SKIN_D = '#eaa77e';
const WHITE = '#ffffff';

interface Mat {
  main: string;
  light: string;
  dark: string;
}

interface WarriorOpts {
  armor: Mat;
  cloth: string;
  trim: string;
  helm: 'plume' | 'horn' | 'visor' | 'band';
  weapon: 'sword' | 'twin' | 'lance' | 'great';
  plume?: string;
  cape?: Mat;
  eye?: string;
  shield?: Mat;
}

/** 通用铠甲人形（骑士、战士、双手剑士、骑士队长、黑暗骑士） */
function warrior(frame: number, blink: boolean, o: WarriorOpts): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const sw = [0, 1, 2, 1][frame];
  const A = o.armor;
  // 披风（在身后）
  if (o.cape) {
    p.poly([[9, 13 + b], [23, 13 + b], [26 + (frame % 2), 29], [6 - (frame % 2), 29]], o.cape.main);
    p.autoShade([o.cape.main], o.cape.light, o.cape.dark);
  }
  // 腿与靴
  p.rect(12, 22, 3, 6, A.dark);
  p.rect(17, 22, 3, 6, A.dark);
  p.rect(11, 27, 4, 3, A.main);
  p.rect(17, 27, 4, 3, A.main);
  p.set(11, 27, A.light);
  p.set(17, 27, A.light);
  // 裙甲
  p.poly([[10, 20 + b], [22, 20 + b], [23, 24], [9, 24]], o.cloth);
  // 胸甲
  p.rect(10, 13 + b, 12, 8, A.main);
  p.autoShade([A.main], A.light, A.dark);
  p.rect(15, 14 + b, 2, 6, A.light);
  p.rect(10, 20 + b, 12, 1, o.trim);
  p.set(16, 17 + b, o.trim);
  // 肩甲
  p.ellipse(9.5, 14 + b, 3.3, 2.7, A.main);
  p.ellipse(22.5, 14 + b, 3.3, 2.7, A.main);
  p.set(8, 13 + b, A.light);
  p.set(21, 13 + b, A.light);
  p.rect(7, 16 + b, 6, 1, o.trim);
  p.rect(20, 16 + b, 6, 1, o.trim);
  // 手臂
  p.rect(7, 16 + b, 3, 5, A.dark);
  p.rect(22, 16 + b, 3, 5, A.dark);
  // 武器
  if (o.weapon === 'lance') {
    p.line(25, 27, 25, 1 + b - sw, '#a5683a', 2);
    p.poly([[23.5, 4 + b - sw], [27.5, 4 + b - sw], [25.5, -2 + b - sw]], SILVER);
    p.set(25, 1 + b - sw, SILVER_L);
    p.rect(23, 5 + b - sw, 5, 1, o.trim);
  } else if (o.weapon === 'great') {
    p.line(25, 22 + b, 25, 0 + b - sw, SILVER, 3);
    p.line(24, 21 + b, 24, 1 + b - sw, SILVER_L, 1);
    p.line(26, 21 + b, 26, 1 + b - sw, SILVER_D, 1);
    p.rect(21, 21 + b, 9, 2, o.trim);
    p.rect(24, 23 + b, 3, 4, '#5a3a20');
  } else {
    p.line(24, 21 + b, 27, 6 + b - sw, SILVER, 2);
    p.line(24, 21 + b, 27, 6 + b - sw, SILVER_L, 1);
    p.rect(22, 20 + b, 5, 2, o.trim);
    if (o.weapon === 'twin') {
      p.line(8, 21 + b, 4, 7 + b + sw - 2, SILVER, 2);
      p.line(8, 21 + b, 4, 7 + b + sw - 2, SILVER_L, 1);
      p.rect(5, 20 + b, 5, 2, o.trim);
    }
  }
  // 盾
  if (o.shield) {
    p.poly([[3, 15 + b], [10, 15 + b], [10, 21 + b], [6.5, 25 + b], [3, 21 + b]], o.shield.main);
    p.autoShade([o.shield.main], o.shield.light, o.shield.dark);
    p.rect(6, 17 + b, 1, 5, o.trim);
  }
  // 头盔 / 头部
  if (o.helm === 'band') {
    p.ellipse(16, 9 + b, 5.4, 5.2, SKIN);
    p.autoShade([SKIN], '#ffe6cc', SKIN_D);
    p.poly([[10.5, 7 + b], [21.5, 7 + b], [21, 3 + b], [16, 2 + b], [11, 3 + b]], '#4a2a1a');
    p.rect(10, 6 + b, 12, 2, o.trim);
    p.rect(21, 7 + b, 3, 1, o.trim);
    p.set(24, 8 + b, o.trim);
    if (blink) {
      p.rect(13, 10 + b, 2, 1, SKIN_D);
      p.rect(17, 10 + b, 2, 1, SKIN_D);
    } else {
      p.rect(13, 9 + b, 2, 2, OUT);
      p.rect(17, 9 + b, 2, 2, OUT);
      p.set(13, 9 + b, WHITE);
      p.set(17, 9 + b, WHITE);
    }
    p.rect(14, 13 + b, 4, 1, SKIN_D);
  } else {
    p.ellipse(16, 8.5 + b, 5.8, 5.6, A.main);
    p.autoShade([A.main], A.light, A.dark);
    // 面罩缝
    p.rect(11, 8 + b, 10, 2, OUT);
    const eye = o.eye ?? '#9ad8ff';
    if (!blink) {
      p.rect(13, 8 + b, 2, 1, eye);
      p.rect(17, 8 + b, 2, 1, eye);
    }
    p.rect(15, 10 + b, 2, 3, A.dark);
    if (o.helm === 'plume') {
      const pl = o.plume ?? '#ff4f62';
      p.poly([[15, 3 + b], [18, 0 + b], [23, 1 + b - (frame % 2)], [20, 4 + b]], pl);
      p.set(19, 1 + b, WHITE);
    } else if (o.helm === 'horn') {
      p.poly([[11, 5 + b], [7, 0 + b], [9, 6 + b]], '#f1e6c8');
      p.poly([[21, 5 + b], [25, 0 + b], [23, 6 + b]], '#f1e6c8');
    } else {
      p.rect(15, 2 + b, 2, 2, o.trim);
    }
  }
  return p.outline(OUT);
}

const STEEL: Mat = { main: '#a9b4cc', light: '#e2e9f6', dark: '#66708c' };
const REDA: Mat = { main: '#d8344a', light: '#ff8a8a', dark: '#8a1a2a' };
const GOLDA: Mat = { main: GOLD, light: GOLD_L, dark: GOLD_D };
const DARKA: Mat = { main: '#3a3150', light: '#6c5f8e', dark: '#1a1428' };

export const soldierSprite = (f: number, b: boolean) =>
  warrior(f, b, { armor: STEEL, cloth: '#3d8a5a', trim: '#5a4a7a', helm: 'visor', weapon: 'sword', shield: { main: '#7a5232', light: '#b07a4a', dark: '#4a3020' } });
export const swordsmanSprite = (f: number, b: boolean) =>
  warrior(f, b, { armor: { main: '#9a6a3a', light: '#d4a26a', dark: '#5e3c1e' }, cloth: '#3a3a6a', trim: '#e8455c', helm: 'band', weapon: 'twin' });
export const redKnightSprite = (f: number, b: boolean) =>
  warrior(f, b, { armor: REDA, cloth: '#2a2a4a', trim: GOLD, helm: 'plume', plume: '#ffffff', weapon: 'lance', shield: { main: GOLD, light: GOLD_L, dark: GOLD_D } });
export const yellowKnightSprite = (f: number, b: boolean) =>
  warrior(f, b, { armor: GOLDA, cloth: '#3d5ad8', trim: '#e8455c', helm: 'plume', plume: '#ff4f62', weapon: 'sword', cape: { main: '#f2f4ff', light: WHITE, dark: '#a9b0e0' }, eye: '#ff5a5a' });
export const darkKnightSprite = (f: number, b: boolean) =>
  warrior(f, b, { armor: DARKA, cloth: '#5a1020', trim: '#b04aff', helm: 'horn', weapon: 'great', cape: { main: '#7a1428', light: '#c03048', dark: '#3a0810' }, eye: '#ff3b3b' });

/** 鬼战士：骷髅士兵换成幽蓝的亡灵配色 */
export const ghostSkeletonSprite = (f: number, b: boolean) =>
  swap(skeletonSprite(f, b, true), {
    '#f6f1e2': '#bfe0ff', '#ffffff': '#eef8ff', '#cbc2a8': '#7fa6d8', '#7b6b9e': '#2a3a6a',
    '#ff5a5a': '#7dff9a', '#ff9a7a': '#c6ffd2', '#ff3a4a': '#4fe07a',
  });

/** 史莱姆王：紫色大史莱姆 + 金王冠 */
export function slimelordSprite(frame: number, blink: boolean): Pix {
  const p = slimeSprite({ main: '#a45cf0', light: '#d4a6ff', dark: '#6a2eb0', pale: '#f0e0ff' }, frame, blink, true);
  const b = [0, 1, 2, 1][frame];
  const y = 6 + b;
  p.poly([[10, y + 5], [10, y], [13, y + 3], [16, y - 1], [19, y + 3], [22, y], [22, y + 5]], GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  p.set(16, y + 2, '#ff4f62');
  p.set(12, y + 3, '#5ad8ff');
  p.set(20, y + 3, '#5ad8ff');
  return p;
}

/** 吸血蝙蝠：大蝙蝠换成深红 + 黑翼 */
export const redBatSprite = (f: number, b: boolean) =>
  swap(bigBatSprite(f, b), {
    '#b8324a': '#8a0f2a', '#ff6a7e': '#e0304a', '#7a1430': '#4a0618',
    '#5a2a4a': '#2a1a2e', '#8e4a72': '#4a2a4a', '#3a1830': '#140810', '#c47a9a': '#7a4a6a',
    '#ffe14a': '#7dff6a',
  });

/**
 * 领域巫师（初级巫师 / 高级巫师）：原来与老人同为「长袍 + 白胡子 + 拐杖」，玩家反馈太像。
 * 重新设计为：兜帽遮住整张脸（阴影中只露出发光的眼睛）、无胡子无拐杖、悬浮的锯齿下摆、
 * 双手各托一团魔焰，脚下一圈魔法阵（暗示「领域」伤害），身边环绕符文碎片。
 */
interface SorcPal {
  robe: Mat;
  inner: string;
  trim: string;
  eye: string;
  flame: [string, string, string];
  rune: string;
}
function sorcererSprite(frame: number, blink: boolean, o: SorcPal): Pix {
  const p = new Pix();
  const b = [0, -1, -2, -1][frame];
  const R = o.robe;
  // 魔法阵（脚下的领域圈，最先画，被身体遮住中间）
  p.ellipse(16, 29, 12.5, 2.8, o.rune);
  p.ellipse(16, 29, 10.5, 1.8, null);
  for (const [x, on] of [[5, 0], [27, 1], [10, 2], [22, 3]] as const) if ((frame + on) % 2 === 0) p.set(x, 29, GOLD_L);
  // 悬浮长袍（锯齿下摆）
  p.poly([[10, 13 + b], [22, 13 + b], [26, 26 + b], [23, 24 + b], [20, 27 + b], [16, 25 + b], [12, 27 + b], [9, 24 + b], [6, 26 + b]], R.main);
  p.autoShade([R.main], R.light, R.dark);
  // 前襟内衬与腰带
  p.poly([[14, 14 + b], [18, 14 + b], [19, 24 + b], [13, 24 + b]], o.inner);
  p.rect(11, 18 + b, 10, 1, o.trim);
  p.stamp(15, 19 + b, ['.T.', 'TET', '.T.'], { T: o.trim, E: o.eye });
  // 抬起施法的袖子
  p.poly([[11, 14 + b], [7, 17 + b], [5, 15 + b], [8, 13 + b]], R.main);
  p.poly([[21, 14 + b], [25, 17 + b], [27, 15 + b], [24, 13 + b]], R.main);
  p.autoShade([R.main], R.light, R.dark);
  p.rect(5, 16 + b, 3, 1, o.trim);
  p.rect(25, 16 + b, 3, 1, o.trim);
  // 兜帽（尖顶，向后垂）
  p.poly([[9, 13 + b], [10, 6 + b], [14, 2 + b], [19, 0 + b], [18, 3 + b], [22, 6 + b], [23, 13 + b]], R.main);
  p.autoShade([R.main], R.light, R.dark);
  p.rect(10, 12 + b, 13, 1, o.trim);
  // 阴影中的脸 + 发光眼睛
  p.ellipse(16, 9.5 + b, 4.2, 3.4, '#140a22');
  if (blink) {
    p.rect(13, 10 + b, 2, 1, R.dark);
    p.rect(17, 10 + b, 2, 1, R.dark);
  } else {
    p.rect(13, 9 + b, 2, 2, o.eye);
    p.rect(17, 9 + b, 2, 2, o.eye);
    p.set(13, 9 + b, WHITE);
    p.set(17, 9 + b, WHITE);
  }
  // 双手魔焰（逐帧跳动）
  const fl = o.flame;
  const fh = [0, 1, 0, -1][frame];
  for (const cx of [5, 27]) {
    p.ellipse(cx, 13 + b, 2.2, 2.6 + fh * 0.3, fl[0]);
    p.ellipse(cx, 13.5 + b, 1.3, 1.6, fl[1]);
    p.set(cx, 10 + b - fh, fl[1]);
    p.set(cx, 14 + b, fl[2]);
  }
  p.outline(OUT);
  // 环绕的符文碎片（不描边，像光点）
  const orbit: Array<[number, number]> = [[2, 6], [29, 4], [30, 21], [1, 22]];
  const [ox, oy] = orbit[frame];
  p.set(ox, oy + b, o.rune);
  p.set(ox + 1, oy + b, GOLD_L);
  const [ox2, oy2] = orbit[(frame + 2) % 4];
  p.set(ox2, oy2 + b, o.rune);
  return p;
}

/** 初级巫师：墨绿兜帽 + 琥珀魔焰（与老人的棕袍白胡子完全不同） */
export const brownWizardSprite = (f: number, b: boolean) =>
  sorcererSprite(f, b, {
    robe: { main: '#3f8f6a', light: '#7fd6a2', dark: '#22553e' },
    inner: '#f2d27a', trim: '#ffcf4a', eye: '#b6ff5a',
    flame: ['#ffb03b', '#fff27a', '#ffffff'], rune: '#7dffb4',
  });
/** 高级巫师：深红兜帽 + 黑金内衬 + 紫焰 */
export const redWizardSprite = (f: number, b: boolean) =>
  sorcererSprite(f, b, {
    robe: { main: '#c42a4a', light: '#ff7a8a', dark: '#6a0f24' },
    inner: '#2a1838', trim: '#ffcf4a', eye: '#ff9a3a',
    flame: ['#b04aff', '#e7a6ff', '#ffffff'], rune: '#ff7ae0',
  });
export const blackMagicianSprite = (f: number, b: boolean) =>
  swap(wizardSprite(f, b), { '#5964ec': '#2a1a3a', '#97a0ff': '#5a3a7a', '#3a40b8': '#120a1c', [GOLD]: '#b04aff', '#ffffff': '#b8b8c8', '#ff7ae0': '#c04aff', '#ffb0f0': '#e0a0ff' });

/** 高级卫兵：中级卫兵换成赤红铠甲 */
export const redGuardSprite = (f: number, b: boolean) =>
  swap(guardSprite(f, b, true), { '#4f7cf0': '#d23a3a', '#9cc0ff': '#ff8a7a', '#2c48b0': '#8a1a20', '#e8455c': '#2a2a3a' });

/** 公主（26F 的洋娃娃）：金发、粉色蓬蓬裙、小王冠 */
export function princessSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, -1, 0][frame];
  const D = '#ff8ac4';
  const DL = '#ffc6e2';
  const DD = '#d0508e';
  const HAIR = '#ffd84a';
  const HAIR_D = '#d8a020';
  // 裙子
  p.poly([[12, 15 + b], [20, 15 + b], [26, 29], [6, 29]], D);
  p.autoShade([D], DL, DD);
  for (let x = 7; x <= 25; x += 3) p.set(x, 28, WHITE);
  p.rect(12, 15 + b, 8, 2, DL);
  // 手
  p.ellipse(9.5, 19 + b, 1.8, 1.8, SKIN);
  p.ellipse(22.5, 19 + b, 1.8, 1.8, SKIN);
  // 长发（身后）
  p.ellipse(16, 11 + b, 7.5, 8, HAIR);
  p.rect(9, 11 + b, 3, 8, HAIR);
  p.rect(20, 11 + b, 3, 8, HAIR);
  p.autoShade([HAIR], '#fff0a0', HAIR_D);
  // 脸
  p.ellipse(16, 11 + b, 5, 4.6, SKIN);
  p.rect(11, 6 + b, 10, 3, HAIR);
  if (blink) {
    p.rect(13, 11 + b, 2, 1, SKIN_D);
    p.rect(17, 11 + b, 2, 1, SKIN_D);
  } else {
    p.rect(13, 10 + b, 2, 2, '#3a5ad8');
    p.rect(17, 10 + b, 2, 2, '#3a5ad8');
    p.set(13, 10 + b, WHITE);
    p.set(17, 10 + b, WHITE);
  }
  p.set(12, 13 + b, '#ff9aa8');
  p.set(19, 13 + b, '#ff9aa8');
  p.rect(15, 14 + b, 2, 1, '#d04a6a');
  // 王冠
  p.poly([[12, 6 + b], [12, 2 + b], [14, 4 + b], [16, 1 + b], [18, 4 + b], [20, 2 + b], [20, 6 + b]], GOLD);
  p.set(16, 4 + b, '#ff4f62');
  const tw = [[5, 6], [27, 9], [6, 22], [26, 23]][frame];
  p.set(tw[0], tw[1], '#fff3b0');
  return p.outline(OUT);
}

/** 魔龙（96×96，3×3 格）：墨绿鳞片、金色腹甲、展开的翼膜；待机时翅膀扇动、头部起伏、喷出火星 */
export function dragonSprite(frame: number, blink: boolean): Pix {
  const p = new Pix(96, 96);
  const M = '#3f9a5a';
  const ML = '#7fd88a';
  const MD = '#1f5a34';
  const W = '#5a3a8a';
  const WL = '#9a6ad8';
  const WD = '#2e1a50';
  const BELLY = '#f2c64a';
  const bob = [0, -1, -2, -1][frame];
  const flap = [0, 3, 6, 3][frame];
  // 翅膀（左右）
  const wing = (dir: 1 | -1) => {
    const bx = 48 + dir * 14;
    const tip = 48 + dir * 46;
    p.poly([[bx, 38 + bob], [tip, 8 + flap], [tip - dir * 6, 30 + flap], [tip - dir * 2, 44 + flap / 2], [bx + dir * 14, 58 + bob]], W);
    p.autoShade([W], WL, WD);
    for (let i = 1; i <= 3; i++) p.line(bx, 40 + bob, tip - dir * i * 6, 12 + flap + i * 10, WD);
    p.line(bx, 38 + bob, tip, 8 + flap, MD, 2);
  };
  wing(-1);
  wing(1);
  // 尾巴
  for (let s = 0; s < 18; s++) {
    const t = s / 18;
    const x = 60 + t * 26 + Math.sin(t * 4 + frame * 1.5) * 3;
    const y = 86 - t * 18;
    p.ellipse(x, y, 5 * (1 - t) + 1.5, 5 * (1 - t) + 1.5, M);
  }
  p.poly([[84, 64], [92, 60], [88, 70]], ML);
  // 身体
  p.ellipse(48, 68 + bob, 22, 20, M);
  p.autoShade([M], ML, MD);
  p.ellipse(48, 72 + bob, 12, 14, BELLY);
  for (let y = 62; y < 86; y += 4) p.rect(40, y + bob, 17, 1, '#c8962a');
  // 腿与爪
  for (const lx of [32, 64]) {
    p.ellipse(lx, 84, 6, 7, M);
    p.autoShade([M], ML, MD);
    for (let c = -1; c <= 1; c++) p.poly([[lx + c * 3 - 1, 90], [lx + c * 3 + 1, 90], [lx + c * 3, 94]], '#f1e6c8');
  }
  // 脖子
  p.poly([[40, 54 + bob], [56, 54 + bob], [54, 34 + bob], [42, 34 + bob]], M);
  p.autoShade([M], ML, MD);
  // 头
  const hy = 26 + bob;
  p.ellipse(48, hy, 13, 11, M);
  p.rect(38, hy + 2, 20, 10, M);
  p.autoShade([M], ML, MD);
  p.rect(40, hy + 8, 16, 3, MD);
  // 鼻孔与獠牙
  p.set(43, hy + 6, OUT);
  p.set(53, hy + 6, OUT);
  p.poly([[41, hy + 11], [43, hy + 11], [42, hy + 14]], WHITE);
  p.poly([[53, hy + 11], [55, hy + 11], [54, hy + 14]], WHITE);
  // 角与背鳍
  p.poly([[38, hy - 6], [30, hy - 18], [41, hy - 9]], '#f1e6c8');
  p.poly([[58, hy - 6], [66, hy - 18], [55, hy - 9]], '#f1e6c8');
  for (let i = 0; i < 4; i++) p.poly([[46 + i * 0, hy - 10 - i * 0], [48, hy - 15], [50, hy - 10]], ML);
  // 眼
  if (blink) {
    p.rect(40, hy, 5, 1, OUT);
    p.rect(51, hy, 5, 1, OUT);
  } else {
    p.rect(40, hy - 2, 5, 3, '#ffe14a');
    p.rect(51, hy - 2, 5, 3, '#ffe14a');
    p.rect(42, hy - 2, 1, 3, OUT);
    p.rect(53, hy - 2, 1, 3, OUT);
  }
  // 火星
  const sparks: Array<[number, number]> = [[46, hy + 16], [50, hy + 18], [44, hy + 20], [52, hy + 15]];
  const [sx, sy] = sparks[frame];
  p.set(sx, sy, '#ffb03b');
  p.set(sx + 1, sy + 1, '#ff5a3a');
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 道具 */

export const knightSwordIcon = () =>
  swap(swordIcon(), { [SILVER]: '#bcd0ff', [SILVER_D]: '#6a82c8', [GOLD]: '#d23a3a', [GOLD_L]: '#ff8a8a', '#ff5a7a': '#5ad8ff' });
export const knightShieldIcon = () =>
  swap(shieldIcon(), { [GOLD]: '#c9d2ea', [GOLD_L]: WHITE, [GOLD_D]: '#7a86a8', '#3f7fe8': '#d23a3a', '#8fc0ff': '#ff8a8a', '#2856b8': '#8a1a2a' });
export function sacredSwordIcon(): Pix {
  const p = swap(swordIcon(), { [SILVER]: '#fff1a6', [SILVER_L]: WHITE, [SILVER_D]: '#e0b040', '#ff5a7a': '#ff4f62' });
  for (const [x, y] of [[28, 3], [21, 4], [29, 10]]) p.set(x, y, '#fff3b0');
  return p;
}
export const sacredShieldIcon = () =>
  swap(shieldIcon(), { '#3f7fe8': '#f6f6ff', '#8fc0ff': WHITE, '#2856b8': '#b8c0e0', [SILVER]: GOLD, [SILVER_L]: GOLD_L });
export function divineShieldIcon(): Pix {
  const p = swap(shieldIcon(), { [GOLD]: '#9fe8ff', [GOLD_L]: WHITE, [GOLD_D]: '#3aa6e0', '#3f7fe8': '#5a3ad8', '#8fc0ff': '#a68aff', '#2856b8': '#2e1a8a', [SILVER]: '#fff1a6', [SILVER_L]: WHITE });
  for (const [x, y] of [[2, 3], [29, 2], [1, 18], [30, 17], [16, 1]]) p.set(x, y, '#c6fbff');
  return p;
}

export function bombIcon(): Pix {
  const p = new Pix();
  p.ellipse(15, 19, 9.5, 9.5, '#3a3a52');
  p.autoShade(['#3a3a52'], '#7a7a9a', '#1a1a2a');
  p.rect(13, 7, 5, 4, '#7a7a9a');
  p.line(17, 7, 22, 3, '#c98a4b', 1);
  p.ellipse(23.5, 2.5, 2.4, 2.4, '#ffb03b');
  p.set(23, 2, WHITE);
  p.set(10, 14, WHITE);
  p.set(11, 13, WHITE);
  return p.outline(OUT);
}

export function centerFlyIcon(): Pix {
  const p = new Pix();
  p.ellipse(16, 16, 11, 11, '#8a5ad8');
  p.autoShade(['#8a5ad8'], '#c9a6ff', '#4a2a9a');
  p.ellipse(16, 16, 4, 4, '#f0e0ff');
  // 两个对称的箭头
  p.poly([[6, 8], [13, 8], [9.5, 4]], WHITE);
  p.line(9, 8, 9, 13, WHITE, 2);
  p.poly([[19, 24], [26, 24], [22.5, 28]], WHITE);
  p.line(22, 19, 22, 24, WHITE, 2);
  return p.outline(OUT);
}

function flyWing(up: boolean): Pix {
  const p = new Pix();
  const C = up ? '#5ad8ff' : '#ff8ac4';
  const CL = up ? '#c6f4ff' : '#ffd0e8';
  const CD = up ? '#2a8ac4' : '#c04a8a';
  // 翅膀
  for (let i = 0; i < 4; i++) p.ellipse(9 + i * 1.5, 10 + i * 4, 7 - i, 3, CL);
  p.autoShade([CL], WHITE, '#c0c8e0');
  // 箭头
  if (up) {
    p.poly([[16, 5], [27, 16], [21, 16], [21, 27], [11, 27], [11, 16], [5, 16]].map(([x, y]) => [x + 2, y] as [number, number]), C);
  } else {
    p.poly([[16, 27], [27, 16], [21, 16], [21, 5], [11, 5], [11, 16], [5, 16]].map(([x, y]) => [x + 2, y] as [number, number]), C);
  }
  p.autoShade([C], CL, CD);
  return p.outline(OUT);
}
export const upFlyIcon = () => flyWing(true);
export const downFlyIcon = () => flyWing(false);

export function luckyCoinIcon(): Pix {
  const p = coinIcon();
  // 四叶草
  for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) p.ellipse(16 + dx, 16 + dy, 1.8, 1.8, '#3fbf5a');
  p.set(16, 16, '#8ff0a2');
  for (const [x, y] of [[27, 4], [4, 26], [28, 24]]) p.set(x, y, '#fff3b0');
  return p;
}

export function snowIcon(): Pix {
  const p = new Pix();
  const C = '#9ff0ff';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x1 = 16 + Math.cos(a) * 12;
    const y1 = 16 + Math.sin(a) * 12;
    p.line(16, 16, x1, y1, C, 2);
    const mx = 16 + Math.cos(a) * 7;
    const my = 16 + Math.sin(a) * 7;
    p.line(mx, my, mx + Math.cos(a + 0.9) * 4, my + Math.sin(a + 0.9) * 4, C, 1);
    p.line(mx, my, mx + Math.cos(a - 0.9) * 4, my + Math.sin(a - 0.9) * 4, C, 1);
  }
  p.ellipse(16, 16, 3, 3, WHITE);
  return p.outline(OUT);
}

export function earthquakeIcon(): Pix {
  const p = new Pix();
  const PA = '#f2dcae';
  p.rect(6, 7, 20, 18, PA);
  p.autoShade([PA], '#fff4d8', '#c8a870');
  p.ellipse(6, 16, 3, 9.5, '#d8b880');
  p.ellipse(26, 16, 3, 9.5, '#d8b880');
  // 裂纹
  p.line(10, 10, 14, 15, '#8a4a2a', 1);
  p.line(14, 15, 12, 19, '#8a4a2a', 1);
  p.line(14, 15, 19, 17, '#8a4a2a', 1);
  p.line(19, 17, 22, 13, '#8a4a2a', 1);
  p.line(19, 17, 21, 22, '#8a4a2a', 1);
  return p.outline(OUT);
}

export function bigKeyIcon(): Pix {
  const p = keyIcon({ main: '#ffd23f', light: '#fff1a6', dark: '#c8861a', pale: WHITE });
  p.ellipse(11, 11, 2.2, 2.2, '#b04aff');
  p.set(10, 10, '#e0a0ff');
  for (const [x, y] of [[26, 4], [4, 24], [29, 14]]) p.set(x, y, '#fff3b0');
  return p;
}

export function knifeIcon(): Pix {
  const p = new Pix();
  p.poly([[12, 20], [25, 5], [27, 7], [14, 22]], SILVER);
  p.line(13, 20, 25, 6, SILVER_L, 1);
  p.line(9, 17, 16, 24, GOLD, 2);
  p.line(11, 22, 6, 27, '#8a3a2a', 2);
  p.ellipse(5, 28, 2, 2, '#3fbf5a');
  return p.outline(OUT);
}

/** 星空（50F 四周）：深蓝底 + 闪烁星点 */
export function starTile(frame: number): Pix {
  const p = new Pix();
  p.rect(0, 0, 32, 32, '#140c30');
  const stars: Array<[number, number, number]> = [[4, 5, 0], [20, 3, 1], [27, 14, 2], [9, 18, 3], [17, 26, 0], [29, 28, 1], [13, 10, 2], [24, 21, 3]];
  for (const [x, y, ph] of stars) {
    const on = (frame + ph) % 4;
    p.set(x, y, on === 0 ? WHITE : on === 2 ? '#7ee0ff' : '#5a5a9a');
    if (on === 0) {
      p.set(x - 1, y, '#7ee0ff');
      p.set(x + 1, y, '#7ee0ff');
      p.set(x, y - 1, '#7ee0ff');
      p.set(x, y + 1, '#7ee0ff');
    }
  }
  return p;
}
