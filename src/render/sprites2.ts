/**
 * 第一区新增的程序化像素美术：卫兵、骷髅队长、NPC、祭坛、下楼楼梯、机关门 / 铁门、牢墙、魔杖、备忘录、怪物手册等。
 * 与 sprites.ts 保持同一套 32×32 网格、调色与描边规范。
 */
import { mulberry32, Pix } from './pixel';

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

interface Pal {
  main: string;
  light: string;
  dark: string;
}

function eyes(p: Pix, x1: number, x2: number, y: number, blink: boolean, color = OUT): void {
  if (blink) {
    p.rect(x1, y + 1, 2, 1, color);
    p.rect(x2, y + 1, 2, 1, color);
  } else {
    p.rect(x1, y, 1, 2, color);
    p.rect(x2 + 1, y, 1, 2, color);
    p.set(x1 + 1, y, WHITE);
    p.set(x2, y, WHITE);
  }
}

/* ------------------------------------------------------------------ 卫兵 */

/** 初级卫兵（金甲长枪）/ 中级卫兵（蓝甲大剑） */
export function guardSprite(frame: number, blink: boolean, elite: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const A: Pal = elite ? { main: '#4f7cf0', light: '#9cc0ff', dark: '#2c48b0' } : { main: '#f2b632', light: '#ffe58a', dark: '#b8741a' };
  const CLOTH = elite ? '#e8455c' : '#3d9a5a';
  // 腿
  p.rect(12, 23, 3, 5, '#5a4a7a');
  p.rect(17, 23, 3, 5, '#5a4a7a');
  p.rect(11, 27, 4, 3, A.dark);
  p.rect(17, 27, 4, 3, A.dark);
  // 裙甲与躯干
  p.poly([[10, 20 + b], [22, 20 + b], [23, 25], [9, 25]], CLOTH);
  p.rect(10, 13 + b, 12, 8, A.main);
  p.autoShade([A.main], A.light, A.dark);
  p.rect(15, 14 + b, 2, 6, A.light);
  p.rect(10, 20 + b, 12, 1, A.dark);
  // 肩甲
  p.ellipse(9.5, 14 + b, 3.2, 2.6, A.main);
  p.ellipse(22.5, 14 + b, 3.2, 2.6, A.main);
  p.set(8, 13 + b, A.light);
  p.set(21, 13 + b, A.light);
  if (elite) {
    // 大剑
    p.rect(25, 1 + b, 3, 18, SILVER);
    p.rect(27, 2 + b, 1, 17, SILVER_D);
    p.set(25, 0 + b, SILVER_L);
    p.rect(22, 18 + b, 9, 2, GOLD);
    p.rect(25, 20 + b, 3, 4, '#7a4a2a');
    // 盾
    p.poly([[3, 14 + b], [11, 14 + b], [11, 21 + b], [7, 26 + b], [3, 21 + b]], SILVER);
    p.autoShade([SILVER], SILVER_L, SILVER_D);
    p.rect(6, 16 + b, 2, 7, '#e8455c');
    p.rect(4, 18 + b, 6, 2, '#e8455c');
  } else {
    // 长枪
    p.rect(25, 3 + b, 2, 26, '#a5683a');
    p.rect(26, 3 + b, 1, 26, '#7a4824');
    p.poly([[25.9, -1 + b], [29, 4 + b], [25.9, 7 + b], [23, 4 + b]], SILVER);
    p.set(25, 2 + b, SILVER_L);
    p.rect(23, 8 + b, 6, 1, '#e8455c');
    p.ellipse(24.5, 18 + b, 1.8, 1.8, SKIN);
  }
  // 头盔
  p.ellipse(16, 8 + b, 6.2, 6, A.main);
  p.autoShade([A.main], A.light, A.dark);
  p.rect(12, 8 + b, 9, 4, SKIN);
  p.rect(12, 11 + b, 9, 1, SKIN_D);
  p.rect(11, 7 + b, 11, 1, A.dark);
  p.rect(16, 1 + b, 1, 7, A.light);
  eyes(p, 13, 18, 9 + b, blink);
  // 头盔羽饰
  const plume = elite ? '#ff5470' : '#ff8a3d';
  p.poly([[15, 2 + b], [18, 0 + b], [22, 1 + b - (frame % 2)], [18, 3 + b]], plume);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 骷髅队长 */

export function captainSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const sway = [0, 1, 2, 1][frame];
  const glow = ['#ffcf4a', '#fff1a6', '#ffcf4a', '#ff9a3d'][frame];
  const BONE = '#f6f1e2';
  const BONE_L = '#ffffff';
  const BONE_D = '#cbc2a8';
  const CAPE = '#8a3ff0';
  // 披风
  p.poly([[8, 12 + b], [24, 12 + b], [27 + sway * 0.5, 29], [5 - sway * 0.5, 29]], CAPE);
  p.autoShade([CAPE], '#c08aff', '#5a22b0');
  // 腿
  p.rect(12, 22, 3, 6, BONE);
  p.rect(18, 22, 3, 6, BONE);
  p.rect(11, 27, 4, 2, '#5c4a86');
  p.rect(18, 27, 4, 2, '#5c4a86');
  // 黑甲躯干
  p.rect(10, 13 + b, 13, 10, '#4b4f7a');
  p.autoShade(['#4b4f7a'], '#7c82b8', '#2f3258');
  for (let r = 0; r < 3; r++) p.rect(12, 15 + b + r * 2, 9, 1, BONE);
  p.rect(16, 14 + b, 1, 8, BONE_D);
  p.rect(10, 22 + b, 13, 1, GOLD);
  // 肩甲（尖刺）
  p.poly([[5, 15 + b], [11, 12 + b], [12, 16 + b], [7, 17 + b]], GOLD);
  p.poly([[28, 15 + b], [22, 12 + b], [21, 16 + b], [26, 17 + b]], GOLD);
  p.set(6, 15 + b, GOLD_L);
  p.set(27, 15 + b, GOLD_L);
  // 双刃巨斧
  p.rect(26, 4 + b, 2, 23, '#7a4824');
  p.poly([[27, 3 + b], [31, 6 + b], [31, 12 + b], [27, 10 + b]], SILVER);
  p.poly([[27, 3 + b], [23, 6 + b], [23, 12 + b], [27, 10 + b]], SILVER_D);
  p.set(30, 6 + b, SILVER_L);
  p.ellipse(24.5, 18 + b, 1.8, 1.8, BONE);
  // 头骨
  p.ellipse(16.5, 8.5 + b, 6.6, 6, BONE);
  p.autoShade([BONE], BONE_L, BONE_D);
  p.rect(13, 13 + b + (frame === 2 ? 1 : 0), 8, 2, BONE);
  for (const x of [14, 16, 18]) p.set(x, 13 + b + (frame === 2 ? 1 : 0), BONE_D);
  p.rect(12, 8 + b, 3, 3, OUT);
  p.rect(18, 8 + b, 3, 3, OUT);
  if (!blink) {
    p.set(13, 9 + b, glow);
    p.set(19, 9 + b, glow);
    p.set(14, 9 + b, glow);
    p.set(20, 9 + b, glow);
  }
  p.set(16, 11 + b, OUT);
  // 王冠
  p.stamp(10, 0 + b, ['G..G..G..G..G', 'GGGGGGGGGGGGG', 'GrGGGbGGGrGGG'], { G: GOLD, r: '#ff4d63', b: '#4fd0ff' });
  p.rect(10, 1 + b, 13, 1, GOLD_L);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ NPC */

interface RobeOpts {
  robe: Pal;
  trim: string;
  bob: number;
}

function robeBody(p: Pix, o: RobeOpts): void {
  const b = o.bob;
  p.poly([[11, 13 + b], [21, 13 + b], [25, 29], [7, 29]], o.robe.main);
  p.autoShade([o.robe.main], o.robe.light, o.robe.dark);
  p.rect(7, 28, 18, 1, o.trim);
  p.rect(15, 14 + b, 2, 14, o.trim);
}

/** 老人：白胡子、棕袍、拄拐 */
export function oldmanSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  p.rect(24, 9 + b, 2, 20, '#a5683a');
  p.rect(25, 9 + b, 1, 20, '#7a4824');
  p.ellipse(25, 8 + b, 2.4, 2, '#c98a4b');
  robeBody(p, { robe: { main: '#c9875a', light: '#f0b98a', dark: '#93583a' }, trim: '#fff1c8', bob: b });
  p.ellipse(23, 18 + b, 2.6, 2.2, '#c9875a');
  p.ellipse(24.3, 17 + b, 1.6, 1.6, SKIN);
  p.ellipse(16, 10 + b, 5, 4.8, SKIN);
  p.autoShade([SKIN], '#ffe6cc', SKIN_D);
  // 秃顶白发
  p.rect(10, 8 + b, 2, 5, '#f4f4f8');
  p.rect(20, 8 + b, 2, 5, '#f4f4f8');
  p.set(16, 5 + b, '#ffe6cc');
  // 长白胡子
  p.poly([[11, 12 + b], [21, 12 + b], [18, 22 + b], [16, 24 + b], [14, 22 + b]], '#f8f8ff');
  p.set(15, 19 + b, '#d6dcef');
  p.set(17, 16 + b, '#d6dcef');
  // 白眉毛
  p.rect(12, 8 + b, 3, 1, WHITE);
  p.rect(17, 8 + b, 3, 1, WHITE);
  eyes(p, 13, 17, 9 + b, blink);
  p.rect(15, 11 + b, 2, 1, SKIN_D);
  return p.outline(OUT);
}

