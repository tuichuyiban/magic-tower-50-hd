/**
 * 武器攻击特效：按勇士当前装备的武器分 6 档，越好的武器越华丽。
 *   0 空手（无武器，3F 被魔王打劫后）：白色小冲击 + 拳印
 *   1 铁剑：一道灰色弧形斩击 + 火花
 *   2 银剑：两道交错斩击 + 银色光尾
 *   3 骑士剑：十字斩 + 蓝色辉光 + 轻微震屏
 *   4 圣剑：金色光辉斩 + 光柱 + 上升光粒
 *   5 神圣剑：彩虹三连斩 + 扩散符文环 + 光爆 + 微闪 + 较强震屏
 * 只在手动战斗时播放（键盘撞怪、点击寻路后撞怪走的是同一条 tryMove → resolveBattle 路径）；
 * 不改变战斗流程与时长（全部特效都在原有怪物消散动画 460ms 之内结束，且不阻塞输入）。
 * 所有速度都播放完整特效（快速行走不缩短）；「瞬移」播放简短版（时长 60%、粒子减半，无加强震屏 / 闪光）。
 * 像素风：坐标取整、方形粒子、深色描边（米黄色地板与怪物白闪上也看得清）。
 */
import type { Dir } from '../game/types';

export type WeaponTier = 0 | 1 | 2 | 3 | 4 | 5;
export const TIER_NAMES = ['空手', '铁剑', '银剑', '骑士剑', '圣剑', '神圣剑'] as const;
export const TIER_IDS = ['fist', 'iron', 'silver', 'knight', 'sacred', 'divine'] as const;

const TIER_ALIASES: Array<[WeaponTier, string[]]> = [
  // 先匹配长名字（「神圣剑」包含「圣剑」）
  [5, ['神圣剑', 'holySword', 'holy']],
  [4, ['圣剑', 'sacredSword', 'sacred']],
  [3, ['骑士剑', 'knightSword', 'knight']],
  [2, ['银剑', 'silverSword', 'silver']],
  [1, ['铁剑', 'ironSword', 'iron']],
];
/**
 * 由勇士的武器得到特效档位。接受武器名（铁剑…神圣剑，entities.ts ITEMS 的 apply 写入 hero.weapon）、
 * 道具 id（ironSword / silverSword / knightSword / sacredSword / holySword）或含这些字样的字符串；
 * 空 / 未知 = 0 空手。旧存档缺少武器字段时由 state.deserialize 根据已拾取的剑补齐（见 deriveWeapon）。
 */
export function weaponTier(weapon: string | null | undefined): WeaponTier {
  if (!weapon) return 0;
  const w = String(weapon);
  for (const [tier, names] of TIER_ALIASES) if (names.some((n) => w === n || w.includes(n))) return tier;
  return 0;
}

export interface TierSpec {
  /** 特效时长（毫秒，标准速度） */
  dur: number;
  /** 粒子数（受全局上限约束） */
  particles: number;
  colors: string[];
  /** 震屏：时长 ms / 幅度（格宽的比例）。0–2 档 = 原有的战斗震屏（180ms / 0.04 格），之后逐档加强 */
  shake: [number, number];
  /** 屏幕闪光：时长 ms / 颜色 */
  flash: [number, string] | null;
}

export const TIERS: TierSpec[] = [
  { dur: 260, particles: 8, colors: ['#ffffff', '#f2ecff'], shake: [180, 0.04], flash: null },
  { dur: 300, particles: 10, colors: ['#ffe9a0', '#ffb347', '#ffffff'], shake: [180, 0.04], flash: null },
  { dur: 340, particles: 12, colors: ['#ffffff', '#9fe0ff', '#b8c8ff'], shake: [180, 0.04], flash: null },
  { dur: 360, particles: 14, colors: ['#9fd8ff', '#4f8dff', '#ffffff'], shake: [190, 0.045], flash: null },
  { dur: 400, particles: 18, colors: ['#fff3b0', '#ffd34a', '#ffb02e', '#ffffff'], shake: [210, 0.05], flash: [70, '255,236,160'] },
  { dur: 440, particles: 24, colors: ['#ff6b8a', '#ffb347', '#fff36b', '#7dff9a', '#6bd6ff', '#b58cff', '#ffffff'], shake: [250, 0.065], flash: [110, '255,250,230'] },
];

