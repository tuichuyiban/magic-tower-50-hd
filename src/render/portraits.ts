/**
 * 对话用高清头像：64×64 程序化像素画（与地图精灵同一套明亮配色、自动明暗与深紫描边），
 * 导出时按 4 倍最近邻放大为 256×256 PNG（dataURL），在对话框中保持像素锐利。
 */
import { Pix } from './pixel';

const INK = '#2a1b3d';
type Pal = { base: string; light: string; dark: string };
const mat = (base: string, light: string, dark: string): Pal => ({ base, light, dark });

const SKIN = mat('#ffd2a8', '#ffe6cc', '#e8a87c');
const WHITE_EYE = '#ffffff';

interface Painter {
  p: Pix;
  mats: Pal[];
  use(m: Pal): string;
}

function painter(): Painter {
  const p = new Pix(64, 64);
  const mats: Pal[] = [];
  return {
    p,
    mats,
    use(m: Pal) {
      if (!mats.includes(m)) mats.push(m);
      return m.base;
    },
  };
}

function finish(P: Painter, extra?: (p: Pix) => void): string {
  for (const m of P.mats) P.p.autoShade([m.base], m.light, m.dark);
  extra?.(P.p);
  P.p.outline(INK);
  const src = P.p.toCanvas();
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, 256, 256);
  return cv.toDataURL('image/png');
}

/* ---------- 通用部件 ---------- */

function torso(P: Painter, cloth: Pal, w = 27): void {
  P.p.ellipse(32, 67, w, 21, P.use(cloth));
}

function neck(P: Painter, skin: Pal): void {
  P.p.rect(27, 38, 10, 9, skin.dark);
}

function head(P: Painter, skin: Pal, rx = 12.5, ry = 14.5): void {
  P.p.ellipse(19.8, 29, 2.6, 3.6, P.use(skin));
  P.p.ellipse(44.2, 29, 2.6, 3.6, skin.base);
  P.p.ellipse(32, 27, rx, ry, skin.base);
  // 下颌阴影
  P.p.rect(25, 40, 14, 1, skin.dark);
}

function eyes(p: Pix, iris: string, opts: { y?: number; look?: -1 | 1; glow?: boolean; closed?: boolean; brow?: string; angry?: boolean } = {}): void {
  const y = opts.y ?? 28;
  const look = opts.look ?? 0;
  for (const ex of [24, 35]) {
    if (opts.closed) {
      p.rect(ex, y + 1, 5, 1, INK);
      p.set(ex, y, INK).set(ex + 4, y, INK);
      continue;
    }
    p.rect(ex, y, 5, 3, opts.glow ? iris : WHITE_EYE);
    if (!opts.glow) {
      const ix = ex + 1 + look;
      p.rect(ix, y - 0, 3, 3, iris);
      p.rect(ix + 1, y + 1, 1, 2, INK);
      p.set(ix, y, '#ffffff');
    } else p.set(ex + 1, y, '#ffffff');
    p.rect(ex, y - 1, 5, 1, INK); // 上眼线
  }
  if (opts.brow) {
    if (opts.angry) {
      p.line(23, y - 4, 28, y - 2, opts.brow, 2);
      p.line(36, y - 2, 41, y - 4, opts.brow, 2);
    } else {
      p.rect(23, y - 4, 6, 2, opts.brow);
      p.rect(35, y - 4, 6, 2, opts.brow);
    }
  }
}

function nose(p: Pix, skin: Pal): void {
  p.rect(32, 31, 1, 3, skin.dark);
  p.set(31, 34, skin.dark);
}

function smile(p: Pix, y = 36, w = 6, color = '#b4505a'): void {
  const x0 = 32 - Math.floor(w / 2);
  p.rect(x0 + 1, y + 1, w - 2, 1, color);
  p.set(x0, y, color).set(x0 + w - 1, y, color);
}

function blush(p: Pix): void {
  p.rect(22, 33, 3, 2, '#ffa9a3');
  p.rect(39, 33, 3, 2, '#ffa9a3');
}

function sparkle(p: Pix, x: number, y: number, c = '#fff3b0'): void {
  p.set(x, y, '#ffffff').set(x - 1, y, c).set(x + 1, y, c).set(x, y - 1, c).set(x, y + 1, c);
}

