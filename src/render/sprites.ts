/**
 * 程序化高清像素美术：所有图块与角色都在 32×32 像素网格上用代码绘制，
 * 渲染时以最近邻方式整数倍放大，保持锐利的像素边缘。
 */
import type { DoorColor, DoorKind, ItemId, MonsterId, NpcId } from '../game/types';
import {
  altarSideSprite,
  altarSprite,
  bookIcon,
  captainSprite,
  demonKingSprite,
  flyWandIcon,
  guardSprite,
  holySwordIcon,
  ironDoorTile,
  magicGuardSprite,
  notebookIcon,
  oldmanSprite,
  sealedWallTile,
  specialDoorTile,
  stairsDownTile,
  thiefSprite,
  traderSprite,
} from './sprites2';
import { mulberry32, Pix } from './pixel';
import * as S5 from './sprites5';
import * as S4 from './sprites4';
import { crossIcon, ghostSprite, holyWaterIcon, lavaTile, octopusSprite, orcSprite, pickaxeIcon, rockSprite, swap, vampireSprite } from './sprites3';

type C = HTMLCanvasElement;

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

export interface Pal {
  main: string;
  light: string;
  dark: string;
  pale: string;
}

const DOOR_PAL: Record<DoorColor, Pal> = {
  yellow: { main: '#ffc53d', light: '#ffe68a', dark: '#d9861a', pale: '#fff6d0' },
  blue: { main: '#3d9bff', light: '#8fd2ff', dark: '#2160c4', pale: '#dff3ff' },
  red: { main: '#ff4f62', light: '#ff9ca6', dark: '#c4224a', pale: '#ffe0e4' },
};

/* ------------------------------------------------------------------ 地形 */

export function floorTile(seed: number): Pix {
  const p = new Pix();
  const rnd = mulberry32(seed);
  p.rect(0, 0, 32, 32, '#d0a873');
  const tints: Array<[string, string, string]> = [
    ['#f3dcb3', '#fdedcc', '#dfc08f'],
    ['#efd6aa', '#fae7c2', '#d9b883'],
    ['#f6e1bd', '#fff3d6', '#e3c597'],
  ];
  const rows = [
    { y: 0, off: 0 },
    { y: 16, off: 8 },
  ];
  for (const r of rows) {
    for (let sx = -16; sx < 32; sx += 16) {
      const x0 = sx + r.off;
      const [base, hi, sh] = tints[Math.floor(rnd() * tints.length)];
      for (let y = r.y; y < r.y + 15; y++) {
        for (let x = x0; x < x0 + 15; x++) {
          let c = base;
          if (y === r.y || x === x0) c = hi;
          else if (y === r.y + 14 || x === x0 + 14) c = sh;
          p.set(x, y, c);
        }
      }
      for (let k = 0; k < 3; k++) p.set(x0 + 2 + Math.floor(rnd() * 11), r.y + 2 + Math.floor(rnd() * 11), sh);
      p.set(x0 + 2 + Math.floor(rnd() * 11), r.y + 2 + Math.floor(rnd() * 11), hi);
    }
  }
  return p;
}

const EMBLEM = ['...o...', '..oLo..', '.oLGGo.', 'oLGGGDo', '.oGGDo.', '..oDo..', '...o...'];

function wallTile(variant: number): Pix {
  const p = new Pix();
  const rnd = mulberry32(911 + variant * 17);
  const MORTAR = '#5862ad';
  const BASE = '#9cabe8';
  const HI = '#ccd6fb';
  const SH = '#7787cc';
  p.rect(0, 0, 32, 32, MORTAR);
  for (let row = 0; row < 4; row++) {
    const y0 = row * 8;
    const off = row % 2 ? 8 : 0;
    for (let sx = -16; sx < 32; sx += 16) {
      const x0 = sx + off;
      for (let y = y0; y < y0 + 7; y++) {
        for (let x = x0; x < x0 + 15; x++) {
          let c = BASE;
          if (y === y0 || x === x0) c = HI;
          else if (y === y0 + 6 || x === x0 + 14) c = SH;
          p.set(x, y, c);
        }
      }
      for (let k = 0; k < 2; k++) p.set(x0 + 2 + Math.floor(rnd() * 11), y0 + 2 + Math.floor(rnd() * 3), SH);
    }
  }
  if (variant === 1) {
    p.stamp(12, 8, EMBLEM, { o: '#3b3f86', L: GOLD_L, G: GOLD, D: GOLD_D });
  } else if (variant === 2) {
    // 藤蔓与小花
    for (let y = 0; y < 22; y++) {
      const x = 7 + Math.round(Math.sin(y * 0.55) * 1.6);
      p.set(x, y, '#3d9c50');
      if (y % 5 === 2) {
        p.ellipse(x + 2.5, y + 0.5, 1.6, 1.1, '#6fdc72');
        p.set(x + 2, y, '#a6f59a');
      }
      if (y % 5 === 4) p.ellipse(x - 1.5, y + 0.5, 1.6, 1.1, '#56c463');
    }
    const flower = ['.p.', 'pyp', '.p.'];
    p.stamp(9, 5, flower, { p: '#ff8fcb', y: '#fff27a' });
    p.stamp(3, 14, flower, { p: '#ffb3e0', y: '#fff27a' });
  }
  return p;
}