/** 商人：绿色兜帽、钱袋；blessed = 祝福商人（紫金长袍） */
export function traderSprite(frame: number, blink: boolean, blessed: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const robe: Pal = blessed ? { main: '#9a6bff', light: '#c9adff', dark: '#6a3fd0' } : { main: '#3fbf7a', light: '#8ff0b2', dark: '#258a55' };
  robeBody(p, { robe, trim: GOLD, bob: b });
  // 钱袋（随动画晃动）
  const sx = [0, 1, 0, -1][frame];
  p.ellipse(8 + sx, 21 + b, 3.4, 3.6, '#e0a54a');
  p.autoShade(['#e0a54a'], '#ffd58a', '#a8701e');
  p.rect(7 + sx, 17 + b, 3, 1, '#a8701e');
  p.stamp(7 + sx, 20 + b, ['.G.', 'GLG', '.G.'], { G: GOLD_D, L: GOLD_L });
  p.ellipse(10.5, 18 + b, 1.6, 1.6, SKIN);
  p.ellipse(22, 18 + b, 3, 2.4, robe.main);
  p.ellipse(23.5, 18.5 + b, 1.6, 1.6, SKIN);
  // 脸
  p.ellipse(16, 10 + b, 4.8, 4.4, SKIN);
  p.autoShade([SKIN], '#ffe6cc', SKIN_D);
  eyes(p, 13, 17, 9 + b, blink);
  // 八字胡
  p.rect(13, 12 + b, 6, 1, '#8a5530');
  p.set(12, 13 + b, '#8a5530');
  p.set(19, 13 + b, '#8a5530');
  // 兜帽 / 头巾
  p.poly([[9, 11 + b], [11, 4 + b], [16, 2 + b], [21, 4 + b], [23, 11 + b], [20, 7 + b], [12, 7 + b]], robe.dark);
  p.autoShade([robe.dark], robe.light, robe.dark);
  if (blessed) {
    p.stamp(14, 2 + b, ['.G.', 'GWG', '.G.'], { G: GOLD, W: WHITE });
    const tw = ['#fff27a', WHITE, '#ffd6ff', WHITE][frame];
    p.set([4, 27, 6, 26][frame], [6, 10, 3, 4][frame] + b, tw);
  } else {
    p.rect(12, 6 + b, 8, 1, GOLD);
  }
  return p.outline(OUT);
}