/* ---------- 角色 ---------- */

function hero(): string {
  const P = painter();
  const { p } = P;
  const cape = mat('#e4404f', '#ff7482', '#a82738');
  const steel = mat('#d7def0', '#ffffff', '#99a3c4');
  const blue = mat('#4f8cf0', '#8fbaff', '#3460c0');
  const hair = mat('#ffd34f', '#fff19a', '#e0a020');
  // 披风
  p.ellipse(32, 66, 30, 22, P.use(cape));
  // 胸甲与护肩
  p.ellipse(32, 66, 22, 20, P.use(steel));
  p.ellipse(13, 53, 9, 7, steel.base);
  p.ellipse(51, 53, 9, 7, steel.base);
  p.poly([[26, 47], [38, 47], [35, 64], [29, 64]], P.use(blue));
  p.rect(31, 50, 2, 9, '#ffcf4a');
  p.rect(28, 53, 8, 2, '#ffcf4a');
  p.rect(12, 49, 2, 2, '#ffcf4a').rect(50, 49, 2, 2, '#ffcf4a');
  neck(P, SKIN);
  p.rect(26, 44, 12, 4, blue.base); // 高领
  head(P, SKIN);
  // 金色刺猬头
  p.ellipse(32, 18, 14, 9, P.use(hair));
  // 向右后方扫的发束（不对称，避免像王冠）
  p.poly([[17, 23], [9, 14], [21, 15]], hair.base);
  p.poly([[19, 16], [15, 5], [27, 11]], hair.base);
  p.poly([[25, 11], [27, 1], [35, 9]], hair.base);
  p.poly([[33, 9], [43, 2], [41, 13]], hair.base);
  p.poly([[40, 12], [51, 9], [46, 19]], hair.base);
  p.poly([[44, 18], [54, 20], [46, 26]], hair.base);
  // 刘海（露出额头）
  p.poly([[19, 17], [24, 26], [27, 18]], hair.base);
  p.poly([[26, 17], [30, 25], [33, 17]], hair.base);
  p.poly([[33, 17], [38, 24], [39, 16]], hair.base);
  p.poly([[39, 16], [45, 25], [45, 15]], hair.base);
  p.rect(18, 20, 3, 10, hair.base).rect(43, 20, 3, 10, hair.base);
  eyes(p, '#3a7bff', { brow: '#d99a1a' });
  nose(p, SKIN);
  smile(p, 36, 6);
  blush(p);
  return finish(P, (q) => {
    // 发丝
    for (const [x0, y0, x1, y1] of [[22, 12, 25, 17], [30, 7, 31, 14], [38, 8, 36, 14], [44, 14, 42, 19], [16, 16, 20, 20]]) q.line(x0, y0, x1, y1, hair.dark);
    q.set(23, 9, '#ffffff').set(30, 5, '#ffffff');
  });
}

function thief(): string {
  const P = painter();
  const { p } = P;
  const tunic = mat('#2fb8a0', '#6fe3cb', '#1e8574');
  const leather = mat('#9a5a2c', '#c98a50', '#6a3a18');
  const hair = mat('#7a4a28', '#a8703f', '#4f2c14');
  const band = mat('#3b4cc0', '#6f80ff', '#283290');
  torso(P, tunic, 26);
  p.line(16, 50, 46, 64, P.use(leather), 4);
  p.rect(36, 57, 4, 3, '#ffcf4a');
  // 匕首（左肩）
  p.poly([[10, 46], [14, 34], [16, 46]], '#e6ecf8');
  p.rect(9, 46, 9, 2, '#ffcf4a');
  p.rect(11, 48, 4, 6, leather.base);
  neck(P, SKIN);
  p.poly([[26, 44], [32, 50], [38, 44]], tunic.light);
  head(P, SKIN);
  // 蓬乱的头发
  p.ellipse(32, 17, 15, 9, P.use(hair));
  for (const [x, y] of [[17, 22], [19, 12], [26, 7], [34, 6], [42, 9], [47, 16], [47, 24]]) p.ellipse(x, y, 4, 4, hair.base);
  p.rect(18, 20, 3, 11, hair.base).rect(43, 20, 3, 11, hair.base);
  // 头巾
  p.rect(19, 19, 26, 4, P.use(band));
  p.poly([[44, 19], [53, 16], [50, 22], [55, 26], [46, 23]], band.base);
  p.poly([[23, 23], [26, 27], [29, 23]], hair.base);
  eyes(p, '#7a4a20', { look: -1, brow: hair.dark });
  nose(p, SKIN);
  // 坏笑
  p.rect(29, 37, 6, 1, '#b4505a').set(35, 36, '#b4505a').rect(30, 38, 4, 1, '#ffffff');
  p.set(25, 34, '#d99a7a').set(27, 35, '#d99a7a').set(38, 34, '#d99a7a');
  return finish(P);
}

