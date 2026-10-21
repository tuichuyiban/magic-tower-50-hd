import { ITEMS, itemEffect, itemValue, specialTags, type StatKind } from '../game/entities';
import { motion } from '../game/speed';
import { ghost48, GUARD48 } from '../game/variants';
import { zoneOf, ZONE_NAMES } from '../game/floors';
import type { Game, GameEvent, MonsterInfo } from '../game/state';
import { DIR_VEC, type Cell, type Dir, type Point } from '../game/types';
import { buildSprites, DOOR_GLOW, type SpriteSet } from './sprites';
import { AUTO_FX_MAX, autoFxStep, drawSlash, TIER_IDS, TIERS, weaponTier, type SlashFx, type WeaponTier } from './weaponFx';
import type { InventorySlot } from '../ui/inventory';

type C = HTMLCanvasElement;

const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC","Source Han Sans SC","WenQuanYi Micro Hei",sans-serif';

/** 画布布局（单位：格） */
const M = 0.15; // 外边距
const PANEL_W = 4.2;
const GAP = 0.3;
const FRAME = 0.22;
const UNITS_W = M + PANEL_W + GAP + FRAME * 2 + 11 + M;
const UNITS_H = M + FRAME * 2 + 11 + M;

type Fx =
  | { kind: 'text'; text: string; color: string; x: number; y: number; start: number; dur: number; size: number }
  | { kind: 'particle'; x: number; y: number; vx: number; vy: number; color: string; size: number; start: number; dur: number }
  | { kind: 'ghost'; img: C; white?: C; x: number; y: number; start: number; dur: number; mode: 'die' | 'rise' | 'door' | 'magnet'; tx?: number; ty?: number; size?: number }
  | SlashFx;
/** 同屏粒子上限（平板性能） */
const MAX_PARTICLES = 260;

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

const easeOut = (k: number) => 1 - (1 - k) * (1 - k);

