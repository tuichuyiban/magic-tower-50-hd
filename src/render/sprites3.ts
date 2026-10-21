/**
 * 第二区（11F–20F）新增的程序化像素美术：兽人 / 兽人武士、石头人、幽灵、吸血鬼、大乌贼（96×96）、
 * 岩浆、镐、十字架、圣水、银剑、银盾。与 sprites.ts / sprites2.ts 使用同一套 32×32 网格、调色与描边规范，
 * 每个角色 4 帧待机动画 + 眨眼帧。
 */
import { mulberry32, Pix } from './pixel';

const OUT = '#2a1b3d';
const GOLD = '#ffcf4a';
const GOLD_L = '#fff1a6';
const GOLD_D = '#d08a1c';
const SILVER = '#e2e9f6';
const SILVER_L = '#ffffff';
const SILVER_D = '#98a6c6';
const WHITE = '#ffffff';

/** 按颜色表整体换色（用于派生配色变体） */
export function swap(p: Pix, map: Record<string, string>): Pix {
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y);
      if (c && map[c]) p.set(x, y, map[c]);
    }
  return p;
}

function eyes2(p: Pix, x1: number, x2: number, y: number, blink: boolean, color: string, glint = WHITE): void {
  if (blink) {
    p.rect(x1, y + 1, 2, 1, OUT);
    p.rect(x2, y + 1, 2, 1, OUT);
  } else {
    p.rect(x1, y, 2, 2, color);
    p.rect(x2, y, 2, 2, color);
    p.set(x1, y, glint);
    p.set(x2, y, glint);
  }
}

/* ------------------------------------------------------------------ 兽人 / 兽人武士 */