function oldman(): string {
  const P = painter();
  const { p } = P;
  const robe = mat('#a8703f', '#d29a5e', '#74461f');
  const cream = mat('#f4e2b8', '#fff6dc', '#cfb582');
  const beard = mat('#f4f4fa', '#ffffff', '#c4c6dc');
  const wood = mat('#8a5a2c', '#b9844c', '#5c3816');
  torso(P, robe, 27);
  p.poly([[20, 46], [32, 64], [44, 46], [40, 46], [32, 58], [24, 46]], P.use(cream));
  // 法杖
  p.rect(6, 22, 4, 42, P.use(wood));
  p.poly([[8, 10], [12, 16], [8, 24], [4, 16]], '#ffb83a');
  p.set(7, 14, '#fff6c0').set(8, 13, '#ffffff');
  neck(P, SKIN);
  head(P, SKIN, 12.5, 14.5);
  // 秃顶 + 两侧白发
  p.ellipse(19, 26, 4, 7, P.use(beard));
  p.ellipse(45, 26, 4, 7, beard.base);
  // 大胡子
  p.poly([[20, 32], [24, 38], [32, 40], [40, 38], [44, 32], [46, 42], [40, 54], [32, 60], [24, 54], [18, 42]], beard.base);
  p.rect(27, 35, 10, 2, beard.base);
  p.rect(30, 37, 4, 1, '#b4505a');
  eyes(p, '#6a4020', { y: 28, look: -1 });
  // 浓眉
  p.rect(22, 24, 7, 2, beard.base).rect(35, 24, 7, 2, beard.base);
  nose(p, SKIN);
  p.rect(25, 18, 4, 1, SKIN.dark).rect(34, 16, 3, 1, SKIN.dark); // 皱纹
  blush(p);
  return finish(P, (q) => {
    q.set(27, 14, '#ffffff').set(28, 14, '#ffffff');
  });
}

function trader(special = false): string {
  const P = painter();
  const { p } = P;
  // 暗墙后的特殊商人：紫金配色
  const coat = special ? mat('#a83ac8', '#d880f0', '#6e2090') : mat('#3c5ad8', '#7090ff', '#283c9c');
  const cap = special ? mat('#8a2aa8', '#c060e0', '#561a70') : mat('#3446c8', '#6878ff', '#222e90');
  const hair = mat('#8a5428', '#b47a44', '#5a3414');
  const pouch = mat('#a06a34', '#cf9a5c', '#6c4418');
  torso(P, coat, 28);
  p.poly([[26, 46], [32, 56], [38, 46]], '#fff3dc');
  for (const y of [52, 57, 62]) p.rect(24, y, 2, 2, '#ffcf4a').rect(38, y, 2, 2, '#ffcf4a');
  p.line(40, 46, 52, 62, '#6c4418', 3);
  p.ellipse(50, 58, 5, 5, P.use(pouch));
  p.rect(48, 53, 4, 2, '#ffcf4a');
  neck(P, SKIN);
  head(P, SKIN, 13.5, 14.5);
  p.rect(17, 22, 4, 12, P.use(hair)).rect(43, 22, 4, 12, hair.base);
  // 商人帽
  p.ellipse(32, 15, 17, 7, P.use(cap));
  p.rect(16, 17, 32, 4, cap.dark);
  p.rect(17, 18, 30, 1, '#ffcf4a');
  p.ellipse(44, 18, 2.5, 2.5, '#ffcf4a');
  eyes(p, '#5a3414', { y: 27, look: -1, brow: hair.dark });
  nose(p, SKIN);
  p.ellipse(32, 33, 2.5, 2, SKIN.dark);
  // 八字胡
  p.poly([[24, 37], [31, 34], [32, 36], [26, 38], [22, 37]], hair.base);
  p.poly([[40, 37], [33, 34], [32, 36], [38, 38], [42, 37]], hair.base);
  smile(p, 38, 6);
  blush(p);
  return finish(P);
}