function stairsUpTile(): Pix {
  const p = floorTile(4242);
  p.ellipse(16, 6, 10, 6, '#fff3c4');
  p.ellipse(16, 6, 7, 4, '#ffffff');
  const TOP = '#ffe58a';
  const BODY = ['#cfc6f3', '#d9d1f7', '#e3ddfa', '#ece8fc', '#f6f4ff'];
  const SIDE = '#a297d8';
  for (let k = 0; k < 5; k++) {
    const y = 25 - k * 5;
    const x0 = 3 + k * 2;
    const w = 26 - k * 4;
    p.rect(x0, y, w, 5, BODY[k]);
    p.rect(x0, y, w, 1, TOP);
    p.rect(x0, y + 4, w, 1, SIDE);
    p.rect(x0, y, 1, 5, SIDE);
    p.rect(x0 + w - 1, y, 1, 5, SIDE);
  }
  // 金色上箭头
  p.stamp(13, 1, ['..o..', '.oGo.', 'oGGGo', '.oGo.', '.oGo.'], { o: GOLD_D, G: GOLD_L });
  return p;
}

function doorTile(pal: Pal): Pix {
  const p = new Pix();
  const F = '#eee8ff';
  const FH = '#ffffff';
  const FS = '#b7aee0';
  const FD = '#7d72b8';
  p.rect(1, 10, 30, 22, F);
  p.ellipse(16, 10.5, 15, 9.5, F);
  p.autoShade([F], FH, FS);
  p.rect(4, 11, 24, 21, FD);
  p.ellipse(16, 11.5, 12, 8.2, FD);
  p.rect(5, 12, 22, 20, pal.main);
  p.ellipse(16, 12.5, 11, 7.2, pal.main);
  p.autoShade([pal.main], pal.light, pal.dark);
  // 竖向门板缝
  for (const x of [10, 16, 21]) for (let y = 4; y < 31; y++) if (p.get(x, y) === pal.main) p.set(x, y, pal.dark);
  // 横向金属箍
  for (const y of [15, 26]) {
    for (let x = 5; x < 27; x++) {
      const c = p.get(x, y);
      if (c === pal.main || c === pal.dark || c === pal.light) {
        p.set(x, y, pal.pale);
        p.set(x, y + 1, pal.dark);
      }
    }
    p.set(7, y, GOLD);
    p.set(24, y, GOLD);
  }
  // 锁孔
  p.ellipse(16, 21, 3.2, 3.6, GOLD);
  p.set(14, 18, GOLD_L);
  p.set(15, 18, GOLD_L);
  p.rect(15, 19, 2, 2, '#3a2140');
  p.rect(15, 21, 2, 3, '#3a2140');
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 道具 */

export function keyIcon(pal: Pal): Pix {
  const p = new Pix();
  p.ellipse(11, 11, 6.6, 6.6, pal.main);
  p.ellipse(11, 11, 2.7, 2.7, null);
  p.line(15, 15, 25, 25, pal.main, 3);
  p.line(20, 21, 17, 24, pal.main, 2);
  p.line(24, 25, 21, 28, pal.main, 2);
  p.autoShade([pal.main], pal.light, pal.dark);
  p.set(8, 6, WHITE);
  p.set(7, 7, WHITE);
  p.set(6, 8, pal.pale);
  p.set(17, 16, pal.pale);
  return p.outline(OUT);
}

function potionIcon(pal: Pal): Pix {
  const p = new Pix();
  const G = '#e6f5ff';
  const GD = '#b4d4ee';
  p.ellipse(16, 21, 8.6, 8.2, G);
  p.rect(13, 9, 6, 6, G);
  p.recolor((_x, y, c) => c === G && y >= 18, pal.main);
  p.autoShade([G], WHITE, GD);
  p.autoShade([pal.main], pal.light, pal.dark);
  p.rect(12, 9, 8, 1, GD);
  p.rect(12, 5, 8, 4, '#c98a4b');
  p.rect(12, 5, 8, 1, '#e8b679');
  p.rect(12, 8, 8, 1, '#8f5a2c');
  for (let y = 16; y <= 22; y++) p.set(10, y, WHITE);
  p.set(11, 15, WHITE);
  p.set(19, 23, pal.pale);
  p.set(16, 26, pal.light);
  p.set(21, 21, pal.light);
  return p.outline(OUT);
}

function gemIcon(pal: Pal): Pix {
  const p = new Pix();
  p.poly([[10, 6], [22, 6], [28, 13], [16, 28], [4, 13]], pal.main);
  p.poly([[10, 6], [22, 6], [28, 13], [4, 13]], pal.light);
  p.poly([[12.5, 7], [19.5, 7], [21.5, 12], [10.5, 12]], pal.pale);
  p.poly([[16, 13], [28, 13], [16, 28]], pal.dark);
  p.line(10, 13, 16, 26, pal.main);
  for (let x = 5; x < 28; x++) if (p.get(x, 13) !== null) p.set(x, 13, pal.pale);
  p.set(13, 8, WHITE);
  p.set(14, 8, WHITE);
  p.set(13, 9, WHITE);
  p.set(8, 14, WHITE);
  return p.outline(OUT);
}

export function swordIcon(): Pix {
  const p = new Pix();
  p.line(10, 21, 25, 6, SILVER, 3);
  p.line(11, 20, 25, 6, SILVER_L, 1);
  p.line(12, 22, 26, 8, SILVER_D, 1);
  p.set(26, 5, SILVER_L);
  p.line(6, 18, 13, 25, GOLD, 2);
  p.set(6, 18, GOLD_L);
  p.set(7, 19, GOLD_L);
  p.line(8, 23, 5, 26, '#8a5530', 2);
  p.ellipse(4, 27.5, 2.2, 2.2, '#ff5a7a');
  p.set(3, 27, WHITE);
  return p.outline(OUT);
}

export function shieldIcon(): Pix {
  const p = new Pix();
  p.poly([[5, 4], [27, 4], [27, 16], [16, 29], [5, 16]], GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  p.poly([[8, 7], [24, 7], [24, 16], [16, 25.5], [8, 16]], '#3f7fe8');
  p.autoShade(['#3f7fe8'], '#8fc0ff', '#2856b8');
  p.rect(15, 9, 2, 13, SILVER);
  p.rect(11, 12, 10, 2, SILVER);
  p.set(15, 9, SILVER_L);
  p.set(11, 12, SILVER_L);
  p.set(9, 8, WHITE);
  p.set(10, 8, WHITE);
  return p.outline(OUT);
}

function heartIcon(): Pix {
  const p = new Pix();
  const R = '#ff4d6d';
  p.ellipse(11, 12, 6.5, 6.5, R);
  p.ellipse(21, 12, 6.5, 6.5, R);
  p.poly([[4.6, 14], [27.4, 14], [16, 27]], R);
  p.autoShade([R], '#ff9db0', '#c41e4a');
  p.rect(8, 9, 2, 2, WHITE);
  p.set(10, 8, WHITE);
  return p.outline(OUT);
}

export function coinIcon(): Pix {
  const p = new Pix();
  p.ellipse(16, 16, 11, 11, GOLD);
  p.autoShade([GOLD], GOLD_L, GOLD_D);
  p.ellipse(16, 16, 7, 7, GOLD_D);
  p.ellipse(16, 16, 6, 6, GOLD);
  p.rect(15, 11, 2, 10, GOLD_L);
  p.rect(13, 13, 6, 2, GOLD_L);
  p.rect(13, 17, 6, 2, GOLD_L);
  p.set(9, 10, WHITE);
  p.set(10, 9, WHITE);
  return p.outline(OUT);
}

function starIcon(): Pix {
  const p = new Pix();
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 13 : 5.5;
    pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]);
  }
  p.poly(pts, '#7ee0ff');
  p.autoShade(['#7ee0ff'], '#d8f7ff', '#3aa6e0');
  p.set(15, 9, WHITE);
  p.set(15, 10, WHITE);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 勇士 */

function heroSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const sway = [0, 1, 2, 1][frame];
  const CAPE = '#ff4d63';
  const CAPE_L = '#ff8a99';
  const CAPE_D = '#c42246';
  const ARM = SILVER;
  // 披风（身后）
  p.poly([[9, 13 + b], [15, 13 + b], [15, 25], [8 - sway, 28], [6 - sway, 26], [8, 19 + b]], CAPE);
  p.autoShade([CAPE], CAPE_L, CAPE_D);
  // 腿与靴子
  p.rect(12, 23, 3, 4, '#3550b5');
  p.rect(17, 23, 3, 4, '#3550b5');
  p.rect(11, 27, 4, 3, '#7a4a2a');
  p.rect(17, 27, 5, 3, '#7a4a2a');
  p.rect(11, 27, 4, 1, '#a8693d');
  p.rect(17, 27, 5, 1, '#a8693d');
  // 盔甲躯干
  p.rect(10, 14 + b, 12, 9, ARM);
  p.autoShade([ARM], SILVER_L, SILVER_D);
  // 蓝色罩袍
  p.rect(13, 15 + b, 6, 8, '#3f6fe0');
  p.rect(13, 15 + b, 6, 1, '#7fa6ff');
  p.rect(18, 16 + b, 1, 7, '#2a4fb4');
  p.stamp(15, 17 + b, ['.G.', 'GLG', '.G.'], { G: GOLD, L: GOLD_L });
  // 腰带
  p.rect(10, 21 + b, 12, 1, GOLD);
  p.set(16, 21 + b, GOLD_L);
  // 肩甲
  p.ellipse(10.5, 15 + b, 3, 2.4, SILVER);
  p.ellipse(21.5, 15 + b, 3, 2.4, SILVER);
  p.set(9, 14 + b, SILVER_L);
  p.set(20, 14 + b, SILVER_L);
  p.rect(8, 16 + b, 5, 1, GOLD);
  p.rect(19, 16 + b, 5, 1, GOLD);
  // 剑（右手）
  p.rect(24, 4 + b, 2, 14, '#f4f8ff');
  p.rect(25, 5 + b, 1, 13, '#a9b8d8');
  p.set(24, 3 + b, '#f4f8ff');
  p.rect(21, 18 + b, 8, 2, GOLD);
  p.set(21, 18 + b, GOLD_L);
  p.rect(24, 20 + b, 2, 3, '#7a4a2a');
  p.rect(23, 20 + b, 3, 2, '#8c5a34');
  p.ellipse(25, 23.5 + b, 1.4, 1.4, '#ff5a7a');
  // 头盔与脸
  p.ellipse(16, 9 + b, 6.6, 6.2, SILVER);
  p.autoShade([SILVER], SILVER_L, SILVER_D);
  p.rect(15, 8 + b, 7, 5, SKIN);
  p.rect(15, 12 + b, 7, 1, SKIN_D);
  p.rect(13, 7 + b, 10, 1, GOLD);
  p.set(15, 7 + b, GOLD_L);
  if (blink) {
    p.rect(19, 10 + b, 2, 1, '#6b3a3a');
  } else {
    p.rect(19, 9 + b, 1, 2, OUT);
    p.set(20, 9 + b, OUT);
    p.set(20, 10 + b, WHITE);
  }
  p.set(21, 11 + b, '#ff9aa0');
  // 头盔羽饰（随动画摆动）
  p.poly([[14, 3 + b], [19, 2 + b], [16, 5 + b], [11 - sway * 0.5, 7 + b], [9 - sway, 6 + b]], '#ffcf4a');
  p.set(16, 2 + b, GOLD_L);
  p.set(17, 2 + b, GOLD_L);
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 怪物 */