export function orcSprite(frame: number, blink: boolean, knight: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const swing = [0, 1, 2, 1][frame];
  const SK = knight ? '#6fae4a' : '#8cc95a';
  const SK_L = knight ? '#a6dc78' : '#c2ee8e';
  const SK_D = knight ? '#477a2c' : '#5c9a3a';
  // 腿
  p.rect(11, 23, 4, 5, knight ? '#5a5f7a' : '#7a5232');
  p.rect(17, 23, 4, 5, knight ? '#5a5f7a' : '#7a5232');
  p.rect(10, 27, 5, 3, '#4a3424');
  p.rect(17, 27, 5, 3, '#4a3424');
  // 躯干（宽厚）
  p.ellipse(16, 18 + b, 8, 6.5, SK);
  p.autoShade([SK], SK_L, SK_D);
  if (knight) {
    // 胸甲与肩甲
    p.rect(10, 15 + b, 12, 8, '#8d97b8');
    p.autoShade(['#8d97b8'], '#c7d0ec', '#5c6588');
    p.rect(15, 15 + b, 2, 8, '#c7d0ec');
    p.ellipse(8.5, 14 + b, 3.6, 2.8, '#b3412f');
    p.ellipse(23.5, 14 + b, 3.6, 2.8, '#b3412f');
    p.autoShade(['#b3412f'], '#e8735e', '#7a2418');
    p.rect(10, 22 + b, 12, 2, '#5c6588');
  } else {
    // 皮背心与腰带
    p.poly([[10, 14 + b], [14, 14 + b], [13, 23 + b], [10, 23 + b]], '#9a6232');
    p.poly([[18, 14 + b], [22, 14 + b], [22, 23 + b], [19, 23 + b]], '#9a6232');
    p.rect(9, 21 + b, 14, 2, '#5a3a20');
    p.rect(15, 21 + b, 2, 2, GOLD);
  }
  // 手臂
  p.ellipse(7.5, 19 + b, 2.6, 4, SK);
  p.ellipse(24.5, 18 + b, 2.6, 3.6, SK);
  p.autoShade([SK], SK_L, SK_D);
  // 武器
  if (knight) {
    // 战斧
    p.rect(26, 4 + b - swing, 2, 22, '#7a4a2a');
    p.poly([[27, 4 + b - swing], [31, 2 + b - swing], [31, 11 + b - swing], [27, 9 + b - swing]], SILVER);
    p.poly([[27, 4 + b - swing], [23, 3 + b - swing], [23, 9 + b - swing], [27, 9 + b - swing]], SILVER_D);
    p.set(30, 3 + b - swing, SILVER_L);
  } else {
    // 狼牙棒
    p.line(25, 22 + b, 28, 8 + b - swing, '#8a5530', 2);
    p.ellipse(28.5, 6 + b - swing, 3, 3.6, '#a5683a');
    p.autoShade(['#a5683a'], '#d29a62', '#6e4220');
    for (const [sx, sy] of [[26, 4], [31, 5], [29, 2], [27, 9], [31, 8]]) p.set(sx, sy + b - swing, SILVER);
  }
  // 头：大下巴 + 獠牙
  p.ellipse(16, 9 + b, 6.4, 5.6, SK);
  p.autoShade([SK], SK_L, SK_D);
  p.rect(11, 11 + b, 10, 3, SK_D);
  p.rect(12, 11 + b, 8, 2, SK);
  p.set(12, 10 + b, WHITE);
  p.set(12, 9 + b, WHITE);
  p.set(19, 10 + b, WHITE);
  p.set(19, 9 + b, WHITE);
  // 尖耳朵
  p.poly([[9, 7 + b], [5, 4 + b], [10, 9 + b]], SK);
  p.poly([[23, 7 + b], [27, 4 + b], [22, 9 + b]], SK);
  p.rect(11, 6 + b, 4, 1, OUT);
  p.rect(17, 6 + b, 4, 1, OUT);
  eyes2(p, 12, 18, 7 + b, blink, '#ff3b3b', '#ffd36b');
  if (knight) {
    // 角盔
    p.poly([[9, 6 + b], [10, 2 + b], [16, 0 + b], [22, 2 + b], [23, 6 + b]], '#8d97b8');
    p.autoShade(['#8d97b8'], '#c7d0ec', '#5c6588');
    p.rect(9, 5 + b, 15, 1, '#5c6588');
    p.poly([[10, 3 + b], [6, -1 + b], [8, 4 + b]], '#f1e6c8');
    p.poly([[22, 3 + b], [26, -1 + b], [24, 4 + b]], '#f1e6c8');
  } else {
    p.poly([[12, 4 + b], [16, 2 + b], [20, 4 + b], [16, 5 + b]], '#3a2a1a');
  }
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 石头人 */

export function rockSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 0][frame];
  const glow = ['#ff9a3d', '#ffc46b', '#ff9a3d', '#ff7a2a'][frame];
  const ST = '#9aa0b4';
  const ST_L = '#cdd2e2';
  const ST_D = '#636a84';
  // 脚
  p.ellipse(11, 27.5, 4, 2.6, ST_D);
  p.ellipse(21, 27.5, 4, 2.6, ST_D);
  // 身体：巨大的岩块
  p.poly([[6, 14 + b], [10, 8 + b], [22, 7 + b], [27, 13 + b], [26, 25], [6, 25]], ST);
  p.autoShade([ST], ST_L, ST_D);
  // 头（嵌在身体里的小岩块）
  p.poly([[11, 9 + b], [13, 3 + b], [20, 3 + b], [22, 9 + b]], ST);
  p.autoShade([ST], ST_L, ST_D);
  // 手臂
  p.ellipse(4.5, 19 + b, 3, 4.5, ST);
  p.ellipse(28, 19 + b, 3, 4.5, ST);
  p.autoShade([ST], ST_L, ST_D);
  // 裂纹与苔藓
  p.line(9, 15 + b, 13, 19 + b, ST_D);
  p.line(13, 19 + b, 12, 23, ST_D);
  p.line(21, 12 + b, 24, 17 + b, ST_D);
  p.line(18, 20, 22, 23, ST_D);
  p.rect(7, 13 + b, 3, 1, '#7fbf6a');
  p.rect(20, 7 + b, 3, 1, '#7fbf6a');
  p.set(21, 6 + b, '#7fbf6a');
  // 发光的眼睛与胸口符文
  if (blink) {
    p.rect(13, 7 + b, 2, 1, OUT);
    p.rect(18, 7 + b, 2, 1, OUT);
  } else {
    p.rect(13, 6 + b, 2, 2, glow);
    p.rect(18, 6 + b, 2, 2, glow);
    p.set(13, 6 + b, '#fff2c8');
    p.set(18, 6 + b, '#fff2c8');
  }
  p.stamp(14, 14 + b, ['.G.', 'GGG', '.G.', '.G.'], { G: glow });
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 幽灵（slimeMan） */