function blessTrader(): string {
  const P = painter();
  const { p } = P;
  const robe = mat('#9a5ad8', '#c890ff', '#6a3aa0');
  const turban = mat('#a46ae0', '#d4a4ff', '#70409e');
  const beard = mat('#c8c8d8', '#f0f0f8', '#9a9ab4');
  torso(P, robe, 27);
  p.poly([[24, 46], [32, 62], [40, 46]], '#ffcf4a');
  p.poly([[26, 46], [32, 58], [38, 46]], robe.base);
  for (let x = 10; x < 56; x += 6) p.set(x, 54 + ((x / 6) % 2), '#ffcf4a');
  p.ellipse(32, 58, 2.5, 2.5, '#d14ae0');
  neck(P, SKIN);
  head(P, SKIN);
  // 头巾
  p.ellipse(32, 14, 16, 10, P.use(turban));
  p.line(17, 18, 47, 10, turban.dark, 2);
  p.line(17, 12, 47, 20, turban.light, 1);
  p.poly([[32, 9], [35, 13], [32, 17], [29, 13]], '#ffcf4a');
  p.poly([[32, 11], [33.5, 13], [32, 15], [30.5, 13]], '#d14ae0');
  // 短须
  p.poly([[21, 32], [26, 40], [32, 46], [38, 40], [43, 32], [44, 38], [38, 46], [32, 49], [26, 46], [20, 38]], P.use(beard));
  p.rect(27, 35, 10, 2, beard.base);
  p.rect(30, 38, 4, 1, '#b4505a');
  eyes(p, '#5a3414', { look: -1, brow: beard.dark });
  nose(p, SKIN);
  return finish(P, (q) => {
    sparkle(q, 8, 18);
    sparkle(q, 56, 28);
    sparkle(q, 12, 36, '#e7c8ff');
    sparkle(q, 53, 8, '#e7c8ff');
  });
}

function altar(): string {
  const P = painter();
  const { p } = P;
  const gold = mat('#ffcf4a', '#fff19a', '#d48a1e');
  const stone = mat('#f2ecdc', '#ffffff', '#c8bea4');
  const wing = mat('#ffffff', '#ffffff', '#d8d4ec');
  // 光环
  p.ellipse(32, 24, 22, 20, P.use(wing));
  p.ellipse(32, 24, 19, 17, null);
  // 羽翼（三层羽毛）
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      p.ellipse(32 + side * (17 + i * 2), 30 + i * 4, 6 - i, 2.6, wing.base);
    }
  }
  // 神像
  const goldD = mat('#e8a82c', '#ffd65a', '#b8761a');
  p.ellipse(32, 41, 15, 6, P.use(goldD)); // 肩
  p.rect(23, 14, 18, 22, goldD.base); // 垂发
  p.rect(28, 34, 8, 5, goldD.base); // 颈
  p.ellipse(32, 25, 9, 11, P.use(gold)); // 脸
  p.poly([[20, 15], [24, 4], [28, 11], [32, 2], [36, 11], [40, 4], [44, 15]], gold.base);
  p.poly([[32, 8], [35, 11], [32, 15], [29, 11]], '#ff4dbd');
  // 合目微笑
  p.rect(26, 25, 4, 1, '#9c5a12').set(25, 24, '#9c5a12').set(30, 24, '#9c5a12');
  p.rect(34, 25, 4, 1, '#9c5a12').set(33, 24, '#9c5a12').set(38, 24, '#9c5a12');
  p.rect(32, 27, 1, 3, gold.dark);
  smile(p, 31, 4, '#c47c16');
  p.rect(26, 28, 2, 1, '#ffb0a0').rect(37, 28, 2, 1, '#ffb0a0');
  // 石台
  p.rect(10, 44, 44, 6, P.use(stone));
  p.rect(14, 50, 36, 12, stone.base);
  p.rect(8, 60, 48, 4, stone.base);
  p.rect(14, 46, 36, 1, '#ffcf4a');
  p.poly([[32, 51], [36, 55], [32, 59], [28, 55]], '#ff4dbd');
  p.rect(18, 53, 2, 6, stone.dark).rect(44, 53, 2, 6, stone.dark);
  return finish(P, (q) => {
    sparkle(q, 6, 40);
    sparkle(q, 58, 40);
    sparkle(q, 32, 42, '#ffd0ef');
    q.set(31, 9, '#ffffff');
  });
}