export class Renderer {
  readonly sprites: SpriteSet = buildSprites();
  private ctx: CanvasRenderingContext2D;
  T = 32;
  private dpr = 1;
  private mapX = 0;
  private mapY = 0;
  private fx: Fx[] = [];
  private heroTween: { from: Point; to: Point; start: number } | null = null;
  private lunge: { dir: Dir; start: number; strong: boolean } | null = null;
  private shakeUntil = 0;
  /** 当前震屏幅度（格宽比例） */
  private shakeAmp = 0.04;
  /** 设置项：屏幕震动与闪光（默认开） */
  shakeFlash: () => boolean = () => true;
  /** 最近一次武器攻击特效（调试 / 测试用） */
  lastWeaponFx: { tier: WeaponTier; id: string; weapon: string | null; at: Point; t: number; skipped: boolean; brief: boolean; auto?: boolean } | null = null;
  /** 自动清怪播放过的武器特效（调试 / 测试用） */
  autoWeaponFx: { at: Point; tier: WeaponTier; start: number; dur: number }[] = [];
  private autoKill = { at: 0, n: 0 };
  /** 鼠标悬停 / 触摸点击查看的格子 */
  hover: Point | null = null;
  /** 瞬移（对称飞）预览：第一次使用时高亮落点，ok = 可以瞬移（绿）/ 被阻挡（红） */
  centerPreview: (Point & { ok: boolean }) | null = null;
  /** 自动寻路的剩余路径与终点（由 main 注入） */
  route: () => { path: Point[]; dest: Point | null } = () => ({ path: [], dest: null });
  /** 是否在地图上显示伤害 / 临界（原版需要怪物手册；可在设置中改为始终显示） */
  showDamage: () => boolean = () => true;
  /** 地图上的道具数值标签（设置项，默认开） */
  showItemValues: () => boolean = () => true;
  private flashUntil = 0;
  private flashDur = 160;
  private flashRgb = '255,255,255';
  private flashMax = 0.8;
  /** 状态栏数值高亮（商店 / 祭坛购买的轻量反馈）：stat → { 开始时间, 变化量 } */
  private statFx = new Map<string, { t: number; delta: number }>();
  flashStat(stat: string, delta: number): void {
    this.statFx.set(stat, { t: performance.now(), delta });
  }
  /** 背包：当前拥有的道具（由 main 注入）、页码、悬停 / 长按的格子 */
  inventory: () => InventorySlot[] = () => [];
  bagPage = 0;
  bagHover: number | null = null;
  private bagRects: Array<{ x: number; y: number; w: number; h: number; hit: BagHit }> = [];
  /** 同一批自动动作的特效依次错开播放 */
  private autoStagger = { at: 0, n: 0 };

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly game: Game,
  ) {
    this.ctx = canvas.getContext('2d')!;
    game.on((e) => this.onEvent(e));
  }

  /* ---------------------------------------------------------- 尺寸 */

  resize(cssW: number, cssH: number): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    const raw = Math.min((cssW * this.dpr) / UNITS_W, (cssH * this.dpr) / UNITS_H);
    this.T = snapTile(raw);
    const T = this.T;
    this.canvas.width = Math.round(UNITS_W * T);
    this.canvas.height = Math.round(UNITS_H * T);
    this.canvas.style.width = `${this.canvas.width / this.dpr}px`;
    this.canvas.style.height = `${this.canvas.height / this.dpr}px`;
    this.mapX = Math.round((M + PANEL_W + GAP + FRAME) * T);
    this.mapY = Math.round((M + FRAME) * T);
    this.ctx.imageSmoothingEnabled = false;
  }

  /** 地图格子中心 → 画布内 CSS 像素坐标（测试 / 调试用） */
  tileCenterCss(p: Point): { x: number; y: number } {
    return { x: (this.mapX + (p.x + 0.5) * this.T) / this.dpr, y: (this.mapY + (p.y + 0.5) * this.T) / this.dpr };
  }

  /** 当前地图区域的缩略图（存档用）：缩小后压缩为 WebP（不支持时 JPEG），约 5–15 KB */
  mapThumbnail(size = 128): string {
    this.draw(performance.now());
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(this.canvas, this.mapX, this.mapY, 11 * this.T, 11 * this.T, 0, 0, size, size);
    let url = cv.toDataURL('image/webp', 0.6);
    if (!url.startsWith('data:image/webp')) url = cv.toDataURL('image/jpeg', 0.6);
    return url;
  }

  /** CSS 像素坐标 → 地图格子坐标 */
  tileAt(cssX: number, cssY: number): Point | null {
    const x = Math.floor((cssX * this.dpr - this.mapX) / this.T);
    const y = Math.floor((cssY * this.dpr - this.mapY) / this.T);
    return this.game.inBounds({ x, y }) ? { x, y } : null;
  }

  /* ---------------------------------------------------------- 事件 → 特效 */

  private onEvent(e: GameEvent): void {
    const now = performance.now();
    switch (e.type) {
      case 'restart':
      case 'load':
      case 'floor':
        this.fx = [];
        this.heroTween = null;
        this.lunge = null;
        this.hover = null;
        break;
      case 'hit':
        this.flash(now, 160);
        this.shake(now, 220, 0.04);
        break;
      case 'move':
        this.heroTween = { from: e.from, to: e.to, start: now };
        break;
      case 'bump':
        this.lunge = { dir: e.dir, start: now, strong: false };
        break;
      case 'doorOpen': {
        if (e.kind === 'maze') {
          // 隐形墙显形 / 单向花丛封闭
          this.fx.push({ kind: 'ghost', img: this.sprites.wall[0], x: e.at.x, y: e.at.y, start: now, dur: 320, mode: 'rise' });
          this.burst(e.at, '#c9a6ff', 12, now);
          this.text('墙！', '#e0c8ff', e.at.x + 0.5, e.at.y + 0.1, now, 0.28);
          break;
        }
        const img = e.kind === 'hidden' ? this.sprites.wall[0] : e.kind === 'sealed' ? this.sprites.sealedWall : this.sprites.door[e.kind];
        this.fx.push({ kind: 'ghost', img, x: e.at.x, y: e.at.y, start: now, dur: 380, mode: 'door' });
        const glow = e.kind === 'hidden' || e.kind === 'sealed' ? '255,240,180' : DOOR_GLOW[e.kind];
        this.burst(e.at, `rgb(${glow})`, 14, now);
        if (e.kind === 'hidden') this.text('暗墙！', '#fff3b0', e.at.x + 0.5, e.at.y + 0.1, now, 0.28);
        break;
      }
      case 'pickup': {
        const def = ITEMS[e.item];
        if (e.auto) {
          // 自动拾取：道具「磁吸」飞向勇士（参照 h5 autoGet 插件）
          const d = this.stagger(now);
          const p = this.game.pos;
          this.fx.push({ kind: 'ghost', img: this.sprites.item[e.item], x: e.at.x, y: e.at.y, tx: p.x, ty: p.y, start: d, dur: 420, mode: 'magnet' });
          this.burst(e.at, '#fff6b0', 6, d);
          this.text(itemEffect(e.item, this.game.floor.ratio), def.color, p.x + 0.5, p.y - 0.2, d + 380, 0.24);
          break;
        }
        this.fx.push({ kind: 'ghost', img: this.sprites.item[e.item], x: e.at.x, y: e.at.y, start: now, dur: 520, mode: 'rise' });
        this.text(itemEffect(e.item, this.game.floor.ratio), def.color, e.at.x + 0.5, e.at.y, now);
        this.burst(e.at, '#fff6b0', 10, now);
        break;
      }
      case 'battle': {
        const s = this.sprites.monster[e.monster];
        const big = s.frames[0].width / 32;
        if (big > 1) {
          // 大型怪物：按 3×3 尺寸消散
          this.lunge = { dir: e.dir, start: now, strong: true };
          this.shake(now, 320, 0.04);
          this.weaponFx(e.at, e.dir, now);
          this.fx.push({ kind: 'ghost', img: s.frames[0], white: s.white[0], x: e.at.x - (big - 1) / 2, y: e.at.y - (big - 1), size: big, start: now, dur: 700, mode: 'die' });
          const p = this.game.pos;
          this.text(e.damage > 0 ? `-${e.damage}` : '无伤', e.damage > 0 ? '#ff5d6e' : '#8dffb0', p.x + 0.5, p.y, now, 0.42);
          this.text(`金币+${e.gold}`, '#ffe066', e.at.x + 0.5, e.at.y - 0.6, now + 120, 0.3);
          this.burst(e.at, '#ffffff', 24, now);
          break;
        }
        if (e.auto) {
          // 自动清怪（仅 0 伤害）：勇士不移动；每只怪依次在原格播放当前武器的短版攻击特效，随后消散
          const d = this.autoKillDelay(now);
          this.weaponFx(e.at, e.dir, d, 'auto');
          this.fx.push({ kind: 'ghost', img: s.frames[0], white: s.white[0], x: e.at.x, y: e.at.y, start: d, dur: 420, mode: 'die' });
          this.text(`金币+${e.gold}`, '#ffe066', e.at.x + 0.5, e.at.y + 0.2, d + 80, 0.24);
          break;
        }
        this.lunge = { dir: e.dir, start: now, strong: true };
        this.fx.push({ kind: 'ghost', img: s.frames[0], white: s.white[0], x: e.at.x, y: e.at.y, start: now, dur: 460, mode: 'die' });
        const p = this.game.pos;
        this.text(e.damage > 0 ? `-${e.damage}` : '无伤', e.damage > 0 ? '#ff5d6e' : '#8dffb0', p.x + 0.5, p.y, now, 0.42);
        this.text(`金币+${e.gold}`, '#ffe066', e.at.x + 0.5, e.at.y + 0.2, now + 120, 0.26);
        if (!this.weaponFx(e.at, e.dir, now)) {
          this.shake(now, 180, 0.04);
          this.burst(e.at, '#ffffff', 16, now);
        }
        break;
      }
      case 'mapDamage': {
        const p = this.game.pos;
        this.flash(now, 140);
        this.text(`-${e.damage}`, '#d58cff', p.x + 0.5, p.y, now, 0.4);
        this.text(e.kind || '魔法', '#e8c8ff', p.x + 0.5, p.y + 0.45, now + 60, 0.22);
        this.burst(p, '#c677dd', 12, now);
        break;
      }
      case 'death':
        this.shake(now, 500, 0.04);
        this.flash(now, 300);
        break;
      case 'itemFx': {
        const color = e.item === 'snow' ? '#bff3ff' : e.item === 'bomb' ? '#ffb03b' : e.item === 'centerFly' ? '#c9a6ff' : '#e0b080';
        if (e.item === 'earthquake' || e.item === 'bomb') this.shake(now, e.item === 'earthquake' ? 600 : 300, 0.04);
        e.cells.forEach((c, i) => this.burst(c, color, e.item === 'earthquake' ? 6 : 18, now + (e.item === 'earthquake' ? i * 8 : 0)));
        break;
      }
      case 'blocked':
        this.lunge = { dir: dirTo(this.game.pos, e.at), start: now, strong: false };
        this.text(e.text, '#ff6070', e.at.x + 0.5, e.at.y + 0.1, now, 0.3);
        break;
      case 'stairs':
        this.burst(e.at, '#fff2a8', 24, now);
        break;
    }
  }

  private shake(now: number, ms: number, amp: number): void {
    if (!this.shakeFlash() || ms <= 0) return;
    this.shakeAmp = now < this.shakeUntil ? Math.max(this.shakeAmp, amp) : amp;
    this.shakeUntil = Math.max(this.shakeUntil, now + ms);
  }

  private flash(now: number, ms: number, rgb = '255,255,255', max = 0.8): void {
    if (!this.shakeFlash()) return;
    this.flashUntil = now + ms;
    this.flashDur = ms;
    this.flashRgb = rgb;
    this.flashMax = max;
  }

  /**
   * 手动战斗的武器攻击特效（见 weaponFx.ts）。所有速度都播放；「瞬移」为简短版。
   * 特效不阻塞任何流程，时长都在怪物消散动画（460ms）之内。
   */
  private weaponFx(at: Point, dir: Dir, now: number, mode: 'manual' | 'auto' = 'manual'): boolean {
    const weapon = this.game.hero.weapon;
    const tier = weaponTier(weapon);
    const auto = mode === 'auto';
    const brief = auto || motion.stepMs === 0;
    this.lastWeaponFx = { tier, id: TIER_IDS[tier], weapon, at: { ...at }, t: now, skipped: false, brief, auto };
    const spec = TIERS[tier];
    // 自动清怪：短版（约 60% 时长、三分之一粒子、不闪屏，只在每批第一只轻震一下）
    const dur = Math.round(spec.dur * (brief ? 0.6 : 1));
    this.fx.push({ kind: 'slash', tier, x: at.x, y: at.y, dir, start: now, dur });
    if (auto) {
      this.autoWeaponFx.push({ at: { ...at }, tier, start: now, dur });
      if (this.autoWeaponFx.length > 200) this.autoWeaponFx.splice(0, this.autoWeaponFx.length - 200);
      if (this.autoKill.n === 1) this.shake(now, 120, 0.025);
    } else if (brief) this.shake(now, 180, 0.04);
    else {
      this.shake(now, spec.shake[0], spec.shake[1]);
      if (spec.flash) this.flash(now, spec.flash[0], spec.flash[1], tier === 5 ? 0.45 : 0.3);
    }
    // 粒子：按档位着色；圣剑 / 神圣剑的光粒向上飘
    const n = auto ? Math.ceil(spec.particles / 3) : brief ? Math.ceil(spec.particles / 2) : spec.particles;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const sp = (tier >= 4 ? 1.0 : 1.3) + Math.random() * (0.8 + tier * 0.25);
      this.particle({
        kind: 'particle',
        x: at.x + 0.5,
        y: at.y + 0.5,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (tier >= 4 ? 1.8 : 0.8),
        color: spec.colors[i % spec.colors.length],
        size: tier >= 3 && i % 4 === 0 ? 4 : Math.random() < 0.5 ? 2 : 3,
        start: now + (tier >= 4 ? (i % 3) * 40 : 0),
        dur: 380 + Math.random() * 220,
      });
    }
    return true;
  }

  private particle(p: Extract<Fx, { kind: 'particle' }>): void {
    let n = 0;
    for (const f of this.fx) if (f.kind === 'particle') n++;
    if (n < MAX_PARTICLES) this.fx.push(p);
  }

  /** 自动清怪：同一批（同步执行）中的第 n 只怪在 now + n × 步长 时播放 */
  private autoKillDelay(now: number): number {
    if (now - this.autoKill.at > 30) this.autoKill = { at: now, n: 0 };
    return this.autoKill.at + Math.min(this.autoKill.n++, AUTO_FX_MAX) * autoFxStep(motion.stepMs);
  }

  private stagger(now: number): number {
    if (now - this.autoStagger.at > 30) this.autoStagger = { at: now, n: 0 };
    return now + Math.min(this.autoStagger.n++, 12) * 70;
  }

  /**
   * 渲染任意楼层（按其当前状态）的地图预览，用于楼层传送器。
   * 只画地形与物件（以及勇士所在楼层的勇士），不画特效 / 伤害数字。
   */
  floorPreview(floorId: number, tile = 48): HTMLCanvasElement {
    const g = this.game;
    const n = g.floors[floorId].length;
    const cv = document.createElement('canvas');
    cv.width = cv.height = n * tile;
    const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    const saved = { ctx: this.ctx, T: this.T, mapX: this.mapX, mapY: this.mapY, floorId: g.floorId, actors: g.actors, hover: this.hover, showDamage: this.showDamage, tween: this.heroTween, lunge: this.lunge };
    try {
      this.ctx = c;
      this.T = tile;
      this.mapX = this.mapY = 0;
      this.hover = null;
      this.heroTween = null;
      this.lunge = null;
      this.showDamage = () => false;
      const here = floorId === g.floorId;
      g.floorId = floorId;
      if (!here) g.actors = [];
      const t = performance.now();
      this.drawTerrain();
      this.drawObjects(t);
      if (here) this.drawHero(t);
    } finally {
      this.ctx = saved.ctx;
      this.T = saved.T;
      this.mapX = saved.mapX;
      this.mapY = saved.mapY;
      g.floorId = saved.floorId;
      g.actors = saved.actors;
      this.hover = saved.hover;
      this.showDamage = saved.showDamage;
      this.heroTween = saved.tween;
      this.lunge = saved.lunge;
    }
    return cv;
  }

  /** 外部调用的提示飘字（如"无法到达"） */
  notice(text: string, at: Point, color = '#ffe066'): void {
    this.text(text, color, at.x + 0.5, at.y + 0.1, performance.now(), 0.26);
  }

  private text(text: string, color: string, x: number, y: number, start: number, size = 0.3): void {
    this.fx.push({ kind: 'text', text, color, x, y, start, dur: 1000, size });
  }

  private burst(at: Point, color: string, n: number, now: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const sp = 1.2 + Math.random() * 1.6;
      this.particle({
        kind: 'particle',
        x: at.x + 0.5,
        y: at.y + 0.5,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.8,
        color,
        size: Math.random() < 0.5 ? 2 : 3,
        start: now,
        dur: 450 + Math.random() * 250,
      });
    }
  }

  /* ---------------------------------------------------------- 主绘制 */

  draw(t: number): void {
    const { ctx, canvas, T } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    this.drawPanel(t);

    let sx = 0;
    let sy = 0;
    if (t < this.shakeUntil) {
      const a = Math.max(1, Math.round(T * this.shakeAmp));
      sx = Math.round((Math.random() - 0.5) * a * 2);
      sy = Math.round((Math.random() - 0.5) * a * 2);
    }
    ctx.save();
    ctx.translate(sx, sy);
    this.drawMapFrame();
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.mapX, this.mapY, 11 * T, 11 * T);
    ctx.clip();
    this.drawTerrain();
    this.drawRoute(t);
    this.drawObjects(t);
    this.drawHero(t);
    this.drawHover(t);
    this.drawCenterPreview(t);
    this.drawFx(t);
    this.drawMonsterTip();
    if (t < this.flashUntil) {
      ctx.fillStyle = `rgba(${this.flashRgb},${((this.flashUntil - t) / this.flashDur) * this.flashMax})`;
      ctx.fillRect(this.mapX, this.mapY, 11 * T, 11 * T);
    }
    ctx.restore();
    ctx.restore();
  }

  private tx(x: number) {
    return this.mapX + x * this.T;
  }
  private ty(y: number) {
    return this.mapY + y * this.T;
  }
  private get px() {
    return this.T / 32;
  }

  private drawMapFrame(): void {
    const { ctx, T } = this;
    const f = Math.round(FRAME * T);
    const x = this.mapX - f;
    const y = this.mapY - f;
    const w = 11 * T + f * 2;
    const p = Math.max(1, Math.round(this.px));
    const g = ctx.createLinearGradient(0, y, 0, y + w);
    g.addColorStop(0, '#ffe58a');
    g.addColorStop(0.5, '#f0b437');
    g.addColorStop(1, '#d48a1e');
    ctx.fillStyle = '#2a1b3d';
    ctx.fillRect(x - p * 2, y - p * 2, w + p * 4, w + p * 4);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, w);
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x + p * 2, y + p * 2, w - p * 4, p);
    ctx.fillStyle = '#9c5a12';
    ctx.fillRect(x + f - p * 2, y + f - p * 2, w - f * 2 + p * 4, w - f * 2 + p * 4);
    // 四角宝石
    for (const [cx, cy] of [
      [x + f / 2, y + f / 2],
      [x + w - f / 2, y + f / 2],
      [x + f / 2, y + w - f / 2],
      [x + w - f / 2, y + w - f / 2],
    ]) {
      const r = f * 0.42;
      diamond(ctx, cx, cy, r + p * 2, '#2a1b3d');
      diamond(ctx, cx, cy, r, '#ff4d6d');
      diamond(ctx, cx - r * 0.25, cy - r * 0.25, r * 0.35, '#ffd0da');
    }
    // 边框中段的小铆钉
    ctx.fillStyle = '#fff1a6';
    for (let i = 1; i < 11; i++) {
      const m = this.mapX + i * T;
      ctx.fillRect(m - p, y + f / 2 - p, p * 2, p * 2);
      ctx.fillRect(m - p, y + w - f / 2 - p, p * 2, p * 2);
      ctx.fillRect(x + f / 2 - p, this.mapY + i * T - p, p * 2, p * 2);
      ctx.fillRect(x + w - f / 2 - p, this.mapY + i * T - p, p * 2, p * 2);
    }
  }

  private drawTerrain(): void {
    const { ctx, T, game } = this;
    const n = game.size;
    const S = this.sprites;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const c = game.grid[y][x];
        const h = hash(x, y);
        if (c.terrain === 'wall' || c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2' || c.terrain === 'solidWall') {
          const v = h % 7 === 0 ? 1 : h % 9 === 4 ? 2 : 0;
          ctx.drawImage(S.wall[v], this.tx(x), this.ty(y), T, T);
          // 暗墙：比普通墙略暗一点，并有几道细微的裂纹（仔细看才能分辨）
          if (c.terrain === 'hiddenWall') {
            const q = Math.max(1, Math.round(T / 32));
            ctx.fillStyle = 'rgba(40,24,80,0.16)';
            ctx.fillRect(this.tx(x), this.ty(y), T, T);
            ctx.fillStyle = 'rgba(40,24,80,0.22)';
            for (const [a, b] of [[9, 7], [10, 8], [11, 9], [11, 10], [20, 18], [21, 19], [22, 19], [23, 20], [14, 24], [15, 25]]) ctx.fillRect(this.tx(x) + a * q, this.ty(y) + b * q, q, q);
          }
        } else if (c.terrain === 'lava') {
          const lf = S.lava.frames;
          ctx.drawImage(lf[Math.floor((performance.now() + h * 37) / S.lava.frameMs) % lf.length], this.tx(x), this.ty(y), T, T);
        } else if (c.terrain === 'star') {
          const sf = S.star.frames;
          ctx.drawImage(sf[Math.floor((performance.now() + h * 53) / S.star.frameMs) % sf.length], this.tx(x), this.ty(y), T, T);
        } else if (c.terrain === 'sealedWall') {
          ctx.drawImage(S.sealedWall, this.tx(x), this.ty(y), T, T);
        } else if (c.terrain === 'stairsUp') {
          ctx.drawImage(S.stairsUp, this.tx(x), this.ty(y), T, T);
        } else if (c.terrain === 'stairsDown') {
          ctx.drawImage(S.stairsDown, this.tx(x), this.ty(y), T, T);
        } else {
          ctx.drawImage(S.floor[h % S.floor.length], this.tx(x), this.ty(y), T, T);
        }
      }
    }
    // 墙体投影与金色饰边
    const p = Math.max(1, Math.round(this.px));
    const isWall = (x: number, y: number) => game.inBounds({ x, y }) && isWallLike(game.grid[y][x]);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (isWall(x, y)) continue;
        if (isWall(x, y - 1)) {
          const g = ctx.createLinearGradient(0, this.ty(y), 0, this.ty(y) + T * 0.22);
          g.addColorStop(0, 'rgba(70,40,90,0.30)');
          g.addColorStop(1, 'rgba(70,40,90,0)');
          ctx.fillStyle = g;
          ctx.fillRect(this.tx(x), this.ty(y), T, T * 0.22);
        }
        if (isWall(x - 1, y)) {
          ctx.fillStyle = 'rgba(70,40,90,0.14)';
          ctx.fillRect(this.tx(x), this.ty(y), p * 3, T);
        }
      }
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!isWall(x, y)) continue;
        const X = this.tx(x);
        const Y = this.ty(y);
        if (y + 1 < n && !isWall(x, y + 1)) {
          ctx.fillStyle = '#c47c16';
          ctx.fillRect(X, Y + T - p * 3, T, p * 3);
          ctx.fillStyle = GOLD;
          ctx.fillRect(X, Y + T - p * 3, T, p * 2);
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(X, Y + T - p * 3, T, p);
        }
        if (y > 0 && !isWall(x, y - 1)) {
          ctx.fillStyle = GOLD;
          ctx.fillRect(X, Y, T, p * 2);
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(X, Y, T, p);
        }
        if (x > 0 && !isWall(x - 1, y)) {
          ctx.fillStyle = GOLD;
          ctx.fillRect(X, Y, p * 2, T);
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(X, Y, p, T);
        }
        if (x + 1 < n && !isWall(x + 1, y)) {
          ctx.fillStyle = '#c47c16';
          ctx.fillRect(X + T - p * 2, Y, p * 2, T);
          ctx.fillStyle = GOLD;
          ctx.fillRect(X + T - p * 2, Y, p, T);
        }
      }
    }
  }

  private drawRoute(t: number): void {
    const { path, dest } = this.route();
    if (!dest) return;
    const { ctx, T } = this;
    const p = Math.max(1, Math.round(this.px));
    ctx.save();
    // 路径提示：每格中心一个小菱形光点
    for (const q of path) {
      if (q.x === dest.x && q.y === dest.y) continue;
      const cx = this.tx(q.x) + T / 2;
      const cy = this.ty(q.y) + T / 2;
      ctx.globalAlpha = 0.7;
      diamond(ctx, cx, cy, p * 4, '#2a1b3d');
      diamond(ctx, cx, cy, p * 3, '#fff3b0');
    }
    // 终点标记：脉动的金色圆环
    const k = 0.5 + 0.5 * Math.sin(t / 140);
    const cx = this.tx(dest.x) + T / 2;
    const cy = this.ty(dest.y) + T * 0.62;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = p * 2;
    ctx.strokeStyle = '#2a1b3d';
    ctx.beginPath();
    ctx.ellipse(cx, cy, T * (0.3 + 0.04 * k), T * (0.16 + 0.02 * k), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = p;
    ctx.strokeStyle = '#ffd34a';
    ctx.stroke();
    ctx.restore();
  }

  private shadow(x: number, y: number, w = 0.62, alpha = 0.22): void {
    const { ctx, T } = this;
    ctx.fillStyle = `rgba(80,45,40,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(this.tx(x) + T / 2, this.ty(y) + T * 0.88, (T * w) / 2, T * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawObjects(t: number): void {
    const { ctx, T, game } = this;
    const S = this.sprites;
    const n = game.size;
    const px = this.px;
    const dmg = game.mapDamage();
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const c = game.grid[y][x];
        const X = this.tx(x);
        const Y = this.ty(y);
        const phase = hash(x, y) % 1000;
        if (c.door) {
          const pulse = 0.5 + 0.5 * Math.sin(t / 420 + phase);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(X + T / 2, Y + T * 0.6, T * 0.1, X + T / 2, Y + T * 0.6, T * 0.75);
          g.addColorStop(0, `rgba(${DOOR_GLOW[c.door]},${0.32 + 0.22 * pulse})`);
          g.addColorStop(1, `rgba(${DOOR_GLOW[c.door]},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(X - T * 0.3, Y - T * 0.2, T * 1.6, T * 1.4);
          ctx.restore();
          ctx.drawImage(S.door[c.door], X, Y, T, T);
          // 门上流光
          const k = ((t + phase * 5) % 2600) / 2600;
          if (k < 0.3) {
            const sxp = X + T * (0.15 + k * 2.4);
            ctx.save();
            ctx.globalAlpha = 0.5 * Math.sin((k / 0.3) * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(sxp), Y + T * 0.4, Math.round(px * 2), T * 0.5);
            ctx.restore();
          }
        }
        if (c.item) {
          const bob = Math.round(Math.sin(t / 380 + phase) * 1.5) * px;
          this.shadow(x, y, 0.5 - bob / T, 0.2);
          const pad = T * 0.08;
          ctx.drawImage(S.item[c.item], X + pad, Y + pad - px * 2 + bob, T - pad * 2, T - pad * 2);
          this.sparkle(X, Y, t, phase);
          if (this.showItemValues()) this.drawItemTag(c.item, x, y);
        }
        if (c.terrain === 'altarL' || c.terrain === 'altarR') {
          const a = c.terrain === 'altarL' ? S.altarL : S.altarR;
          ctx.drawImage(a.frames[Math.floor(t / a.frameMs) % a.frames.length], X, Y, T, T);
        }
        if (c.npc) this.drawNpc(c.npc, x, y, t, phase);
        if (!c.monster && dmg.any && this.showDamage()) {
          const v = dmg.damage[y][x];
          if (v > 0 && c.terrain === 'floor') this.drawMapDamage(x, y, v, dmg.kinds[y][x]);
        }
        if (c.monster) {
          this.drawMonster(c.monster, x, y, t, phase);
          if (this.showDamage()) this.drawDamageTag(x, y);
        }
        if (c.terrain === 'airwall' && x === GUARD48.x && y === GUARD48.y && ghost48(game)) this.drawGhost48(x, y, t);
      }
    }
    // 剧情中行走的角色（平滑插值）
    for (const a of game.actors) {
      const k = Math.min(1, Math.max(0, (t - a.t0) / a.dur));
      const ax = a.from.x + (a.pos.x - a.from.x) * k;
      const ay = a.from.y + (a.pos.y - a.from.y) * k;
      if (a.monster) this.drawMonster(a.monster, ax, ay, t, a.id * 97);
      if (a.npc) this.drawNpc(a.npc, ax, ay, t, a.id * 97);
    }
  }

  /** 48F 上古版变体：隐藏的白衣武士显示为半透明、闪动的残影（不是隐形，也不是普通怪物） */
  private drawGhost48(x: number, y: number, t: number): void {
    const { ctx, T } = this;
    const a = this.sprites.monster.whiteKing;
    const img = ghostTint(a.frames[Math.floor(t / (a.frameMs * 1.6)) % a.frames.length]);
    const X = this.tx(x);
    const Y = this.ty(y);
    const px = T / 32;
    const breathe = 0.5 + 0.5 * Math.sin(t / 650);
    ctx.save();
    // 冷色微光
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(X + T / 2, Y + T * 0.55, T * 0.05, X + T / 2, Y + T * 0.55, T * 0.6);
    g.addColorStop(0, `rgba(150,210,255,${0.10 + 0.08 * breathe})`);
    g.addColorStop(1, 'rgba(150,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(X - T * 0.1, Y - T * 0.1, T * 1.2, T * 1.2);
    ctx.globalCompositeOperation = 'source-over';
    // 横向切片轻微错位 = 闪动的残影
    const strips = 8;
    const sh = img.height / strips;
    const dh = T / strips;
    for (let i = 0; i < strips; i++) {
      const off = Math.round(Math.sin(t / 140 + i * 1.3) * 1.2 * (0.4 + breathe)) * px;
      ctx.globalAlpha = 0.34 + 0.16 * breathe + 0.06 * Math.sin(t / 90 + i);
      ctx.drawImage(img, 0, i * sh, img.width, sh, Math.round(X + off), Math.round(Y + i * dh - px * 2 * breathe), T, Math.ceil(dh));
    }
    // 第二道淡淡的余像
    ctx.globalAlpha = 0.12 + 0.08 * breathe;
    ctx.drawImage(img, Math.round(X + px * 2 * Math.sin(t / 400)), Math.round(Y - px * 3), T, T);
    ctx.restore();
  }

  private drawMonster(id: NonNullable<Cell['monster']>, x: number, y: number, t: number, phase: number): void {
    const a = this.sprites.monster[id];
    const fi = Math.floor((t + phase * 3) / a.frameMs) % a.frames.length;
    const blink = (t + phase * 7) % 3400 < 150;
    const img = blink ? a.blink[fi] : a.frames[fi];
    if (img.width > 32) {
      // 大型怪物（大乌贼 3×3，原版 bigImage）：以所在格为底边中心绘制
      const k = img.width / 32;
      const { T } = this;
      this.ctx.save();
      this.ctx.globalAlpha = 0.28;
      this.ctx.fillStyle = '#1a0f2e';
      this.ctx.beginPath();
      this.ctx.ellipse(this.tx(x) + T / 2, this.ty(y) + T * 0.86, T * k * 0.42, T * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.drawImage(img, Math.round(this.tx(x - (k - 1) / 2)), Math.round(this.ty(y - (k - 1))), T * k, T * k);
      return;
    }
    const flying = id === 'bat' || id === 'bigBat' || id === 'slimeMan';
    this.shadow(x, y, flying ? 0.4 : 0.7, flying ? 0.14 : 0.24);
    this.ctx.drawImage(img, Math.round(this.tx(x)), Math.round(this.ty(y)), this.T, this.T);
  }

  private drawNpc(id: NonNullable<Cell['npc']>, x: number, y: number, t: number, phase: number): void {
    const a = this.sprites.npc[id];
    const fi = Math.floor((t + phase * 3) / a.frameMs) % a.frames.length;
    const blink = (t + phase * 7) % 3600 < 150;
    if (id !== 'altar') this.shadow(x, y, 0.66, 0.22);
    const X = Math.round(this.tx(x));
    const Y = Math.round(this.ty(y));
    this.ctx.drawImage(blink ? a.blink[fi] : a.frames[fi], X, Y, this.T, this.T);
    // 可对话提示：头顶跳动的小气泡
    if (id === 'oldman' || id === 'trader' || id === 'blessTrader' || id === 'thief' || id === 'altar' || id === 'specialTrader') {
      const { ctx, T } = this;
      const p = Math.max(1, Math.round(this.px));
      const bob = Math.round(Math.sin(t / 260 + phase) * 1.5) * p;
      const bx = X + T * 0.78;
      const by = Y + T * 0.06 + bob;
      ctx.fillStyle = '#2a1b3d';
      ctx.fillRect(bx - p * 4, by - p * 3, p * 8, p * 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - p * 3, by - p * 2, p * 6, p * 4);
      ctx.fillStyle = '#2a1b3d';
      ctx.fillRect(bx - p * 2, by - p * 0.5, p, p);
      ctx.fillRect(bx - p * 0.5, by - p * 0.5, p, p);
      ctx.fillRect(bx + p, by - p * 0.5, p, p);
    }
  }

  private sparkle(X: number, Y: number, t: number, phase: number): void {
    const k = ((t + phase * 11) % 1900) / 1900;
    if (k > 0.22) return;
    const { ctx, T } = this;
    const p = Math.max(1, Math.round(this.px));
    const s = Math.sin((k / 0.22) * Math.PI);
    const cx = Math.round(X + T * (0.25 + ((phase % 7) / 7) * 0.5));
    const cy = Math.round(Y + T * (0.2 + ((phase % 5) / 5) * 0.35));
    const len = Math.max(1, Math.round(s * 3)) * p;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - len, cy, len * 2 + p, p);
    ctx.fillRect(cx, cy - len, p, len * 2 + p);
  }

  /** 道具数值标签：与怪物伤害数字同样的位置和描边，按属性着色（攻击红、防御蓝、生命绿） */
  private drawItemTag(item: Parameters<typeof itemValue>[0], x: number, y: number): void {
    const v = itemValue(item, this.game.floor.ratio);
    if (!v) return;
    const { ctx, T } = this;
    const size = Math.round(T * 0.24);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const X = this.tx(x) + T * 0.05;
    const Y = this.ty(y) + T * 0.97;
    ctx.lineWidth = Math.max(2, size * 0.22);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a1b3d';
    const text = `+${v.v}`;
    ctx.strokeText(text, X, Y);
    ctx.fillStyle = STAT_COLORS[v.stat];
    ctx.fillText(text, X, Y);
  }

  /** 领域 / 夹击格子上的地图伤害数字（与样板相同：画在格子底部，紫色） */
  private drawMapDamage(x: number, y: number, v: number, kind: string): void {
    const { ctx, T } = this;
    const size = Math.round(T * 0.22);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = kind.includes('夹击') ? '#bb99ee' : '#c677dd';
    ctx.fillRect(this.tx(x), this.ty(y), T, T);
    ctx.restore();
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const X = this.tx(x) + T * 0.05;
    const Y = this.ty(y) + T * 0.97;
    ctx.lineWidth = Math.max(2, size * 0.22);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a1b3d';
    const text = String(v);
    ctx.strokeText(text, X, Y);
    ctx.fillStyle = v >= this.game.hero.hp ? '#ff4d5e' : '#e0a6ff';
    ctx.fillText(text, X, Y);
  }

  private drawDamageTag(x: number, y: number): void {
    const info = this.game.monsterInfoAt({ x, y });
    if (!info) return;
    const { text, color } = damageLabel(info, this.game.hero.hp);
    const { ctx, T } = this;
    const size = Math.round(T * 0.24);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const X = this.tx(x) + T * 0.05;
    const Y = this.ty(y) + T * 0.97;
    ctx.lineWidth = Math.max(2, size * 0.22);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a1b3d';
    ctx.strokeText(text, X, Y);
    ctx.fillStyle = color;
    ctx.fillText(text, X, Y);
    // 临界值（样板中绘制在伤害数字上方一行，白色）
    const crit = info.critical.atk;
    if (crit > 0) {
      const cs = Math.round(T * 0.2);
      ctx.font = `900 ${cs}px ${FONT}`;
      const cy = Y - size * 0.98;
      ctx.lineWidth = Math.max(2, cs * 0.24);
      ctx.strokeStyle = '#2a1b3d';
      ctx.strokeText(String(crit), X, cy);
      ctx.fillStyle = info.critical.broken ? '#ffffff' : '#ffd0d6';
      ctx.fillText(String(crit), X, cy);
    }
  }

  private heroDrawPos(t: number): { x: number; y: number; hop: number } {
    const p = this.game.pos;
    let x = p.x;
    let y = p.y;
    let hop = 0;
    if (this.heroTween) {
      const k = motion.tweenMs > 0 ? Math.min(1, (t - this.heroTween.start) / motion.tweenMs) : 1;
      const { from, to } = this.heroTween;
      const e = easeOut(Math.max(0, k));
      x = from.x + (to.x - from.x) * e;
      y = from.y + (to.y - from.y) * e;
      hop = Math.sin(Math.max(0, k) * Math.PI) * 0.06;
      if (k >= 1) this.heroTween = null;
    }
    if (this.lunge) {
      const dur = this.lunge.strong ? 200 : 140;
      const k = (t - this.lunge.start) / dur;
      if (k >= 1 || k < 0) this.lunge = null;
      else {
        const amt = Math.sin(k * Math.PI) * (this.lunge.strong ? 0.28 : 0.1);
        const v = DIR_VEC[this.lunge.dir];
        x += v.x * amt;
        y += v.y * amt;
      }
    }
    return { x, y, hop };
  }

  private drawHero(t: number): void {
    const { ctx, T } = this;
    const { x, y, hop } = this.heroDrawPos(t);
    const g = this.game;
    const a = g.facing === 'left' ? this.sprites.hero.left : this.sprites.hero.right;
    const fi = Math.floor(t / a.frameMs) % a.frames.length;
    const blink = t % 3800 < 140;
    const X = Math.round(this.mapX + x * T);
    const Y = Math.round(this.mapY + (y - hop) * T);
    // 脚下光圈
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t / 300);
    ctx.strokeStyle = '#fff3a0';
    ctx.lineWidth = Math.max(1, this.px * 1.5);
    ctx.beginPath();
    ctx.ellipse(this.mapX + x * T + T / 2, this.mapY + y * T + T * 0.88, T * 0.36, T * 0.11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(80,45,40,0.25)';
    ctx.beginPath();
    ctx.ellipse(this.mapX + x * T + T / 2, this.mapY + y * T + T * 0.88, T * 0.3, T * 0.085, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(blink ? a.blink[fi] : a.frames[fi], X, Y, T, T);
  }

  private drawCenterPreview(t: number): void {
    const c = this.centerPreview;
    if (!c) return;
    const { ctx, T } = this;
    const p = Math.max(2, Math.round(this.px * 2));
    const X = this.tx(c.x);
    const Y = this.ty(c.y);
    const col = c.ok ? '#3ee07a' : '#ff4d4d';
    const pulse = 0.5 + 0.5 * Math.sin(t / 140);
    ctx.save();
    ctx.globalAlpha = 0.28 + 0.18 * pulse;
    ctx.fillStyle = col;
    ctx.fillRect(X, Y, T, T);
    ctx.globalAlpha = 0.85 + 0.15 * pulse;
    ctx.strokeStyle = col;
    ctx.lineWidth = p * 1.5;
    ctx.strokeRect(X + p, Y + p, T - 2 * p, T - 2 * p);
    // 落点标记：可以 = 对勾，阻挡 = 叉
    ctx.lineWidth = p * 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (c.ok) {
      ctx.moveTo(X + T * 0.3, Y + T * 0.52);
      ctx.lineTo(X + T * 0.45, Y + T * 0.67);
      ctx.lineTo(X + T * 0.72, Y + T * 0.36);
    } else {
      ctx.moveTo(X + T * 0.32, Y + T * 0.32);
      ctx.lineTo(X + T * 0.68, Y + T * 0.68);
      ctx.moveTo(X + T * 0.68, Y + T * 0.32);
      ctx.lineTo(X + T * 0.32, Y + T * 0.68);
    }
    ctx.stroke();
    // 勇士脚下一圈同色虚线，表示「从这里对称飞过去」
    const hx = this.tx(this.game.pos.x);
    const hy = this.ty(this.game.pos.y);
    ctx.globalAlpha = 0.8;
    ctx.setLineDash([p * 2, p * 2]);
    ctx.lineWidth = p;
    ctx.strokeRect(hx + p / 2, hy + p / 2, T - p, T - p);
    ctx.restore();
  }

  private drawHover(t: number): void {
    const h = this.hover;
    if (!h) return;
    const { ctx, T } = this;
    const p = Math.max(2, Math.round(this.px * 2));
    const X = this.tx(h.x);
    const Y = this.ty(h.y);
    ctx.save();
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t / 160);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = p;
    const L = T * 0.28;
    ctx.beginPath();
    for (const [cx, cy, dx, dy] of [
      [X, Y, 1, 1],
      [X + T, Y, -1, 1],
      [X, Y + T, 1, -1],
      [X + T, Y + T, -1, -1],
    ]) {
      ctx.moveTo(cx + (dx * p) / 2, cy + dy * L);
      ctx.lineTo(cx + (dx * p) / 2, cy + (dy * p) / 2);
      ctx.lineTo(cx + dx * L, cy + (dy * p) / 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawFx(t: number): void {
    const { ctx, T } = this;
    const px = Math.max(1, Math.round(this.px));
    this.fx = this.fx.filter((f) => t - f.start < f.dur);
    for (const f of this.fx) {
      let k = (t - f.start) / f.dur;
      const queued = k < 0;
      if (k < 0) {
        // 排队中的自动拾取 / 清怪：先停在原格，轮到时再播放
        if (f.kind !== 'ghost' || (f.mode !== 'magnet' && f.mode !== 'die')) continue;
        k = 0;
      }
      if (f.kind === 'slash') {
        drawSlash(ctx, f, t, T, this.tx(f.x) + T / 2, this.ty(f.y) + T / 2);
        continue;
      }
      if (f.kind === 'particle') {
        const tt = (t - f.start) / 1000;
        const x = this.mapX + (f.x + f.vx * tt) * T;
        const y = this.mapY + (f.y + f.vy * tt + 2.2 * tt * tt) * T;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = f.color;
        ctx.fillRect(Math.round(x), Math.round(y), f.size * px, f.size * px);
        ctx.globalAlpha = 1;
      } else if (f.kind === 'ghost') {
        const X = this.tx(f.x);
        const Y = this.ty(f.y);
        ctx.save();
        if (f.mode === 'die') {
          // 排队中的怪物保持原样（不闪白），轮到时才开始闪烁消散
          const flash = !queued && Math.floor(k * 8) % 2 === 0 && k < 0.5;
          ctx.globalAlpha = k < 0.5 ? 1 : 1 - (k - 0.5) * 2;
          const s = k < 0.5 ? 1 : 1 - (k - 0.5) * 0.8;
          const U = T * (f.size ?? 1);
          const w = U * s;
          ctx.drawImage(flash && f.white ? f.white : f.img, X + (U - w) / 2, Y + (U - w), w, w);
        } else if (f.mode === 'rise') {
          ctx.globalAlpha = 1 - k;
          ctx.drawImage(f.img, X + T * 0.08, Y - easeOut(k) * T * 0.6, T * 0.84, T * 0.84);
        } else if (f.mode === 'magnet') {
          // 磁吸：沿弧线加速飞向勇士并缩小
          const e = k * k;
          const mx = this.tx(f.x + ((f.tx ?? f.x) - f.x) * e);
          const my = this.ty(f.y + ((f.ty ?? f.y) - f.y) * e) - Math.sin(k * Math.PI) * T * 0.5;
          const w = T * (0.9 - 0.45 * e);
          ctx.globalAlpha = k < 0.8 ? 1 : 1 - (k - 0.8) * 5;
          ctx.drawImage(f.img, mx + (T - w) / 2, my + (T - w) / 2, w, w);
        } else {
          // 门：向上收起
          const h = T * (1 - easeOut(k));
          ctx.globalAlpha = 1 - k * 0.5;
          ctx.drawImage(f.img, 0, 0, 32, 32 * (1 - easeOut(k)), X, Y, T, h);
        }
        ctx.restore();
      } else {
        const size = Math.round(T * f.size);
        const x = this.mapX + f.x * T;
        const y = this.mapY + (f.y - easeOut(k) * 0.7) * T + T * 0.3;
        ctx.font = `900 ${size}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.lineWidth = Math.max(2, size * 0.2);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#2a1b3d';
        ctx.strokeText(f.text, x, y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, x, y);
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ---------------------------------------------------------- 侧边状态栏 */

  /** 背包每页格数 */
  static readonly BAG_COLS = 4;
  static readonly BAG_PER_PAGE = 8;

  /** CSS 坐标 → 背包中的格子 / 翻页按钮 */
  bagHit(cssX: number, cssY: number): BagHit | null {
    const X = cssX * this.dpr;
    const Y = cssY * this.dpr;
    for (const r of this.bagRects) if (X >= r.x && X < r.x + r.w && Y >= r.y && Y < r.y + r.h) return r.hit;
    return null;
  }

  /** 背包格子中心（CSS 坐标，测试用） */
  bagSlotCss(index: number): { x: number; y: number } | null {
    const r = this.bagRects.find((b) => b.hit.kind === 'slot' && b.hit.index === index);
    return r ? { x: (r.x + r.w / 2) / this.dpr, y: (r.y + r.h / 2) / this.dpr } : null;
  }

  /** 地图上悬停 / 点击的怪物：在其旁边显示小型情报浮窗 */
  private drawMonsterTip(): void {
    const h = this.hover;
    if (!h) return;
    const g = this.game;
    const info = g.monsterInfoAt(h);
    if (!info) return this.drawItemTip(h);
    const { ctx, T } = this;
    const full = this.showDamage();
    const tags = specialTags(info.def);
    const w = T * 3.9;
    const fs0 = T * 0.19;
    // 特殊能力：标签一行 + 说明自动换行（最多 2 行）
    ctx.font = `700 ${fs0 * 0.9}px ${FONT}`;
    const descLines = tags.length ? wrapText(ctx, tags.map((t) => t.desc).join(' '), w - T * 0.32, 2) : [];
    const bh = (full ? T * 1.62 : T * 0.96) + (tags.length ? T * 0.34 + descLines.length * T * 0.27 : 0);
    let X = this.tx(h.x) + T / 2 - w / 2;
    X = Math.max(this.mapX + T * 0.06, Math.min(this.mapX + 11 * T - w - T * 0.06, X));
    let Y = this.ty(h.y) - bh - T * 0.12;
    if (Y < this.mapY + T * 0.06) Y = this.ty(h.y) + T * 1.12;
    const p = Math.max(1, Math.round(this.px));
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = '#2a1b3d';
    ctx.fillRect(Math.round(X - p * 2), Math.round(Y - p * 2), Math.round(w + p * 4), Math.round(bh + p * 4));
    ctx.fillStyle = '#ffcf4a';
    ctx.fillRect(Math.round(X - p), Math.round(Y - p), Math.round(w + p * 2), Math.round(bh + p * 2));
    ctx.fillStyle = '#28245e';
    ctx.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(bh));
    ctx.globalAlpha = 1;
    const lx = X + T * 0.16;
    const d = info.def;
    txt(ctx, d.name, lx, Y + T * 0.24, T * 0.24, '#ffffff', 'left', 900);
    if (full) {
      const { text, color } = damageLabel(info, g.hero.hp);
      txt(ctx, `伤害 ${text}`, X + w - T * 0.16, Y + T * 0.24, T * 0.24, color, 'right', 900, '#2a1b3d');
    }
    const fs = T * 0.19;
    txt(ctx, `生命 ${d.hp}  攻击 ${d.atk}  防御 ${d.def}  金币 ${d.gold}`, lx, Y + T * 0.62, fs, '#e8eaff', 'left', 700);
    if (full) {
      const c = criticalText(info);
      txt(ctx, fit(ctx, c.line1, w - T * 0.32, fs), lx, Y + T * 0.98, fs, '#ffe066', 'left', 900);
      txt(ctx, fit(ctx, `${c.line2} · 回合 ${info.forecast.canAttack ? info.forecast.rounds : '∞'}`, w - T * 0.32, fs), lx, Y + T * 1.32, fs, '#c9cfff', 'left', 700);
    }
    if (tags.length) {
      let ty = Y + bh - T * 0.2 - descLines.length * T * 0.27;
      let tx = lx;
      for (const tg of tags) {
        const label = `【${tg.name}】`;
        txt(ctx, label, tx, ty, fs, tg.color, 'left', 900, '#2a1b3d');
        ctx.font = `900 ${fs}px ${FONT}`;
        tx += ctx.measureText(label).width + T * 0.04;
      }
      for (const line of descLines) {
        ty += T * 0.27;
        txt(ctx, line, lx, ty, fs * 0.9, '#e8eaff', 'left', 700);
      }
    }
    ctx.restore();
  }

  /** 悬停在领域 / 夹击格子上：显示将受到的伤害 */
  private drawDangerTip(h: Point): void {
    const g = this.game;
    const v = g.damageAt(h);
    const kind = g.mapDamage().kinds[h.y][h.x] || '魔法';
    const { ctx, T } = this;
    const w = T * 2.6;
    const bh = T * 0.62;
    let X = this.tx(h.x) + T / 2 - w / 2;
    X = Math.max(this.mapX + T * 0.06, Math.min(this.mapX + 11 * T - w - T * 0.06, X));
    let Y = this.ty(h.y) - bh - T * 0.12;
    if (Y < this.mapY + T * 0.06) Y = this.ty(h.y) + T * 1.12;
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = '#2a1b3d';
    ctx.fillRect(Math.round(X - 2), Math.round(Y - 2), Math.round(w + 4), Math.round(bh + 4));
    ctx.fillStyle = '#c677dd';
    ctx.fillRect(Math.round(X - 1), Math.round(Y - 1), Math.round(w + 2), Math.round(bh + 2));
    ctx.fillStyle = '#28245e';
    ctx.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(bh));
    ctx.globalAlpha = 1;
    txt(ctx, `${kind}伤害`, X + T * 0.16, Y + bh / 2, T * 0.22, '#ffffff', 'left', 900);
    txt(ctx, `-${v}`, X + w - T * 0.16, Y + bh / 2, T * 0.22, v >= g.hero.hp ? '#ff4d5e' : '#e0a6ff', 'right', 900, '#2a1b3d');
    ctx.restore();
  }

  /** 地图上悬停的道具：名称 + 当前楼层的实际效果 */
  private drawItemTip(h: Point): void {
    const c = this.game.cell(h);
    if (c && !c.item && this.game.damageAt(h) > 0) return this.drawDangerTip(h);
    if (!c?.item) return;
    const def = ITEMS[c.item];
    const v = itemValue(c.item, this.game.floor.ratio);
    const { ctx, T } = this;
    const w = T * 2.6;
    const bh = T * 0.62;
    let X = this.tx(h.x) + T / 2 - w / 2;
    X = Math.max(this.mapX + T * 0.06, Math.min(this.mapX + 11 * T - w - T * 0.06, X));
    let Y = this.ty(h.y) - bh - T * 0.12;
    if (Y < this.mapY + T * 0.06) Y = this.ty(h.y) + T * 1.12;
    const p = Math.max(1, Math.round(this.px));
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = '#2a1b3d';
    ctx.fillRect(Math.round(X - p * 2), Math.round(Y - p * 2), Math.round(w + p * 4), Math.round(bh + p * 4));
    ctx.fillStyle = '#ffcf4a';
    ctx.fillRect(Math.round(X - p), Math.round(Y - p), Math.round(w + p * 2), Math.round(bh + p * 2));
    ctx.fillStyle = '#28245e';
    ctx.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(bh));
    ctx.globalAlpha = 1;
    txt(ctx, def.name, X + T * 0.16, Y + bh / 2, T * 0.22, '#ffffff', 'left', 900);
    txt(ctx, fit(ctx, itemEffect(c.item, this.game.floor.ratio), w * 0.6, T * 0.2), X + w - T * 0.16, Y + bh / 2, T * 0.2, v ? STAT_COLORS[v.stat] : def.color, 'right', 900, '#2a1b3d');
    ctx.restore();
  }

  private drawPanel(_t: number): void {
    const { ctx, T } = this;
    const g = this.game;
    const h = g.hero;
    const x = Math.round(M * T);
    const y = Math.round(M * T);
    const w = Math.round(PANEL_W * T);
    const hh = Math.round((UNITS_H - M * 2) * T);
    const p = Math.max(1, Math.round(this.px));
    box(ctx, x, y, w, hh, p, T);

    const cx = x + w / 2;
    if (g.flags.testMode) {
      // 试玩模式徽章
      const bw = T * 1.9;
      const bh = T * 0.34;
      ctx.fillStyle = '#ff7a3d';
      ctx.fillRect(Math.round(cx - bw / 2), Math.round(y + T * 0.19), Math.round(bw), Math.round(bh));
      ctx.fillStyle = '#2a1b3d';
      ctx.fillRect(Math.round(cx - bw / 2), Math.round(y + T * 0.19 + bh - p), Math.round(bw), p);
      txt(ctx, `试玩模式 · ${ZONE_NAMES[zoneOf(g.floorId)]}`, cx, y + T * 0.36, T * 0.2, '#ffffff', 'center', 900, '#2a1b3d');
    } else {
      txt(ctx, `魔塔 · ${ZONE_NAMES[zoneOf(g.floorId)]}`, cx, y + T * 0.36, T * 0.2, '#c9cfff', 'center', 700);
    }
    txt(ctx, g.floor.name, cx, y + T * 0.8, T * 0.42, '#ffe066', 'center', 900, '#2a1b3d');
    divider(ctx, x + T * 0.25, y + T * 1.1, w - T * 0.5, p);

    const S = this.sprites;
    const rows: Array<[C, string, number, string]> = [
      [S.icon.heart, '生命', h.hp, '#ffffff'],
      [S.item.ironSword, '攻击', h.atk, '#ffffff'],
      [S.item.ironShield, '防御', h.def, '#ffffff'],
      [S.icon.coin, '金币', h.gold, '#ffe066'],
    ];
    const rh = T * 0.6;
    let ry = y + T * 1.25;
    const STAT_KEYS = ['hp', 'atk', 'def', 'gold'];
    const nowT = performance.now();
    rows.forEach(([icon, label, val, col], i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x + T * 0.18, ry, w - T * 0.36, rh);
      }
      const fx = this.statFx.get(STAT_KEYS[i]);
      const fk = fx ? (nowT - fx.t) / 700 : 1;
      if (fx && fk < 1) {
        ctx.fillStyle = `rgba(120,255,170,${0.38 * (1 - fk)})`;
        ctx.fillRect(x + T * 0.18, ry, w - T * 0.36, rh);
        txt(ctx, `+${fx.delta}`, x + w - T * 1.5, ry + rh / 2 - T * 0.12 * fk, T * 0.22, `rgba(160,255,190,${1 - fk})`, 'right', 900, '#2a1b3d');
      }
      const is = T * 0.46;
      ctx.drawImage(icon, Math.round(x + T * 0.28), Math.round(ry + (rh - is) / 2), Math.round(is), Math.round(is));
      txt(ctx, label, x + T * 0.9, ry + rh / 2 + T * 0.02, T * 0.24, '#c9cfff', 'left', 700);
      txt(ctx, String(val), x + w - T * 0.3, ry + rh / 2 + T * 0.02, T * 0.32, col, 'right', 900, '#2a1b3d');
      ry += rh;
    });

    // 钥匙
    ry += T * 0.12;
    const kw = (w - T * 0.36) / 3;
    (['yellow', 'blue', 'red'] as const).forEach((k, i) => {
      const kx = x + T * 0.18 + kw * i;
      ctx.fillStyle = 'rgba(20,16,60,0.45)';
      ctx.fillRect(Math.round(kx + T * 0.04), Math.round(ry), Math.round(kw - T * 0.08), Math.round(T * 0.66));
      const icon = S.item[k === 'yellow' ? 'yellowKey' : k === 'blue' ? 'blueKey' : 'redKey'];
      const is = T * 0.5;
      ctx.drawImage(icon, Math.round(kx + T * 0.08), Math.round(ry + T * 0.08), Math.round(is), Math.round(is));
      const kfx = k === 'yellow' ? this.statFx.get('yellow') : undefined;
      const kk = kfx ? (nowT - kfx.t) / 700 : 1;
      if (kfx && kk < 1) {
        ctx.fillStyle = `rgba(255,236,120,${0.45 * (1 - kk)})`;
        ctx.fillRect(Math.round(kx + T * 0.04), Math.round(ry), Math.round(kw - T * 0.08), Math.round(T * 0.66));
      }
      txt(ctx, `×${h.keys[k]}`, kx + kw - T * 0.12, ry + T * 0.35, T * 0.28, '#ffffff', 'right', 900, '#2a1b3d');
    });
    ry += T * 0.66 + T * 0.1;
    // 装备（道具在下方背包中）
    const ts = T * 0.4;
    const eq = [h.weapon, h.shield].filter(Boolean).join(' · ') || '无装备';
    txt(ctx, '装备', x + T * 0.28, ry + ts / 2, T * 0.2, '#c9cfff', 'left', 700);
    txt(ctx, fit(ctx, eq, w - T * 1.2, T * 0.21), x + w - T * 0.3, ry + ts / 2, T * 0.21, h.weapon?.startsWith('神圣') ? '#9fe8ff' : '#e8eaff', 'right', 700);
    ry += ts + T * 0.1;
    divider(ctx, x + T * 0.25, ry, w - T * 0.5, p);
    ry += T * 0.12;

    // 背包
    this.bagRects = [];
    txt(ctx, '背包', x + T * 0.28, ry + T * 0.22, T * 0.22, '#ffe066', 'left', 900);
    const infoH = T * 2.98;
    const iy = ry + T * 0.42;
    const slots = this.inventory();
    const per = Renderer.BAG_PER_PAGE;
    const pages = Math.max(1, Math.ceil(slots.length / per));
    this.bagPage = Math.min(this.bagPage, pages - 1);
    if (pages > 1) {
      const by = ry + T * 0.04;
      const bs = T * 0.36;
      const nx = x + w - T * 0.24 - bs;
      const px0 = nx - T * 0.86 - bs;
      txt(ctx, `${this.bagPage + 1}/${pages}`, (px0 + bs + nx) / 2, by + bs / 2, T * 0.19, '#e8eaff', 'center', 900);
      for (const [bx, dir, label] of [[px0, 'prev', '◀'], [nx, 'next', '▶']] as const) {
        const dis = dir === 'prev' ? this.bagPage === 0 : this.bagPage === pages - 1;
        ctx.fillStyle = dis ? 'rgba(255,255,255,0.08)' : '#f0b437';
        ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bs), Math.round(bs));
        txt(ctx, label, bx + bs / 2, by + bs / 2, T * 0.2, dis ? '#7b7fb8' : '#2a1b3d', 'center', 900);
        if (!dis) this.bagRects.push({ x: bx, y: by, w: bs, h: bs, hit: { kind: dir } });
      }
    }
    const cols = Renderer.BAG_COLS;
    const gx = x + T * 0.18;
    const gw = w - T * 0.36;
    const cell = gw / cols;
    const sz = cell - T * 0.1;
    const show = slots.slice(this.bagPage * per, this.bagPage * per + per);
    for (let i = 0; i < per; i++) {
      const sx = gx + (i % cols) * cell + T * 0.05;
      const sy = iy + Math.floor(i / cols) * cell + T * 0.05;
      const sl = show[i];
      const idx = this.bagPage * per + i;
      const hov = sl && this.bagHover === idx;
      ctx.fillStyle = hov ? 'rgba(255,207,74,0.28)' : sl ? 'rgba(20,16,60,0.55)' : 'rgba(20,16,60,0.25)';
      ctx.fillRect(Math.round(sx), Math.round(sy), Math.round(sz), Math.round(sz));
      if (hov) {
        ctx.strokeStyle = '#ffcf4a';
        ctx.lineWidth = p * 2;
        ctx.strokeRect(Math.round(sx) + p, Math.round(sy) + p, Math.round(sz) - p * 2, Math.round(sz) - p * 2);
      }
      if (!sl) continue;
      const is = sz * 0.72;
      ctx.globalAlpha = sl.usable || !sl.item.use ? 1 : 0.4;
      ctx.drawImage(sl.item.icon(), Math.round(sx + (sz - is) / 2), Math.round(sy + (sz - is) / 2 - (hov ? p * 2 : 0)), Math.round(is), Math.round(is));
      ctx.globalAlpha = 1;
      if (!sl.item.permanent) txt(ctx, `${sl.count}`, sx + sz - T * 0.06, sy + sz - T * 0.14, T * 0.2, '#ffffff', 'right', 900, '#2a1b3d');
      this.bagRects.push({ x: sx, y: sy, w: sz, h: sz, hit: { kind: 'slot', index: idx, id: sl.item.id } });
    }
    // 说明栏：悬停 / 长按显示名称与说明
    const dy = iy + cell * 2 + T * 0.08;
    const dh = infoH - cell * 2 - T * 0.08;
    ctx.fillStyle = 'rgba(20,16,60,0.45)';
    ctx.fillRect(Math.round(gx), Math.round(dy), Math.round(gw), Math.round(dh));
    const hs = this.bagHover !== null ? slots[this.bagHover] : undefined;
    if (hs) {
      const it = hs.item;
      txt(ctx, it.name + (it.hotkey ? `（${it.hotkey}）` : ''), gx + T * 0.12, dy + T * 0.22, T * 0.22, '#ffe066', 'left', 900);
      const lines = wrap(ctx, it.desc, gw - T * 0.24, T * 0.18, 2);
      lines.forEach((l, i) => txt(ctx, l, gx + T * 0.12, dy + T * 0.52 + i * T * 0.26, T * 0.18, '#e8eaff', 'left', 700));
    } else {
      txt(ctx, slots.length ? '点击道具使用 · 悬停 / 长按查看说明' : '背包是空的', gx + gw / 2, dy + dh * 0.36, T * 0.18, '#aab0e8', 'center', 700);
      txt(ctx, '鼠标悬停怪物看情报 · 触屏请用怪物手册', gx + gw / 2, dy + dh * 0.7, T * 0.18, '#aab0e8', 'center', 700);
    }
    ry = iy + infoH + T * 0.2;
    divider(ctx, x + T * 0.25, ry, w - T * 0.5, p);
    ry += T * 0.12;

    // 消息
    txt(ctx, '消息', x + T * 0.28, ry + T * 0.22, T * 0.22, '#ffe066', 'left', 900);
    ry += T * 0.48;
    const bottom = y + hh - T * 0.15;
    const lh = T * 0.36;
    const maxLines = Math.max(1, Math.floor((bottom - ry) / lh));
    const items = g.log.slice(-maxLines);
    const colors = { info: '#e8eaff', good: '#9dffb8', warn: '#ffe066', bad: '#ff8a96' };
    items.forEach((m, i) => {
      const age = items.length - 1 - i;
      ctx.globalAlpha = Math.max(0.4, 1 - age * 0.18);
      txt(ctx, fit(ctx, m.text, w - T * 0.5, T * 0.21), x + T * 0.28, ry + lh * i + lh / 2, T * 0.21, colors[m.kind], 'left', 700);
      ctx.globalAlpha = 1;
    });
  }
}

/* ------------------------------------------------------------------ 工具函数 */

const GOLD = '#ffcf4a';

function isWallLike(c: Cell): boolean {
  return c.terrain === 'wall' || c.terrain === 'hiddenWall' || c.terrain === 'hiddenWall2' || c.terrain === 'solidWall' || c.terrain === 'sealedWall';
}

function snapTile(raw: number): number {
  const f = Math.floor(raw);
  for (const m of [32, 16, 8]) {
    const s = Math.floor(f / m) * m;
    if (s >= m && s >= f * 0.9) return s;
  }
  return Math.max(8, f);
}

function dirTo(a: Point, b: Point): Dir {
  if (b.x > a.x) return 'right';
  if (b.x < a.x) return 'left';
  if (b.y > a.y) return 'down';
  return 'up';
}

/** 道具数值标签颜色 */
export const STAT_COLORS: Record<StatKind, string> = { atk: '#ff6f7d', def: '#6cc0ff', hp: '#7dffa6' };

export function damageLabel(info: MonsterInfo, hp: number): { text: string; color: string } {
  const f = info.forecast;
  if (!f.canAttack) return { text: '???', color: '#ff4d5e' };
  if (f.damage >= hp) return { text: String(f.damage), color: '#ff4d5e' };
  if (f.damage === 0) return { text: '0', color: '#8dffb0' };
  if (f.damage < hp / 4) return { text: String(f.damage), color: '#ffffff' };
  if (f.damage < hp / 2) return { text: String(f.damage), color: '#ffe066' };
  return { text: String(f.damage), color: '#ff9a3c' };
}

/** 情报面板 / 怪物手册共用的临界文字 */
export function criticalText(info: MonsterInfo): { line1: string; line2: string } {
  const c = info.critical;
  const d1 = info.def1 === null ? '???' : String(info.def1);
  if (!c.broken) {
    const after = Number.isFinite(c.damageAfter ?? Infinity) ? String(c.damageAfter) : '???';
    return { line1: `破防需攻击 +${c.atk}`, line2: `破防后伤害 ${after}` };
  }
  if (c.atk <= 0) return { line1: '临界 —（已最优）', line2: `1防减伤 ${d1}` };
  return { line1: `临界 +${c.atk}  减伤 ${c.reduce}`, line2: `1防减伤 ${d1}` };
}

function txt(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign,
  weight: number,
  stroke?: string,
): void {
  const fs = Math.round(size);
  ctx.font = `${weight} ${fs}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.lineWidth = Math.max(2, fs * 0.18);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

export type BagHit = { kind: 'slot'; index: number; id: string } | { kind: 'prev' } | { kind: 'next' };

function wrap(ctx: CanvasRenderingContext2D, s: string, maxW: number, size: number, maxLines: number): string[] {
  ctx.font = `700 ${Math.round(size)}px ${FONT}`;
  const out: string[] = [];
  let line = '';
  for (const ch of s) {
    if (ctx.measureText(line + ch).width > maxW) {
      out.push(line);
      line = ch;
      if (out.length === maxLines) break;
    } else line += ch;
  }
  if (out.length < maxLines && line) out.push(line);
  else if (out.length === maxLines && line) out[maxLines - 1] = fit(ctx, out[maxLines - 1] + line, maxW, size);
  return out;
}

/** 按宽度把文字折成最多 max 行（最后一行放不下时加省略号） */
function wrapText(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > width && cur) {
      lines.push(cur);
      cur = '';
      if (lines.length === max) {
        let last = lines[max - 1];
        while (last && ctx.measureText(last + '…').width > width) last = last.slice(0, -1);
        lines[max - 1] = last + '…';
        return lines;
      }
    }
    cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, s: string, maxW: number, size: number): string {
  ctx.font = `700 ${Math.round(size)}px ${FONT}`;
  if (ctx.measureText(s).width <= maxW) return s;
  let out = s;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
  return out + '…';
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

function chamfer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, T: number): void {
  const c = Math.round(T * 0.14);
  chamfer(ctx, x - p * 2, y - p * 2, w + p * 4, h + p * 4, c + p);
  ctx.fillStyle = '#2a1b3d';
  ctx.fill();
  chamfer(ctx, x, y, w, h, c);
  ctx.fillStyle = GOLD;
  ctx.fill();
  const b = p * 3;
  chamfer(ctx, x + b, y + b, w - b * 2, h - b * 2, c - p);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#4048b8');
  g.addColorStop(1, '#2c2f8c');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,170,255,0.5)';
  ctx.lineWidth = p;
  chamfer(ctx, x + b + p * 1.5, y + b + p * 1.5, w - b * 2 - p * 3, h - b * 2 - p * 3, c - p * 2);
  ctx.stroke();
}

function divider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, p: number): void {
  ctx.fillStyle = 'rgba(255,207,74,0.55)';
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), p);
  diamond(ctx, x + w / 2, y + p / 2, p * 3, GOLD);
}


/** 残影用的冷色调版本（每帧图缓存一次） */
const GHOST_CACHE = new WeakMap<CanvasImageSource, HTMLCanvasElement>();
function ghostTint(img: HTMLCanvasElement | HTMLImageElement): HTMLCanvasElement {
  let c = GHOST_CACHE.get(img);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(150, 215, 255, 0.55)';
  g.fillRect(0, 0, c.width, c.height);
  GHOST_CACHE.set(img, c);
  return c;
}