export function ghostSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, -2, -1][frame];
  const G = '#b9a8ff';
  const G_L = '#e6dcff';
  const G_D = '#7d68d8';
  // 头与身体（下摆呈波浪）
  p.ellipse(16, 12 + b, 8.5, 8.5, G);
  p.rect(7.5, 12 + b, 17, 10, G);
  const wave = frame % 2;
  for (let i = 0; i < 4; i++) {
    const x0 = 8 + i * 4;
    p.poly([[x0, 21 + b], [x0 + 4, 21 + b], [x0 + 2, 26 + b + ((i + wave) % 2) * 2]], G);
  }
  // 两只"手"
  p.ellipse(6, 17 + b + (frame === 1 ? -1 : 0), 2.6, 2, G);
  p.ellipse(26, 17 + b + (frame === 3 ? -1 : 0), 2.6, 2, G);
  p.autoShade([G], G_L, G_D);
  // 半透明感：身体内部的亮斑
  p.ellipse(12, 8 + b, 2.4, 1.6, G_L);
  p.set(11, 7 + b, WHITE);
  // 眼睛与嘴
  if (blink) {
    p.rect(11, 12 + b, 3, 1, OUT);
    p.rect(18, 12 + b, 3, 1, OUT);
  } else {
    p.ellipse(12.5, 12 + b, 1.8, 2.4, OUT);
    p.ellipse(19.5, 12 + b, 1.8, 2.4, OUT);
    p.set(12, 11 + b, '#7fffe0');
    p.set(19, 11 + b, '#7fffe0');
  }
  p.ellipse(16, 17 + b, 2, 1.4 + (frame % 2) * 0.6, OUT);
  p.set(9, 15 + b, '#ff9ad5');
  p.set(23, 15 + b, '#ff9ad5');
  // 漂浮的磷火
  const wx = [3, 5, 28, 26][frame];
  const wy = [6, 3, 5, 8][frame];
  p.rect(wx, wy, 2, 2, '#7fffe0');
  p.set(wx, wy, WHITE);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 吸血鬼（第 20 层头目） */