function demonKing(): string {
  const P = painter();
  const { p } = P;
  const skin = mat('#d23a4e', '#f2687a', '#98243a');
  const armor = mat('#3a2f52', '#5e5080', '#22193a');
  const collar = mat('#7a3ac8', '#a970f0', '#4f2390');
  const horn = mat('#3e3550', '#6a5e84', '#221a33');
  const hair = mat('#2e2440', '#4c3e66', '#1a1428');
  // 高领披风
  p.poly([[6, 64], [10, 40], [22, 46], [42, 46], [54, 40], [58, 64]], P.use(collar));
  torso(P, armor, 24);
  for (const [x, y] of [[14, 50], [50, 50]]) p.poly([[x - 6, y + 4], [x, y - 8], [x + 6, y + 4]], '#ffcf4a');
  p.poly([[32, 48], [36, 54], [32, 60], [28, 54]], '#ff3a5c');
  p.rect(22, 52, 20, 1, '#ffcf4a');
  neck(P, skin);
  head(P, skin, 12, 14.5);
  // 犄角
  p.poly([[20, 18], [10, 10], [8, 0], [14, 6], [24, 12]], P.use(horn));
  p.poly([[44, 18], [54, 10], [56, 0], [50, 6], [40, 12]], horn.base);
  // 头发
  p.ellipse(32, 16, 13, 6, P.use(hair));
  p.poly([[19, 18], [22, 28], [25, 18]], hair.base);
  p.poly([[39, 18], [42, 28], [45, 18]], hair.base);
  // 王冠
  p.poly([[22, 14], [22, 6], [26, 10], [29, 3], [32, 9], [35, 3], [38, 10], [42, 6], [42, 14]], '#ffcf4a');
  p.rect(22, 12, 20, 2, '#e09a1e');
  p.poly([[32, 7], [34, 10], [32, 13], [30, 10]], '#a050ff');
  eyes(p, '#ffe14a', { glow: true, brow: INK, angry: true });
  nose(p, skin);
  // 獠牙笑
  p.rect(27, 36, 10, 2, '#5a1020');
  p.set(28, 37, '#ffffff').set(28, 38, '#ffffff').set(35, 37, '#ffffff').set(35, 38, '#ffffff');
  p.set(26, 35, '#5a1020').set(37, 35, '#5a1020');
  // 尖耳
  p.poly([[19, 26], [13, 22], [20, 32]], skin.base);
  p.poly([[45, 26], [51, 22], [44, 32]], skin.base);
  return finish(P);
}