/** 小偷：青色头巾、红围巾、短刀 */
export function thiefSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, 0, 0][frame];
  const T = '#2fb8c8';
  // 腿
  p.rect(12, 23, 3, 5, '#4a4f86');
  p.rect(17, 23, 3, 5, '#4a4f86');
  p.rect(11, 27, 4, 2, '#7a4a2a');
  p.rect(17, 27, 4, 2, '#7a4a2a');
  // 上衣
  p.rect(10, 14 + b, 12, 10, T);
  p.autoShade([T], '#8af0f5', '#1a7f94');
  p.rect(10, 20 + b, 12, 1, '#7a4a2a');
  p.set(16, 20 + b, GOLD);
  // 红围巾
  p.rect(11, 13 + b, 10, 2, '#ff5470');
  p.poly([[19, 14 + b], [22, 14 + b], [24 + (frame % 2), 19 + b], [21, 18 + b]], '#ff5470');
  // 手与短刀
  p.ellipse(9, 19 + b, 1.6, 1.6, SKIN);
  p.ellipse(23, 19 + b, 1.6, 1.6, SKIN);
  p.line(23, 18 + b, 27, 14 + b, SILVER, 1);
  p.set(27, 13 + b, SILVER_L);
  // 脸
  p.ellipse(16, 9 + b, 5, 4.8, SKIN);
  p.autoShade([SKIN], '#ffe6cc', SKIN_D);
  eyes(p, 13, 17, 8 + b, blink);
  // 坏笑
  p.rect(14, 11 + b, 4, 1, '#8a3a3a');
  p.set(18, 10 + b, '#8a3a3a');
  // 头巾
  p.poly([[10, 8 + b], [12, 3 + b], [20, 3 + b], [22, 8 + b], [20, 6 + b], [12, 6 + b]], '#3a3f78');
  p.rect(10, 6 + b, 12, 1, '#5a62b0');
  p.poly([[21, 5 + b], [26, 4 + b - (frame % 2)], [25, 8 + b], [22, 7 + b]], '#3a3f78');
  return p.outline(OUT);
}