export function vampireSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const flap = [0, 1, 2, 1][frame];
  const CAPE = '#2a2140';
  const CAPE_L = '#4a3d6e';
  const LINING = '#d42a4a';
  const SKIN = '#e9e2f2';
  const SKIN_D = '#b9aed2';
  // 披风（张开，内衬红色）
  p.poly([[16, 10 + b], [2 - flap, 29], [30 + flap, 29]], LINING);
  p.autoShade([LINING], '#ff6a7e', '#8e1430');
  p.poly([[16, 10 + b], [2 - flap, 29], [6, 29], [12, 16 + b]], CAPE);
  p.poly([[16, 10 + b], [30 + flap, 29], [26, 29], [20, 16 + b]], CAPE);
  // 礼服
  p.poly([[12, 14 + b], [20, 14 + b], [21, 28], [11, 28]], '#3a3150');
  p.autoShade(['#3a3150'], CAPE_L, '#1e1830');
  p.poly([[14, 14 + b], [18, 14 + b], [16, 21 + b]], WHITE);
  p.rect(15, 15 + b, 2, 2, LINING);
  p.set(16, 18 + b, GOLD);
  p.rect(11, 27, 4, 2, '#1e1830');
  p.rect(17, 27, 4, 2, '#1e1830');
  // 立领
  p.poly([[9, 13 + b], [11, 4 + b], [13, 12 + b]], LINING);
  p.poly([[23, 13 + b], [21, 4 + b], [19, 12 + b]], LINING);
  // 脸
  p.ellipse(16, 10 + b, 4.6, 4.8, SKIN);
  p.autoShade([SKIN], WHITE, SKIN_D);
  // 背头黑发 + 美人尖
  p.poly([[11, 9 + b], [12, 4 + b], [16, 3 + b], [20, 4 + b], [21, 9 + b], [18, 7 + b], [16, 9 + b], [14, 7 + b]], '#1a1426');
  p.set(13, 5 + b, '#4a3d6e');
  if (blink) {
    p.rect(13, 10 + b, 2, 1, OUT);
    p.rect(17, 10 + b, 2, 1, OUT);
  } else {
    p.rect(13, 9 + b, 2, 2, '#ff2244');
    p.rect(17, 9 + b, 2, 2, '#ff2244');
    p.set(13, 9 + b, '#ffd0d8');
    p.set(17, 9 + b, '#ffd0d8');
  }
  // 嘴与獠牙
  p.rect(14, 13 + b, 4, 1, '#8e1430');
  p.set(14, 14 + b, WHITE);
  p.set(17, 14 + b, WHITE);
  // 环绕的小蝙蝠剪影
  const bx = [4, 6, 25, 23][frame];
  const by = [5, 3, 4, 6][frame];
  p.stamp(bx, by, ['B.B', 'BBB'], { B: '#4a3d6e' });
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 大乌贼（3×3 大图） */

export function octopusSprite(frame: number, blink: boolean): Pix {
  const p = new Pix(96, 96);
  const M = '#e0457a';
  const M_L = '#ff8db0';
  const M_D = '#a3245a';
  const bob = [0, -1, -2, -1][frame];
  // 8 条触手：正弦摆动
  for (let i = 0; i < 8; i++) {
    const baseX = 18 + i * 8.5;
    const dir = i < 4 ? -1 : 1;
    let px = baseX;
    let py = 56 + bob;
    for (let s = 0; s < 22; s++) {
      const t = s / 22;
      const wob = Math.sin(t * 5 + frame * 1.57 + i) * 3.2;
      const nx = baseX + dir * t * (6 + (i % 4) * 4) + wob;
      const ny = 56 + bob + t * 36;
      const w = Math.max(1.4, 4.6 * (1 - t));
      p.ellipse(nx, ny, w, w, M);
      // 吸盘
      if (s % 4 === 2 && t < 0.85) p.set(Math.round(nx - dir), Math.round(ny), '#ffd0de');
      px = nx;
      py = ny;
    }
    p.set(Math.round(px), Math.round(py), M_D);
  }
  // 头（大圆顶）
  p.ellipse(48, 34 + bob, 30, 27, M);
  p.rect(22, 44 + bob, 52, 14, M);
  p.autoShade([M], M_L, M_D);
  // 斑点
  const rnd = mulberry32(51);
  for (let i = 0; i < 14; i++) {
    const sx = 26 + rnd() * 44;
    const sy = 14 + rnd() * 26 + bob;
    p.ellipse(sx, sy, 1.6 + rnd() * 1.6, 1.4 + rnd(), M_D);
  }
  p.ellipse(36, 18 + bob, 7, 4, M_L);
  p.ellipse(33, 16 + bob, 2.6, 1.6, '#ffe6ef');
  // 大眼睛
  for (const ex of [36, 60]) {
    p.ellipse(ex, 42 + bob, 8, 8.5, '#fff6e0');
    if (blink) {
      p.rect(ex - 8, 42 + bob, 17, 2, OUT);
      p.ellipse(ex, 40 + bob, 8, 5, M_D);
    } else {
      const look = [0, 1, 0, -1][frame];
      p.ellipse(ex + look, 43 + bob, 4.2, 5.4, '#2a1b3d');
      p.rect(ex - 5 + look, 42 + bob, 2, 2, '#ffcf4a');
      p.ellipse(ex - 2 + look, 40 + bob, 1.6, 1.6, WHITE);
    }
    // 愤怒的眉
    p.line(ex - 9, 31 + bob, ex + 6, 34 + bob + (ex > 48 ? -3 : 0), OUT, 2);
  }
  // 嘴
  p.ellipse(48, 55 + bob, 6, 3 + (frame % 2), '#5a1030');
  p.set(45, 54 + bob, WHITE);
  p.set(51, 54 + bob, WHITE);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 地形：岩浆 */

export function lavaTile(frame: number): Pix {
  const p = new Pix();
  const rnd = mulberry32(13);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const v = Math.sin((x + frame * 2) * 0.45 + Math.sin(y * 0.35 + frame) * 1.6) + Math.cos((y - frame * 2) * 0.4 + x * 0.12);
      p.set(x, y, v > 1.1 ? '#ffd166' : v > 0.35 ? '#ff8a2a' : v > -0.6 ? '#e8452a' : '#a8222a');
    }
  // 气泡
  for (let i = 0; i < 5; i++) {
    const bx = Math.floor(rnd() * 28) + 2;
    const by = (Math.floor(rnd() * 32) - frame * 3 + 64) % 32;
    const r = (i + frame) % 3;
    if (r === 0) continue;
    p.ellipse(bx, by, r, r, '#ffe7a0');
    p.set(bx - 1, by - 1, WHITE);
  }
  // 边缘焦黑
  for (let i = 0; i < 32; i++) {
    if (rnd() < 0.5) p.set(i, 0, '#5a1420');
    if (rnd() < 0.5) p.set(0, i, '#5a1420');
  }
  return p;
}