function skeletonCaptain(): string {
  const P = painter();
  const { p } = P;
  const bone = mat('#f2ead2', '#ffffff', '#c8bc98');
  const steel = mat('#8fa0c4', '#c4d0ec', '#5e6a90');
  const gold = mat('#ffcf4a', '#fff19a', '#c47c16');
  const plume = mat('#e83a4a', '#ff7a84', '#a02030');
  const shaft = mat('#8a5a2c', '#b9844c', '#5c3816');
  // 战斧
  p.rect(8, 14, 4, 50, P.use(shaft));
  p.poly([[11, 12], [2, 6], [0, 18], [2, 30], [11, 24]], P.use(steel));
  // 盔甲与护肩
  torso(P, steel, 26);
  p.rect(24, 46, 16, 18, '#6a3aa0');
  p.rect(31, 46, 2, 18, '#ffcf4a');
  p.ellipse(14, 52, 10, 8, steel.base);
  p.ellipse(50, 52, 10, 8, steel.base);
  // 脖子（脊椎）
  p.rect(29, 38, 6, 8, bone.dark);
  p.rect(28, 41, 8, 1, bone.light);
  // 头骨
  p.ellipse(32, 27, 12, 13, P.use(bone));
  p.rect(25, 36, 14, 5, bone.base);
  // 眼窝与红光
  p.ellipse(27, 28, 3.5, 3, INK);
  p.ellipse(37, 28, 3.5, 3, INK);
  p.rect(26, 27, 3, 2, '#ff3a3a').set(26, 27, '#ffd0d0');
  p.rect(36, 27, 3, 2, '#ff3a3a').set(36, 27, '#ffd0d0');
  p.poly([[32, 31], [34, 34], [30, 34]], INK);
  // 牙齿
  p.rect(26, 37, 12, 1, INK);
  for (let x = 27; x < 38; x += 2) p.rect(x, 38, 1, 2, INK);
  // 头盔
  p.ellipse(32, 19, 14, 9, P.use(gold));
  p.rect(18, 21, 28, 3, gold.base);
  p.rect(30, 12, 4, 10, gold.dark);
  for (const x of [21, 26, 38, 43]) p.set(x, 22, '#fff3b0');
  // 羽饰
  p.poly([[33, 11], [40, 2], [50, 4], [56, 12], [52, 20], [46, 14], [38, 12]], P.use(plume));
  return finish(P, (q) => {
    // 护肩的层叠甲片、金边与铆钉
    for (const cx of [14, 50]) {
      q.line(cx - 9, 53, cx + 9, 53, steel.dark);
      q.line(cx - 8, 57, cx + 8, 57, steel.dark);
      q.line(cx - 9, 48, cx + 9, 48, '#ffcf4a');
      q.set(cx - 5, 50, '#fff3b0').set(cx + 5, 50, '#fff3b0');
    }
    q.rect(8, 55, 3, 2, '#a8542a').rect(53, 59, 3, 2, '#a8542a'); // 锈迹
    q.set(5, 12, '#ffffff').set(4, 14, '#ffffff');
  });
}

/** 吸血鬼（第 20 层头目）：苍白面容、背头、红瞳獠牙、红内衬高领披风 */
function vampire(): string {
  const P = painter();
  const { p } = P;
  const skin = mat('#ece4f4', '#ffffff', '#bcaed6');
  const cape = mat('#2c2244', '#4c3e70', '#18122a');
  const lining = mat('#d42a4a', '#ff6a7e', '#8e1430');
  const hair = mat('#1e1830', '#3c3058', '#100c1c');
  const shirt = mat('#f4f0ff', '#ffffff', '#c8c0e0');
  // 高领披风（外黑内红）
  p.poly([[2, 64], [6, 30], [18, 42], [46, 42], [58, 30], [62, 64]], P.use(lining));
  p.poly([[2, 64], [6, 30], [12, 40], [14, 64]], P.use(cape));
  p.poly([[62, 64], [58, 30], [52, 40], [50, 64]], cape.base);
  torso(P, cape, 22);
  p.poly([[26, 46], [32, 60], [38, 46]], P.use(shirt));
  p.poly([[29, 47], [32, 52], [35, 47]], lining.base);
  p.ellipse(32, 55, 2.4, 2.4, '#ffcf4a');
  p.set(31, 54, '#fff3b0');
  neck(P, skin);
  head(P, skin, 12, 14.5);
  // 背头 + 美人尖
  p.poly([[19, 26], [18, 14], [24, 8], [32, 6], [40, 8], [46, 14], [45, 26], [41, 18], [32, 22], [23, 18]], P.use(hair));
  p.set(26, 10, hair.light).set(27, 9, hair.light).set(36, 9, hair.light);
  // 尖耳
  p.poly([[20, 26], [12, 20], [20, 33]], skin.base);
  p.poly([[44, 26], [52, 20], [44, 33]], skin.base);
  eyes(p, '#ff2244', { glow: true, brow: INK, angry: true });
  nose(p, skin);
  // 冷笑与獠牙
  p.rect(27, 37, 10, 1, '#8e1430');
  p.set(26, 36, '#8e1430').set(37, 36, '#8e1430');
  p.set(28, 38, '#ffffff').set(28, 39, '#ffffff').set(35, 38, '#ffffff').set(35, 39, '#ffffff');
  return finish(P, (q) => {
    // 披风上的蝙蝠剪影
    q.stamp(6, 6, ['B...B', 'BB.BB', '.BBB.'], { B: '#4c3e70' });
    q.stamp(52, 10, ['B...B', 'BB.BB', '.BBB.'], { B: '#4c3e70' });
  });
}