/** 魔王（红衣魔王，第 3 层剧情） */
export function demonKingSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const sway = [0, 1, 2, 1][frame];
  const R = '#e8344e';
  p.poly([[7, 12 + b], [25, 12 + b], [29 + sway * 0.5, 30], [3 - sway * 0.5, 30]], '#3a1f5e');
  p.autoShade(['#3a1f5e'], '#6a3f9e', '#22103e');
  p.poly([[10, 13 + b], [22, 13 + b], [24, 29], [8, 29]], R);
  p.autoShade([R], '#ff8a9a', '#a81838');
  p.rect(15, 14 + b, 2, 15, GOLD);
  p.rect(8, 28, 16, 1, GOLD);
  p.ellipse(16, 9 + b, 5.6, 5.2, '#a8c4ff');
  p.autoShade(['#a8c4ff'], '#e0ebff', '#6f8fd8');
  // 尖角
  p.poly([[10, 6 + b], [6, 0 + b], [12, 4 + b]], GOLD_L);
  p.poly([[22, 6 + b], [26, 0 + b], [20, 4 + b]], GOLD_L);
  // 红眼
  if (blink) {
    p.rect(12, 9 + b, 3, 1, OUT);
    p.rect(18, 9 + b, 3, 1, OUT);
  } else {
    p.rect(12, 8 + b, 3, 2, '#ff2a4a');
    p.rect(18, 8 + b, 3, 2, '#ff2a4a');
    p.set(12, 8 + b, '#ffd0d8');
    p.set(18, 8 + b, '#ffd0d8');
  }
  p.rect(14, 12 + b, 5, 1, OUT);
  p.set(14, 13 + b, WHITE);
  p.set(18, 13 + b, WHITE);
  // 魔焰
  const fl = ['#ff7ae0', '#ffb0f0', '#ffffff', '#ffb0f0'][frame];
  p.ellipse(4, 18 + b, 2.6, 3 + (frame % 2), fl);
  p.ellipse(28, 18 + b, 2.6, 3 + ((frame + 1) % 2), fl);
  return p.outline(OUT);
}

/** 魔法警卫（第 3 层剧情：将勇士击晕的白袍卫兵） */
export function magicGuardSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, -2, -1][frame];
  robeBody(p, { robe: { main: '#eef0ff', light: WHITE, dark: '#a9b0e0' }, trim: '#7a5cff', bob: b });
  p.ellipse(16, 10 + b, 5.6, 5.2, '#eef0ff');
  p.autoShade(['#eef0ff'], WHITE, '#a9b0e0');
  p.rect(12, 9 + b, 8, 3, '#2a2a5a');
  if (!blink) {
    p.set(13, 10 + b, '#7af0ff');
    p.set(18, 10 + b, '#7af0ff');
  }
  p.rect(11, 5 + b, 10, 1, '#7a5cff');
  const orb = ['#7af0ff', '#c6fbff', WHITE, '#c6fbff'][frame];
  p.ellipse(25, 16 + b, 3, 3, orb);
  p.ellipse(7, 16 + b, 3, 3, orb);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 祭坛 */