export function slimeSprite(pal: Pal, frame: number, blink: boolean, angry: boolean): Pix {
  const p = new Pix();
  const [rx, ry] = [
    [11, 9],
    [12.2, 7.8],
    [11, 9],
    [10, 10.2],
  ][frame];
  const cy = 25;
  for (let y = Math.floor(cy - ry); y <= cy + 3; y++) {
    const t = y + 0.5 - cy;
    const k = t < 0 ? 1 - (t / ry) ** 2 : 1 - (t / 3.6) ** 2;
    if (k <= 0) continue;
    const hw = rx * Math.sqrt(k);
    for (let x = Math.floor(16 - hw); x <= Math.ceil(16 + hw); x++) if (Math.abs(x + 0.5 - 16) <= hw) p.set(x, y, pal.main);
  }
  p.recolor((_x, y, c) => c === pal.main && y >= cy + 1, pal.dark);
  p.autoShade([pal.main], pal.light, pal.dark);
  p.ellipse(16 - rx * 0.45, cy - ry * 0.55, 2.6, 1.6, pal.pale);
  p.set(Math.floor(16 - rx * 0.45) - 1, Math.floor(cy - ry * 0.55) - 1, WHITE);
  p.set(Math.floor(16 + rx * 0.55), Math.floor(cy - ry * 0.3), pal.pale);
  const ey = Math.floor(cy - 3);
  if (blink) {
    p.rect(11, ey + 1, 3, 1, OUT);
    p.rect(18, ey + 1, 3, 1, OUT);
  } else {
    p.rect(11, ey, 3, 3, OUT);
    p.rect(18, ey, 3, 3, OUT);
    p.set(11, ey, WHITE);
    p.set(18, ey, WHITE);
  }
  if (angry) {
    p.line(10, ey - 3, 13, ey - 1, OUT);
    p.line(21, ey - 3, 18, ey - 1, OUT);
  }
  p.set(14, ey + 4, OUT);
  p.set(15, ey + 5, OUT);
  p.set(16, ey + 5, OUT);
  p.set(17, ey + 4, OUT);
  p.set(9, ey + 3, '#ff9ab0');
  p.set(22, ey + 3, '#ff9ab0');
  return p.outline(OUT);
}

/** 大蝙蝠：同一骨架换成深红配色，加上尖耳与獠牙 */
export function bigBatSprite(frame: number, blink: boolean): Pix {
  const p = swap(batSprite(frame, blink), {
    '#7448d6': '#b8324a', '#a37cff': '#ff6a7e', '#4d2c9e': '#7a1430',
    '#9c68f2': '#5a2a4a', '#c9a3ff': '#8e4a72', '#6f43c4': '#3a1830', '#d6bbff': '#c47a9a',
    '#ff3b6b': '#ffe14a',
  });
  return p;
}

function batSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const bob = [0, -1, -2, -1][frame];
  const cy = 16 + bob;
  const W = '#7448d6';
  const WD = '#4d2c9e';
  const tips: Array<[number, number]> = [
    [2, cy - 10],
    [1, cy - 3],
    [3, cy + 6],
    [1, cy - 3],
  ];
  const tip = tips[frame];
  const rt: [number, number] = [13, cy - 3];
  const rb: [number, number] = [13, cy + 3];
  const lerp = (a: [number, number], c: [number, number], k: number): [number, number] => [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
  const mid = lerp(rt, tip, 0.5);
  const wing: Array<[number, number]> = [
    rt,
    [mid[0], mid[1] - 2.5],
    tip,
    lerp(tip, rb, 0.28),
    ((q) => [q[0] + 0.5, q[1] - 2.5] as [number, number])(lerp(tip, rb, 0.42)),
    lerp(tip, rb, 0.6),
    ((q) => [q[0] + 0.5, q[1] - 2.2] as [number, number])(lerp(tip, rb, 0.76)),
    rb,
  ];
  p.poly(wing, W);
  p.poly(wing.map(([x, y]) => [32 - x, y] as [number, number]), W);
  p.autoShade([W], '#a37cff', WD);
  p.line(13, cy - 1, tip[0] + 1, tip[1], WD);
  p.line(18, cy - 1, 31 - tip[0] - 1, tip[1], WD);
  // 身体
  const B = '#9c68f2';
  p.poly([[11.5, cy - 4], [13, cy - 10], [15, cy - 5]], B);
  p.poly([[20.5, cy - 4], [19, cy - 10], [17, cy - 5]], B);
  p.ellipse(16, cy, 5.4, 5.6, B);
  p.autoShade([B], '#c9a3ff', '#6f43c4');
  p.ellipse(16, cy + 2, 3, 2.8, '#d6bbff');
  p.set(13, cy - 8, '#ff9ad5');
  p.set(19, cy - 8, '#ff9ad5');
  if (blink) {
    p.rect(13, cy - 1, 2, 1, OUT);
    p.rect(17, cy - 1, 2, 1, OUT);
  } else {
    p.rect(13, cy - 2, 2, 2, '#ff3b6b');
    p.rect(17, cy - 2, 2, 2, '#ff3b6b');
    p.set(13, cy - 2, WHITE);
    p.set(17, cy - 2, WHITE);
  }
  p.set(15, cy + 2, WHITE);
  p.set(17, cy + 2, WHITE);
  p.set(14, cy + 6, '#ffb24a');
  p.set(18, cy + 6, '#ffb24a');
  return p.outline(OUT);
}

export function skeletonSprite(frame: number, blink: boolean, soldier: boolean): Pix {
  const p = new Pix();
  const b = [0, 0, 1, 1][frame];
  const jaw = frame === 2 ? 1 : 0;
  const glow = soldier ? ['#ff5a5a', '#ff9a7a', '#ff5a5a', '#ff3a4a'][frame] : ['#4ff0ff', '#a6f8ff', '#4ff0ff', '#2fd0ff'][frame];
  const BONE = '#f6f1e2';
  const BONE_L = '#ffffff';
  const BONE_D = '#cbc2a8';
  const CAGE = '#7b6b9e';
  // 腿与脚
  p.rect(13, 22, 2, 6, BONE);
  p.rect(18, 22, 2, 6, BONE);
  p.rect(12, 27, 3, 2, BONE);
  p.rect(18, 27, 4, 2, BONE);
  // 骨盆、脊椎、胸腔
  p.rect(12, 20 + b, 9, 3, BONE);
  p.rect(12, 14 + b, 9, 6, CAGE);
  p.rect(16, 14 + b, 1, 7, BONE);
  for (let r = 0; r < 3; r++) p.rect(12, 14 + b + r * 2, 9, 1, BONE);
  // 手臂
  p.rect(10, 15 + b, 2, 6, BONE);
  p.rect(21, 15 + b, 2, 5, BONE);
  p.rect(21, 19 + b, 3, 2, BONE);
  p.autoShade([BONE], BONE_L, BONE_D);
  if (soldier) {
    // 圆盾
    p.ellipse(9, 20 + b, 5.6, 6.2, GOLD);
    p.ellipse(9, 20 + b, 4.4, 5, '#3a7bff');
    p.autoShade(['#3a7bff'], '#86b8ff', '#2652b8');
    p.ellipse(9, 20 + b, 1.6, 1.6, GOLD_L);
    // 长剑
    p.rect(24, 3 + b, 2, 16, SILVER);
    p.rect(25, 4 + b, 1, 15, SILVER_D);
    p.rect(21, 18 + b, 8, 2, GOLD);
  } else {
    // 弯刀
    p.line(23, 18 + b, 27, 7 + b, '#dfe6f2', 2);
    p.line(25, 17 + b, 28, 8 + b, '#a9b6cf', 1);
    p.rect(21, 18 + b, 5, 2, '#c98a4b');
  }
  // 头骨
  p.ellipse(16, 8.5 + b, 6.4, 5.8, BONE);
  p.autoShade([BONE], BONE_L, BONE_D);
  p.rect(13, 13 + b + jaw, 7, 2, BONE);
  p.set(14, 13 + b + jaw, BONE_D);
  p.set(16, 13 + b + jaw, BONE_D);
  p.set(18, 13 + b + jaw, BONE_D);
  p.rect(12, 8 + b, 3, 3, OUT);
  p.rect(18, 8 + b, 3, 3, OUT);
  if (!blink) {
    p.set(13, 9 + b, glow);
    p.set(19, 9 + b, glow);
  }
  p.set(16, 11 + b, OUT);
  if (soldier) {
    // 头盔与红缨
    p.recolor((_x, y, c) => y <= 6 + b && (c === BONE || c === BONE_L || c === BONE_D), '#8fa0cf');
    p.rect(9, 6 + b, 15, 1, '#5f6fa8');
    p.rect(10, 5 + b, 13, 1, '#b9c6ee');
    p.rect(15, 0 + b, 3, 4, '#ff4d63');
    p.set(15, 0 + b, '#ff9aa6');
  }
  return p.outline(OUT);
}