/* ------------------------------------------------------------------ 道具图标 */

export function pickaxeIcon(): Pix {
  const p = new Pix();
  // 木柄
  p.line(8, 27, 22, 9, '#a5683a', 3);
  p.line(9, 27, 22, 10, '#7a4824', 1);
  p.set(8, 27, '#d29a62');
  // 镐头（弯月形）
  p.poly([[13, 6], [20, 4], [28, 8], [30, 14], [26, 10], [20, 8], [14, 9]], SILVER);
  p.poly([[13, 6], [9, 9], [5, 16], [8, 11], [13, 9]], SILVER);
  p.autoShade([SILVER], SILVER_L, SILVER_D);
  p.rect(19, 6, 4, 4, '#5c6588');
  p.set(20, 7, SILVER_L);
  p.set(29, 13, WHITE);
  p.set(6, 15, WHITE);
  return p.outline(OUT);
}

export function crossIcon(): Pix {
  const p = new Pix();
  p.rect(14, 3, 5, 26, GOLD);
  p.rect(7, 9, 19, 5, GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  p.rect(15, 4, 1, 24, GOLD_L);
  p.ellipse(16.5, 11.5, 2.4, 2.4, '#ff3b6b');
  p.set(16, 10, WHITE);
  p.set(8, 11, '#ff9ab0');
  p.set(24, 11, '#ff9ab0');
  p.set(16, 27, '#ff9ab0');
  return p.outline(OUT);
}

export function holyWaterIcon(): Pix {
  const p = new Pix();
  // 圆肚瓶
  p.ellipse(16, 20, 9, 8.5, '#bff4ff');
  p.rect(13, 7, 6, 7, '#bff4ff');
  p.autoShade(['#bff4ff'], WHITE, '#7fc8e8');
  // 液体
  p.ellipse(16, 22, 7.4, 6, '#3fd8ff');
  p.autoShade(['#3fd8ff'], '#a6f1ff', '#1a8fd0');
  p.rect(12, 5, 8, 3, GOLD);
  p.set(13, 5, GOLD_L);
  // 十字标记与高光
  p.rect(15, 18, 2, 7, WHITE);
  p.rect(13, 20, 6, 2, WHITE);
  p.set(10, 17, WHITE);
  p.set(11, 15, WHITE);
  p.set(26, 6, '#fff27a');
  p.set(5, 10, '#fff27a');
  return p.outline(OUT);
}