/** 祭坛（中间）：金色神像与供奉火焰 */
export function altarSprite(frame: number): Pix {
  const p = new Pix();
  // 底座
  p.rect(3, 22, 26, 8, '#b6a0f0');
  p.autoShade(['#b6a0f0'], '#e6dcff', '#7f68c8');
  p.rect(5, 19, 22, 3, '#d8cbff');
  p.rect(3, 26, 26, 1, GOLD);
  p.stamp(13, 23, ['..G..', '.GLG.', 'GLWLG', '.GLG.', '..G..'], { G: GOLD_D, L: GOLD, W: GOLD_L });
  // 神像
  p.ellipse(16, 8, 4.4, 4.2, GOLD);
  p.poly([[10, 19], [22, 19], [20, 12], [12, 12]], GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  p.poly([[11, 13], [5, 6 - (frame % 2)], [9, 14]], GOLD_L);
  p.poly([[21, 13], [27, 6 - (frame % 2)], [23, 14]], GOLD_L);
  p.rect(14, 8, 1, 1, GOLD_D);
  p.rect(17, 8, 1, 1, GOLD_D);
  // 光环
  const halo = ['#fff6c0', '#ffffff', '#fff6c0', '#ffe68a'][frame];
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2;
    p.set(16 + Math.cos(t) * 7, 7 + Math.sin(t) * 3.2 - 3, halo);
  }
  return p.outline(OUT);
}

