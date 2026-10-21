/**
 * 轻量像素画布：在 32×32 的低分辨率网格上用代码"画"像素画，
 * 支持矩形 / 椭圆 / 多边形 / 线条 / 字符图案、自动明暗与描边，最后导出为离屏 canvas。
 */
export type Px = string | null;

const rgbaCache = new Map<string, [number, number, number, number]>();
function parseColor(c: string): [number, number, number, number] {
  let v = rgbaCache.get(c);
  if (!v) {
    const h = c.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
    v = [r, g, b, a];
    rgbaCache.set(c, v);
  }
  return v;
}

export class Pix {
  readonly px: Px[];

  constructor(
    readonly w = 32,
    readonly h = 32,
  ) {
    this.px = new Array<Px>(w * h).fill(null);
  }

  inb(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): Px {
    x = Math.floor(x);
    y = Math.floor(y);
    return this.inb(x, y) ? this.px[y * this.w + x] : null;
  }

  set(x: number, y: number, c: Px): this {
    x = Math.floor(x);
    y = Math.floor(y);
    if (this.inb(x, y)) this.px[y * this.w + x] = c;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: Px): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Px): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
    return this;
  }

  poly(pts: Array<[number, number]>, c: Px): this {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Px, t = 1): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const o = Math.floor((t - 1) / 2);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      this.rect(x - o, y - o, t, t, c);
    }
    return this;
  }

  /** 用字符图案绘制，'.' 与空格为透明 */
  stamp(x: number, y: number, rows: string[], pal: Record<string, Px>): this {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        if (ch === '.' || ch === ' ') return;
        const c = pal[ch];
        if (c !== undefined) this.set(x + i, y + j, c);
      });
    });
    return this;
  }

  /** 按条件替换已有像素的颜色 */
  recolor(pred: (x: number, y: number, c: string) => boolean, to: Px): this {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.px[y * this.w + x];
        if (c !== null && pred(x, y, c)) this.px[y * this.w + x] = to;
      }
    }
    return this;
  }

  /** 自动明暗：材质顶部边缘提亮，底部/右侧边缘压暗 */
  autoShade(colors: string[], light: string, dark: string): this {
    const src = this.px.slice();
    const mat = (x: number, y: number) => {
      if (!this.inb(x, y)) return false;
      const c = src[y * this.w + x];
      return c !== null && colors.includes(c);
    };
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!mat(x, y)) continue;
        if (!mat(x, y - 1)) this.px[y * this.w + x] = light;
        else if (!mat(x, y + 1) || !mat(x + 1, y)) this.px[y * this.w + x] = dark;
      }
    }
    return this;
  }

  /** 在形状外围生成 1 像素描边 */
  outline(c: string): this {
    const src = this.px.slice();
    const filled = (x: number, y: number) => this.inb(x, y) && src[y * this.w + x] !== null;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] !== null) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) this.px[y * this.w + x] = c;
      }
    }
    return this;
  }

  clone(): Pix {
    const p = new Pix(this.w, this.h);
    for (let i = 0; i < this.px.length; i++) p.px[i] = this.px[i];
    return p;
  }

  flipX(): Pix {
    const p = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.px[y * this.w + x] = this.px[y * this.w + (this.w - 1 - x)];
    return p;
  }

  /** 生成纯色剪影（受击闪白等特效） */
  tint(c: string): Pix {
    const p = this.clone();
    p.recolor(() => true, c);
    return p;
  }

  toCanvas(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (!c) continue;
      const [r, g, b, a] = parseColor(c);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