export interface SlashFx {
  kind: 'slash';
  tier: WeaponTier;
  /** 目标格 */
  x: number;
  y: number;
  dir: Dir;
  start: number;
  dur: number;
}

const DIR_ANGLE: Record<Dir, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const ease = (k: number) => 1 - (1 - k) ** 3;
const clamp01 = (k: number) => (k < 0 ? 0 : k > 1 ? 1 : k);

/** 弧形斩击：从 a0 扫到 a1，带渐隐尾巴（分段描边，越靠前越亮越粗） */
function arcSlash(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a0: number, a1: number,
  k: number, width: number, core: string, edge: string, trail = 0.55,
): void {
  const head = ease(clamp01(k / 0.6));
  const fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  if (fade <= 0) return;
  const segs = 7;
  const tail = Math.max(0, head - trail);
  for (let i = 0; i < segs; i++) {
    const s0 = tail + ((head - tail) * i) / segs;
    const s1 = tail + ((head - tail) * (i + 1)) / segs;
    const w = width * (0.35 + 0.65 * ((i + 1) / segs));
    const A0 = a0 + (a1 - a0) * s0;
    const A1 = a0 + (a1 - a0) * s1;
    ctx.globalAlpha = fade * (0.25 + 0.75 * ((i + 1) / segs));
    // 深色描边：浅色斩击在米黄色地板 / 怪物白闪上也清楚可见
    ctx.strokeStyle = 'rgba(42,27,61,0.55)';
    ctx.lineWidth = Math.round(w * 1.7) + 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, A0, A1, a1 < a0);
    ctx.stroke();
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.round(w * 1.7);
    ctx.beginPath();
    ctx.arc(cx, cy, r, A0, A1, a1 < a0);
    ctx.stroke();
    ctx.strokeStyle = core;
    ctx.lineWidth = Math.max(1, Math.round(w * 0.7));
    ctx.beginPath();
    ctx.arc(cx, cy, r, A0, A1, a1 < a0);
    ctx.stroke();
  }
}

/** 直线斩击（十字斩用）：从 p0 划向 p1 */
function lineSlash(
  ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number,
  k: number, width: number, core: string, edge: string,
): void {
  const head = ease(clamp01(k / 0.55));
  const fade = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
  if (fade <= 0) return;
  const tail = Math.max(0, head - 0.7);
  const ax = x0 + (x1 - x0) * tail, ay = y0 + (y1 - y0) * tail;
  const bx = x0 + (x1 - x0) * head, by = y0 + (y1 - y0) * head;
  ctx.globalAlpha = fade * 0.6;
  ctx.strokeStyle = 'rgba(42,27,61,0.8)';
  ctx.lineWidth = Math.round(width * 2.2) + 4;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.round(width * 2.2);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = core;
  ctx.lineWidth = Math.max(1, Math.round(width * 0.8));
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
}

/** 档位色光晕：小尺寸时也能一眼分出档位（铁橙 / 银青 / 骑士蓝 / 圣金） */
function aura(ctx: CanvasRenderingContext2D, r: number, rgb: string, k: number, max: number): void {
  const a = (k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75) * max;
  if (a <= 0) return;
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
}

/** 像素星形冲击（十字 + 斜角小点） */
function pixelStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, px: number, color: string, alpha: number): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const s = Math.max(1, Math.round(px * 2));
  for (let i = -r; i <= r; i += s) {
    ctx.fillRect(Math.round(cx + i - s / 2), Math.round(cy - s / 2), s, s);
    ctx.fillRect(Math.round(cx - s / 2), Math.round(cy + i - s / 2), s, s);
  }
  const d = Math.round(r * 0.55);
  for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) ctx.fillRect(Math.round(cx + dx * d - s / 2), Math.round(cy + dy * d - s / 2), s, s);
}