export function wizardSprite(frame: number, blink: boolean, red = false): Pix {
  const p = new Pix();
  const b = [0, -1, -2, -1][frame];
  const orb = red ? ['#ffb03b', '#ffd27a', '#ffffff', '#ffd27a'][frame] : ['#ff7ae0', '#ffb0f0', '#ffffff', '#ffb0f0'][frame];
  const R = red ? '#d8344a' : '#5964ec';
  const RL = red ? '#ff7f8a' : '#97a0ff';
  const RD = red ? '#97203a' : '#3a40b8';
  // 法杖
  p.rect(25, 6 + b, 1, 22, '#a5683a');
  p.rect(26, 6 + b, 1, 22, '#7a4824');
  // 长袍
  p.poly([[11, 13 + b], [21, 13 + b], [25, 29 + b], [7, 29 + b]], R);
  p.autoShade([R], RL, RD);
  p.rect(7, 27 + b, 18, 1, GOLD);
  p.rect(15, 14 + b, 2, 13, GOLD);
  // 袖子与手
  p.ellipse(22, 18 + b, 3, 2.4, R);
  p.ellipse(24.5, 18.5 + b, 1.6, 1.6, SKIN);
  p.ellipse(10, 18 + b, 3, 2.4, RD);
  // 脸与白胡子
  p.ellipse(16, 11 + b, 4.4, 3.8, SKIN);
  p.poly([[11.5, 12 + b], [20.5, 12 + b], [16, 20 + b]], '#ffffff');
  p.set(15, 18 + b, '#d9e2f2');
  p.set(17, 16 + b, '#d9e2f2');
  if (blink) {
    p.rect(13, 11 + b, 2, 1, SKIN_D);
    p.rect(17, 11 + b, 2, 1, SKIN_D);
  } else {
    p.rect(14, 10 + b, 1, 2, OUT);
    p.rect(18, 10 + b, 1, 2, OUT);
  }
  // 尖顶帽
  p.poly([[8, 9 + b], [24, 9 + b], [19, 4 + b], [22, 0 + b], [14, 3 + b]], R);
  p.autoShade([R], RL, RD);
  p.rect(9, 8 + b, 14, 1, GOLD);
  p.set(17, 5 + b, '#fff27a');
  p.set(13, 7 + b, '#fff27a');
  p.set(20, 6 + b, '#fff27a');
  // 法球
  p.ellipse(25.5, 5 + b, 3, 3, orb);
  p.set(24, 4 + b, WHITE);
  const sp: Array<[number, number]> = [
    [29, 1],
    [22, 2],
    [29, 8],
    [21, 6],
  ];
  const [sx, sy] = sp[frame];
  p.set(sx, sy + b, '#fff27a');
  return p.outline(OUT);
}

/* ------------------------------------------------------------------ 汇总 */

export interface AnimSprite {
  frames: C[];
  blink: C[];
  white: C[];
  frameMs: number;
}

export interface SpriteSet {
  floor: C[];
  wall: C[];
  stairsUp: C;
  stairsDown: C;
  sealedWall: C;
  altarL: AnimSprite;
  altarR: AnimSprite;
  door: Record<DoorKind, C>;
  item: Record<ItemId, C>;
  lava: AnimSprite;
  star: AnimSprite;
  hero: { right: AnimSprite; left: AnimSprite };
  monster: Record<MonsterId, AnimSprite>;
  npc: Record<NpcId, AnimSprite>;
  icon: { heart: C; coin: C; star: C; book: C; holySword: C };
  /** 便于 HTML 界面使用的 dataURL */
  url: { monster: Record<MonsterId, string>; npc: Record<NpcId, string>; hero: string; item: Record<string, string> };
}