/** 生成全部头像（Face → dataURL） */
/** 26F 洋娃娃（「公主」）：金色卷发、小王冠、粉色蓬裙，眼睛是玻璃珠一样的大圆眼 */
function princess(): string {
  const P = painter();
  const { p } = P;
  const skin = mat('#ffe0c8', '#fff0e2', '#eab496');
  const dress = mat('#ff8ab8', '#ffc0d8', '#d4568c');
  const hair = mat('#ffd34e', '#fff09a', '#d89a1e');
  const lace = mat('#ffffff', '#ffffff', '#e2d6ee');
  // 卷发披肩
  p.ellipse(32, 34, 21, 22, P.use(hair));
  for (const [x, y] of [[12, 44], [52, 44], [14, 54], [50, 54]]) p.ellipse(x, y, 5, 6, hair.base);
  // 蓬蓬裙 + 蕾丝领
  p.poly([[8, 64], [18, 46], [46, 46], [56, 64]], P.use(dress));
  p.ellipse(32, 47, 12, 4, P.use(lace));
  p.poly([[29, 50], [32, 56], [35, 50]], '#ff5a9a');
  for (let x = 12; x < 54; x += 6) p.set(x, 62, '#ffe0ee');
  neck(P, skin);
  head(P, skin, 12, 13.5);
  // 刘海
  p.poly([[19, 24], [21, 13], [32, 10], [43, 13], [45, 24], [40, 18], [34, 21], [28, 17], [23, 22]], hair.base);
  // 小王冠
  p.poly([[25, 12], [25, 6], [28, 9], [32, 4], [36, 9], [39, 6], [39, 12]], '#ffcf4a');
  p.rect(25, 11, 14, 2, '#e09a1e');
  p.set(32, 8, '#ff3a8a');
  // 玻璃珠大眼（洋娃娃）
  for (const ex of [25, 35]) {
    p.ellipse(ex + 2, 29, 3.4, 3.6, '#ffffff');
    p.ellipse(ex + 2, 29.5, 2.4, 2.8, '#4a7cff');
    p.rect(ex + 2, 29, 1, 2, INK);
    p.set(ex + 1, 28, '#ffffff');
    p.rect(ex, 25, 5, 1, INK);
  }
  // 腮红 + 小嘴
  p.ellipse(23, 34, 2.2, 1.2, '#ffa0b4');
  p.ellipse(41, 34, 2.2, 1.2, '#ffa0b4');
  p.rect(31, 37, 3, 1, '#e04a6a');
  return finish(P);
}

/** 骑士队长：金色全盔（T 形面罩）、红色羽饰、金边胸甲 */
function goldKnight(): string {
  const P = painter();
  const { p } = P;
  const gold = mat('#f2c240', '#ffe68a', '#b47c14');
  const steel = mat('#9aa8c8', '#d0daf0', '#5e6a90');
  const plume = mat('#e8344a', '#ff7684', '#9c1c2e');
  const cloth = mat('#3a5ad0', '#6a88f0', '#22328a');
  // 披风 + 胸甲
  p.poly([[4, 64], [8, 42], [56, 42], [60, 64]], P.use(cloth));
  torso(P, gold, 25);
  p.rect(30, 46, 4, 18, '#ffffff');
  p.ellipse(13, 50, 10, 8, P.use(steel));
  p.ellipse(51, 50, 10, 8, steel.base);
  p.poly([[32, 50], [37, 55], [32, 61], [27, 55]], '#e8344a');
  // 头盔
  p.rect(26, 36, 12, 9, steel.dark);
  p.ellipse(32, 26, 14, 16, gold.base);
  p.rect(18, 26, 28, 12, gold.base);
  // T 形面罩
  p.rect(21, 25, 22, 4, INK);
  p.rect(30, 25, 4, 12, INK);
  p.rect(23, 26, 6, 2, '#ffe14a');
  p.rect(35, 26, 6, 2, '#ffe14a');
  for (const y of [31, 34]) for (const x of [22, 25, 38, 41]) p.set(x, y, gold.dark);
  p.rect(31, 6, 2, 10, gold.dark);
  // 羽饰
  p.poly([[33, 8], [42, 0], [54, 2], [60, 10], [54, 16], [46, 10], [38, 10]], P.use(plume));
  return finish(P, (q) => {
    q.line(19, 21, 45, 21, '#fff3b0');
    for (const cx of [13, 51]) q.line(cx - 8, 52, cx + 8, 52, steel.dark);
  });
}