/** 绘制一个斩击特效；cx, cy = 目标格中心（画布像素），T = 格宽 */
export function drawSlash(ctx: CanvasRenderingContext2D, f: SlashFx, t: number, T: number, X: number, Y: number): void {
  const k = (t - f.start) / f.dur;
  if (k < 0 || k >= 1) return;
  const px = T / 32;
  const cx = 0, cy = 0;
  const base = DIR_ANGLE[f.dir];
  ctx.save();
  ctx.translate(Math.round(X), Math.round(Y));
  ctx.lineCap = 'butt';
  ctx.imageSmoothingEnabled = false;
  switch (f.tier) {
    case 0: {
      // 空手：带深色描边的白色冲击圈 + 星形拳印 + 4 条速度线
      const r = T * (0.15 + 0.42 * ease(k));
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = 'rgba(42,27,61,0.6)';
      ctx.lineWidth = Math.max(2, Math.round(px * 3 * (1 - k))) + 3;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, Math.round(px * 3 * (1 - k)));
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = Math.max(1, Math.round(px * 2));
      for (let i = 0; i < 4; i++) {
        const a = base + Math.PI + (i - 1.5) * 0.45;
        const r0 = T * (0.3 + 0.3 * k), r1 = r0 + T * 0.18;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      pixelStar(ctx, cx, cy, Math.round(T * 0.24 * (1 - k * 0.5)), px, '#ffffff', k < 0.5 ? 1 : 2 - k * 2);
      break;
    }
    case 1: {
      // 铁剑：一道钢灰色大弧斩 + 橙色火星
      aura(ctx, T * 0.62, '255,150,60', k, 0.22);
      arcSlash(ctx, cx - Math.cos(base) * T * 0.2, cy - Math.sin(base) * T * 0.2, T * 0.66, base - 1.25, base + 1.25, k, px * 5, '#ffffff', '#8f99b0', 0.75);
      if (k < 0.45) pixelStar(ctx, cx, cy, Math.round(T * 0.18), px, '#ffb347', 1 - k / 0.45);
      break;
    }
    case 2: {
      // 银剑：两道交错斩击（冷银青色）+ 四角闪光
      aura(ctx, T * 0.68, '150,220,255', k, 0.26);
      arcSlash(ctx, cx, cy - T * 0.1, T * 0.66, base - 1.4, base + 1.1, k, px * 5, '#ffffff', '#7fd0ff', 0.85);
      arcSlash(ctx, cx, cy + T * 0.1, T * 0.66, base + 1.4, base - 1.1, (k - 0.16) / 0.84, px * 5, '#ffffff', '#b8c8ff', 0.85);
      const g = clamp01((k - 0.25) / 0.6);
      if (g > 0 && g < 1) {
        for (const a of [base + 1.1, base - 1.1]) {
          pixelStar(ctx, Math.round(cx + Math.cos(a) * T * 0.66), Math.round(cy + Math.sin(a) * T * 0.66), Math.round(T * 0.14 * (1 - g * 0.5)), px, '#ffffff', 1 - g);
        }
      }
      break;
    }
    case 3: {
      // 骑士剑：十字斩（两道对角直线）+ 蓝色辉光
      const L = T * 0.7;
      aura(ctx, T * 0.8, '79,141,255', k, 0.42);
      lineSlash(ctx, cx - L, cy - L, cx + L, cy + L, k, px * 5, '#ffffff', '#3f86ff');
      lineSlash(ctx, cx + L, cy - L, cx - L, cy + L, (k - 0.14) / 0.86, px * 5, '#ffffff', '#3f86ff');
      if (k > 0.15 && k < 0.65) pixelStar(ctx, cx, cy, Math.round(T * 0.26), px, '#d6ecff', 1 - (k - 0.15) / 0.5);
      break;
    }
    case 4: {
      // 圣剑：金色光辉大斩 + 放射光芒 + 三道光柱
      const pill = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7;
      ctx.globalCompositeOperation = 'lighter';
      for (const [dx, w] of [[-0.32, 0.12], [0, 0.2], [0.32, 0.12]] as const) {
        ctx.globalAlpha = pill * (dx === 0 ? 0.55 : 0.35);
        ctx.fillStyle = '#ffd34a';
        const W = Math.round(T * w * (1 - k * 0.4));
        ctx.fillRect(Math.round(cx + dx * T - W / 2), Math.round(cy - T * 1.6), W, Math.round(T * 2.1));
        ctx.globalAlpha = pill * 0.7;
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect(Math.round(cx + dx * T - W / 6), Math.round(cy - T * 1.6), Math.max(1, Math.round(W / 3)), Math.round(T * 2.1));
      }
      ctx.globalCompositeOperation = 'source-over';
      // 放射光芒
      const ray = clamp01(k / 0.5);
      if (ray < 1) {
        ctx.globalAlpha = 1 - ray;
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = Math.round(px * 2);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          const r0 = T * (0.2 + 0.3 * ray), r1 = T * (0.35 + 0.45 * ray);
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
        }
      }
      aura(ctx, T * 0.85, '255,200,60', k, 0.35);
      arcSlash(ctx, cx - Math.cos(base) * T * 0.1, cy - Math.sin(base) * T * 0.1, T * 0.72, base - 1.6, base + 1.6, k, px * 6, '#fffbe0', '#ffb02e', 0.9);
      break;
    }
    default: {
      // 神圣剑：彩虹三连斩 + 旋转扩散的符文环 + 中心光爆
      const cols = TIERS[5].colors;
      // 光爆
      const b = clamp01(k / 0.35);
      if (b < 1) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - b) * 0.8;
        ctx.fillStyle = '#fffbe8';
        ctx.beginPath(); ctx.arc(cx, cy, T * (0.25 + 0.5 * b), 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      // 符文环：外圈 + 12 个像素符文，旋转扩散
      const ring = ease(clamp01(k / 0.8));
      const R = T * (0.4 + 0.8 * ring);
      ctx.globalAlpha = 1 - clamp01((k - 0.4) / 0.6);
      ctx.strokeStyle = '#ffe9a0';
      ctx.lineWidth = Math.max(1, Math.round(px * 2));
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#b58cff';
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2); ctx.stroke();
      const s = Math.max(1, Math.round(px * 2));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + k * 2.2;
        const gx = Math.round(cx + Math.cos(a) * R * 0.91);
        const gy = Math.round(cy + Math.sin(a) * R * 0.91);
        ctx.fillStyle = cols[i % 6];
        // 小符文：3 种像素图案
        const pat = i % 3;
        ctx.fillRect(gx - s, gy - s, s, s * (pat === 0 ? 3 : 2));
        ctx.fillRect(gx, gy - s, s * (pat === 1 ? 2 : 1), s);
        if (pat !== 1) ctx.fillRect(gx + s, gy, s, s);
      }
      // 三道彩虹斩
      for (let j = 0; j < 3; j++) {
        const kk = (k - j * 0.1) / (1 - j * 0.1);
        const off = (j - 1) * 0.9;
        arcSlash(ctx, cx, cy, T * (0.64 + j * 0.06), base + off - 1.5, base + off + 1.5, kk, px * 5, '#ffffff', cols[(j * 2) % 6], 0.85);
      }
      if (k < 0.5) pixelStar(ctx, cx, cy, Math.round(T * 0.26), px, '#ffffff', 1 - k * 2);
      break;
    }
  }
  ctx.restore();
}

/**
 * 自动清怪的武器特效节奏：一批中的每只怪依次播放「短版」武器特效，彼此错开这么多毫秒。
 * 「瞬移」更紧凑，但仍逐只可见。
 */
export const autoFxStep = (stepMs: number): number => (stepMs === 0 ? 60 : 100);
/** 一批最多错开到第几只（之后的同时播放，避免过长） */
export const AUTO_FX_MAX = 60;