function anim(make: (f: number, blink: boolean) => Pix, frameMs: number, n = 4): AnimSprite {
  const frames: C[] = [];
  const blink: C[] = [];
  const white: C[] = [];
  for (let f = 0; f < n; f++) {
    const pix = make(f, false);
    frames.push(pix.toCanvas());
    blink.push(make(f, true).toCanvas());
    white.push(pix.tint('#ffffff').toCanvas());
  }
  return { frames, blink, white, frameMs };
}

const SLIME_GREEN: Pal = { main: '#5fd65a', light: '#aef58c', dark: '#2f9a4a', pale: '#eaffd8' };
const SLIME_BLACK: Pal = { main: '#4a4466', light: '#7f78a8', dark: '#2a2440', pale: '#c8c2ea' };
const SLIME_RED: Pal = { main: '#ff5d5d', light: '#ffa08e', dark: '#c42a44', pale: '#ffe4de' };

export function buildSprites(): SpriteSet {
  const monster: Record<MonsterId, AnimSprite> = {
    greenSlime: anim((f, b) => slimeSprite(SLIME_GREEN, f, b, false), 230),
    redSlime: anim((f, b) => slimeSprite(SLIME_RED, f, b, true), 200),
    bat: anim((f, b) => batSprite(f, b), 110),
    bluePriest: anim((f, b) => S5.acolyteSprite(f, b), 260),
    skeleton: anim((f, b) => skeletonSprite(f, b, false), 300),
    skeletonSoldier: anim((f, b) => skeletonSprite(f, b, true), 300),
    yellowGuard: anim((f, b) => guardSprite(f, b, false), 320),
    blueGuard: anim((f, b) => guardSprite(f, b, true), 320),
    skeletonCaptain: anim((f, b) => captainSprite(f, b), 280),
    blackSlime: anim((f, b) => slimeSprite(SLIME_BLACK, f, b, true), 260),
    bigBat: anim((f, b) => bigBatSprite(f, b), 120),
    zombie: anim((f, b) => orcSprite(f, b, false), 320),
    zombieKnight: anim((f, b) => orcSprite(f, b, true), 300),
    rock: anim((f, b) => rockSprite(f, b), 420),
    slimeMan: anim((f, b) => ghostSprite(f, b), 240),
    redPriest: anim((f, b) => S5.hierophantSprite(f, b), 240),
    octopus: anim((f, b) => octopusSprite(f, b), 260),
    vampire: anim((f, b) => vampireSprite(f, b), 260),
    slimelord: anim((f, b) => S4.slimelordSprite(f, b), 240),
    redBat: anim((f, b) => S4.redBatSprite(f, b), 110),
    ghostSkeleton: anim((f, b) => S4.ghostSkeletonSprite(f, b), 280),
    brownWizard: anim((f, b) => S4.brownWizardSprite(f, b), 260),
    redWizard: anim((f, b) => S4.redWizardSprite(f, b), 230),
    redGuard: anim((f, b) => S4.redGuardSprite(f, b), 320),
    swordsman: anim((f, b) => S4.swordsmanSprite(f, b), 260),
    soldier: anim((f, b) => S4.soldierSprite(f, b), 320),
    yellowKnight: anim((f, b) => S4.yellowKnightSprite(f, b), 280),
    redKnight: anim((f, b) => S4.redKnightSprite(f, b), 300),
    darkKnight: anim((f, b) => S4.darkKnightSprite(f, b), 300),
    whiteKing: anim((f, b) => magicGuardSprite(f, b), 240),
    blackMagician: anim((f, b) => S5.archmageSprite(f, b), 240),
    magicDragon: anim((f, b) => S4.dragonSprite(f, b), 260),
    redKing: anim((f, b) => demonKingSprite(f, b), 260),
  };
  const npc: Record<NpcId, AnimSprite> = {
    oldman: anim((f, b) => oldmanSprite(f, b), 420),
    trader: anim((f, b) => traderSprite(f, b, false), 360),
    blessTrader: anim((f, b) => traderSprite(f, b, true), 300),
    thief: anim((f, b) => thiefSprite(f, b), 300),
    altar: anim((f) => altarSprite(f), 220),
    demonKing: anim((f, b) => demonKingSprite(f, b), 260),
    magicGuard: anim((f, b) => magicGuardSprite(f, b), 240),
    // 暗墙后的特殊商人：同款商人换成紫金配色
    specialTrader: anim((f, b) => swap(traderSprite(f, b, false), { '#3fbf7a': '#c25ad8', '#8ff0b2': '#f0a6ff', '#258a55': '#7f2e9a' }), 360),
    princess: anim((f, b) => S4.princessSprite(f, b), 320),
    goldKnight: anim((f, b) => S4.yellowKnightSprite(f, b), 280),
  };
  const items = {
    yellowKey: keyIcon(DOOR_PAL.yellow).toCanvas(),
    blueKey: keyIcon(DOOR_PAL.blue).toCanvas(),
    redKey: keyIcon(DOOR_PAL.red).toCanvas(),
    redPotion: potionIcon({ main: '#ff3b5c', light: '#ff8aa0', dark: '#c41e45', pale: '#ffd6de' }).toCanvas(),
    bluePotion: potionIcon({ main: '#3b7bff', light: '#8fb8ff', dark: '#2346c4', pale: '#d6e6ff' }).toCanvas(),
    redGem: gemIcon({ main: '#ff2f58', light: '#ff7f9a', dark: '#b8103c', pale: '#ffd0dc' }).toCanvas(),
    blueGem: gemIcon({ main: '#2f8bff', light: '#7fc4ff', dark: '#1450b8', pale: '#d5ecff' }).toCanvas(),
    ironSword: swordIcon().toCanvas(),
    ironShield: shieldIcon().toCanvas(),
    fly: flyWandIcon().toCanvas(),
    notebook: notebookIcon().toCanvas(),
    silverSword: swap(swordIcon(), { [SILVER]: '#cfe9ff', [SILVER_D]: '#7fa6d8', [GOLD]: '#dfe6f4', [GOLD_L]: '#ffffff' }).toCanvas(),
    silverShield: swap(shieldIcon(), { [GOLD]: '#dfe6f4', [GOLD_L]: '#ffffff', [GOLD_D]: '#8e9abc', '#3f7fe8': '#5a6cf0', '#8fc0ff': '#a8b4ff', '#2856b8': '#3a44b0' }).toCanvas(),
    holySword: holySwordIcon().toCanvas(),
    pickaxe: pickaxeIcon().toCanvas(),
    cross: crossIcon().toCanvas(),
    superPotion: holyWaterIcon().toCanvas(),
    knightSword: S4.knightSwordIcon().toCanvas(),
    knightShield: S4.knightShieldIcon().toCanvas(),
    sacredSword: S4.sacredSwordIcon().toCanvas(),
    sacredShield: S4.sacredShieldIcon().toCanvas(),
    divineShield: S4.divineShieldIcon().toCanvas(),
    bomb: S4.bombIcon().toCanvas(),
    centerFly: S4.centerFlyIcon().toCanvas(),
    upFly: S4.upFlyIcon().toCanvas(),
    downFly: S4.downFlyIcon().toCanvas(),
    coin: S4.luckyCoinIcon().toCanvas(),
    snow: S4.snowIcon().toCanvas(),
    earthquake: S4.earthquakeIcon().toCanvas(),
    bigKey: S4.bigKeyIcon().toCanvas(),
    knife: S4.knifeIcon().toCanvas(),
  };
  const book = bookIcon().toCanvas();
  const url = {
    monster: {} as Record<MonsterId, string>,
    npc: {} as Record<NpcId, string>,
    hero: '',
    item: { book: book.toDataURL(), ...Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.toDataURL()])) } as Record<string, string>,
  };
  for (const id of Object.keys(monster) as MonsterId[]) url.monster[id] = monster[id].frames[0].toDataURL();
  for (const id of Object.keys(npc) as NpcId[]) url.npc[id] = npc[id].frames[0].toDataURL();
  const floor0 = floorTile(11);

  const heroR = anim((f, b) => heroSprite(f, b), 280);
  const heroL = anim((f, b) => heroSprite(f, b).flipX(), 280);
  url.hero = heroR.frames[0].toDataURL();
  return {
    floor: [floor0, floorTile(23), floorTile(37)].map((p) => p.toCanvas()),
    wall: [0, 1, 2].map((v) => wallTile(v).toCanvas()),
    stairsUp: stairsUpTile().toCanvas(),
    stairsDown: stairsDownTile(floor0).toCanvas(),
    sealedWall: sealedWallTile(wallTile(0)).toCanvas(),
    altarL: anim((f) => altarSideSprite(f, false), 160),
    altarR: anim((f) => altarSideSprite((f + 2) % 4, true), 160),
    door: {
      yellow: doorTile(DOOR_PAL.yellow).toCanvas(),
      blue: doorTile(DOOR_PAL.blue).toCanvas(),
      red: doorTile(DOOR_PAL.red).toCanvas(),
      special: specialDoorTile().toCanvas(),
      iron: ironDoorTile().toCanvas(),
    },
    item: items,
    lava: anim((f) => lavaTile(f), 220),
    star: anim((f) => S4.starTile(f), 300),
    hero: { right: heroR, left: heroL },
    monster,
    npc,
    icon: { heart: heartIcon().toCanvas(), coin: coinIcon().toCanvas(), star: starIcon().toCanvas(), book, holySword: holySwordIcon().toCanvas() },
    url,
  };
}

export const DOOR_GLOW: Record<DoorKind, string> = { yellow: '255,214,90', blue: '90,180,255', red: '255,100,120', special: '190,120,255', iron: '200,210,235' };