/** 祭坛两侧：带火盆的石柱 */
export function altarSideSprite(frame: number, flip: boolean): Pix {
  const p = new Pix();
  p.rect(9, 12, 14, 18, '#c8baf5');
  p.autoShade(['#c8baf5'], '#efe9ff', '#8f7ad0');
  for (const x of [12, 16, 20]) p.rect(x, 14, 1, 14, '#a693e0');
  p.rect(7, 28, 18, 3, '#9f8ae0');
  p.rect(7, 9, 18, 3, GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  // 火焰
  const h = [0, 1, 2, 1][frame];
  const fl: Array<[number, number]> = [[9, 9], [12, 3 - h], [15, 6], [17, 0 - h], [20, 5], [23, 9]];
  p.poly(fl, '#ff8a3d');
  p.poly([[11, 9], [14, 5 - h], [16, 7], [18, 3 - h], [21, 9]], '#ffd23f');
  p.poly([[13, 9], [16, 6 - h], [19, 9]], '#fff6c0');
  return (flip ? p.flipX() : p).outline(OUT);
}

/* ------------------------------------------------------------------ 地形 */

export function stairsDownTile(floor: Pix): Pix {
  const p = floor.clone();
  const BODY = ['#8f84c8', '#a49ad6', '#b8b0e2', '#cbc5ec', '#dcd8f4'];
  // 向下延伸的台阶（越往里越暗）
  p.rect(3, 3, 26, 26, '#5b4f9a');
  for (let k = 0; k < 5; k++) {
    const y = 4 + k * 5;
    const x0 = 13 - k * 2;
    const w = 6 + k * 4;
    p.rect(x0, y, w, 5, BODY[k]);
    p.rect(x0, y, w, 1, '#ece8ff');
    p.rect(x0, y + 4, w, 1, '#6f63b0');
  }
  p.rect(3, 3, 26, 1, '#3f3478');
  p.rect(3, 3, 1, 26, '#3f3478');
  p.rect(28, 3, 1, 26, '#3f3478');
  p.stamp(13, 24, ['.oGo.', '.oGo.', 'oGGGo', '.oGo.', '..o..'], { o: '#2a6fc8', G: '#9fe0ff' });
  return p;
}

/** 牢墙：裂纹砖墙（剧情中会被打开） */
export function sealedWallTile(wall: Pix): Pix {
  const p = wall.clone();
  const rnd = mulberry32(77);
  let x = 9;
  for (let y = 2; y < 30; y++) {
    x += Math.round((rnd() - 0.5) * 2);
    p.set(x, y, '#3b3f86');
    if (y % 7 === 3) p.line(x, y, x + 5, y + 3, '#3b3f86');
  }
  return p;
}

/** 机关门：紫色金属闸门 + 齿轮 */
export function specialDoorTile(): Pix {
  const p = new Pix();
  const F = '#4a3f86';
  p.rect(1, 1, 30, 31, F);
  p.autoShade([F], '#7a6ec0', '#2c2458');
  const M = '#b26bff';
  p.rect(4, 4, 24, 27, M);
  p.autoShade([M], '#dcb4ff', '#7a3fd0');
  for (const x of [8, 13, 18, 23]) p.rect(x, 4, 2, 27, '#8a4fe0');
  for (const x of [8, 13, 18, 23]) p.rect(x, 4, 1, 27, '#e2c8ff');
  p.ellipse(16, 16, 6, 6, GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    p.rect(16 + Math.cos(t) * 6.5 - 1, 16 + Math.sin(t) * 6.5 - 1, 2, 2, GOLD_D);
  }
  p.ellipse(16, 16, 2.2, 2.2, '#4a3f86');
  return p.outline(OUT);
}

/** 铁门：钢铁栅栏 */
export function ironDoorTile(): Pix {
  const p = new Pix();
  p.rect(1, 1, 30, 31, '#5a6688');
  p.autoShade(['#5a6688'], '#8f9cc0', '#3a4460');
  p.rect(4, 4, 24, 27, '#2f3550');
  for (const x of [6, 11, 16, 21, 26]) {
    p.rect(x - 1, 3, 3, 28, SILVER);
    p.rect(x - 1, 3, 1, 28, SILVER_L);
    p.rect(x + 1, 3, 1, 28, SILVER_D);
    p.rect(x - 1, 2, 3, 1, '#c8d2ec');
  }
  for (const y of [9, 22]) {
    p.rect(3, y, 26, 3, '#8f9cc0');
    p.rect(3, y, 26, 1, '#d6deef');
    p.rect(3, y + 2, 26, 1, '#5a6688');
    for (const x of [6, 11, 16, 21, 26]) p.set(x, y + 1, '#3a4460');
  }
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 道具 */

/** 魔杖（楼层传送） */
export function flyWandIcon(): Pix {
  const p = new Pix();
  p.line(7, 27, 20, 12, '#a5683a', 2);
  p.line(8, 27, 21, 13, '#7a4824', 1);
  p.line(6, 26, 9, 23, GOLD, 2);
  p.ellipse(23, 9, 6, 6, '#c79bff');
  p.autoShade(['#c79bff'], '#ecdcff', '#8a5ae0');
  p.ellipse(22, 8, 2.5, 2.5, '#f6eeff');
  p.set(21, 6, WHITE);
  for (const [x, y] of [[29, 3], [15, 4], [28, 15]]) {
    p.set(x, y, '#fff27a');
    p.set(x - 1, y, '#fff6c0');
    p.set(x + 1, y, '#fff6c0');
    p.set(x, y - 1, '#fff6c0');
    p.set(x, y + 1, '#fff6c0');
  }
  return p.outline(OUT);
}

/** 备忘录（卷轴笔记） */
export function notebookIcon(): Pix {
  const p = new Pix();
  const PAPER = '#fff3cf';
  p.rect(7, 6, 18, 21, PAPER);
  p.autoShade([PAPER], WHITE, '#e6cf96');
  p.ellipse(7, 6, 3, 2.6, '#e6b86a');
  p.ellipse(25, 27, 3, 2.6, '#e6b86a');
  p.rect(5, 5, 20, 2, '#c98a4b');
  p.rect(7, 26, 20, 2, '#c98a4b');
  for (const y of [10, 14, 18, 22]) p.rect(10, y, 12 - (y % 8), 1, '#9a8ad0');
  p.line(22, 22, 28, 10, '#ff5470', 2);
  p.set(28, 9, GOLD_L);
  return p.outline(OUT);
}

/** 怪物手册 */
export function bookIcon(): Pix {
  const p = new Pix();
  p.rect(6, 5, 20, 23, '#e8455c');
  p.autoShade(['#e8455c'], '#ff8a9a', '#a81838');
  p.rect(8, 7, 16, 19, '#ff6b7f');
  p.rect(6, 25, 20, 3, '#fff3cf');
  p.rect(6, 27, 20, 1, '#e6cf96');
  p.rect(6, 5, 2, 23, '#a81838');
  // 史莱姆徽记
  p.ellipse(16, 16, 5, 4, '#5fd65a');
  p.autoShade(['#5fd65a'], '#aef58c', '#2f9a4a');
  p.rect(14, 15, 1, 2, OUT);
  p.rect(18, 15, 1, 2, OUT);
  p.rect(10, 9, 12, 1, GOLD);
  return p.outline(OUT);
}

/** 神圣剑 / 神圣盾（序章装备，界面图标） */
export function holySwordIcon(): Pix {
  const p = new Pix();
  p.line(10, 21, 26, 5, '#fff6c0', 3);
  p.line(11, 20, 26, 5, WHITE, 1);
  p.line(12, 22, 27, 7, GOLD, 1);
  p.line(6, 18, 13, 25, GOLD, 2);
  p.line(8, 23, 5, 26, '#7a5cff', 2);
  p.ellipse(4, 27.5, 2.2, 2.2, '#4fd0ff');
  return p.outline(OUT);
}