/** 25F 大法师：深色兜帽法袍，兜帽阴影里只露出发光的紫眼，胸前悬浮法珠 */
function blackMagician(): string {
  const P = painter();
  const { p } = P;
  const robe = mat('#2e2648', '#4e4278', '#1a1430');
  const trim = mat('#ffcf4a', '#fff19a', '#c47c16');
  const orb = mat('#b06aff', '#e2c4ff', '#6a2cc0');
  // 法袍与兜帽
  p.poly([[2, 64], [10, 38], [54, 38], [62, 64]], P.use(robe));
  p.ellipse(32, 28, 19, 22, robe.base);
  p.poly([[14, 30], [32, 2], [50, 30]], robe.base);
  // 兜帽里的阴影脸
  p.ellipse(32, 31, 11, 12, '#120c22');
  for (const ex of [26, 36]) { p.rect(ex - 1, 29, 4, 2, '#c890ff'); p.set(ex, 29, '#ffffff'); }
  p.rect(29, 37, 6, 1, '#3a2a5a');
  // 金边
  p.line(14, 42, 32, 50, P.use(trim), 2);
  p.line(50, 42, 32, 50, trim.base, 2);
  p.rect(31, 50, 2, 14, trim.base);
  // 法珠
  p.ellipse(32, 57, 5, 5, P.use(orb));
  p.set(30, 55, '#ffffff').set(31, 55, '#ffffff');
  return finish(P, (q) => {
    for (const [x, y] of [[8, 48], [56, 46], [20, 60], [46, 60]]) q.set(x, y, '#e2c4ff');
  });
}

/** 真魔王（50F，小偷变身）：与 3F 的魔王同族，深红重甲 + 双层犄角 + 智慧权杖的宝石 */
function redKing(): string {
  const P = painter();
  const { p } = P;
  const skin = mat('#b8243c', '#e2506a', '#7a1428');
  const armor = mat('#4a1424', '#7a2a40', '#2a0a14');
  const cape = mat('#1a1428', '#3a2e52', '#0c0814');
  const horn = mat('#e8e0d0', '#ffffff', '#a89a80');
  p.poly([[2, 64], [8, 36], [24, 46], [40, 46], [56, 36], [62, 64]], P.use(cape));
  torso(P, armor, 25);
  for (const [x, y] of [[12, 50], [52, 50]]) p.poly([[x - 7, y + 5], [x, y - 10], [x + 7, y + 5]], '#ffcf4a');
  p.ellipse(32, 54, 4, 4, '#3ae0ff');
  p.set(31, 53, '#ffffff');
  neck(P, skin);
  head(P, skin, 12, 14.5);
  // 双层犄角
  p.poly([[20, 20], [8, 12], [4, 0], [12, 6], [24, 14]], P.use(horn));
  p.poly([[44, 20], [56, 12], [60, 0], [52, 6], [40, 14]], horn.base);
  p.poly([[22, 16], [16, 4], [20, 2], [26, 12]], horn.dark);
  p.poly([[42, 16], [48, 4], [44, 2], [38, 12]], horn.dark);
  p.ellipse(32, 15, 12, 5, '#1a1428');
  eyes(p, '#ff2a2a', { glow: true, brow: INK, angry: true });
  nose(p, skin);
  p.rect(27, 36, 10, 2, '#3a0a14');
  p.set(28, 37, '#ffffff').set(35, 37, '#ffffff');
  p.poly([[19, 26], [12, 21], [20, 32]], skin.base);
  p.poly([[45, 26], [52, 21], [44, 32]], skin.base);
  return finish(P);
}

export function buildPortraits(): Record<string, string> {
  return {
    hero: hero(),
    thief: thief(),
    oldman: oldman(),
    trader: trader(),
    blessTrader: blessTrader(),
    altar: altar(),
    demonKing: demonKing(),
    skeletonCaptain: skeletonCaptain(),
    specialTrader: trader(true),
    vampire: vampire(),
    princess: princess(),
    goldKnight: goldKnight(),
    yellowKnight: goldKnight(),
    blackMagician: blackMagician(),
    redKing: redKing(),
  };
}
