/**
 * 第一 / 二区的法师系怪物（以及 25F 大法师）重绘：用户反馈它们与老人（棕袍 + 白胡子 + 法杖）太像。
 * 三者都不留胡子、不拿法杖，各自用不同的轮廓区分，也与第五区的兜帽巫师（阴影脸 + 双手魔焰 + 脚下法阵）区分：
 *  - 初级法师：蓝色短斗篷的少年学徒，露出圆脸与刘海，双手捧着一本发光的魔法书（书页翻动）。
 *  - 高级法师：深红长袍 + 高耸的金边主教冠，面容严肃，双手之间悬着一颗脉动的琥珀水晶球。
 *  - 大法师：黑紫长袍、尖刺高领与肩甲、苍白面具与三尖王冠，身边环绕三颗紫色魔球。
 * 每个 4 帧待机动画 + 眨眼帧，32×32 网格，与其他精灵相同的描边 / 高光规范。
 */
import { Pix } from './pixel';

const OUT = '#2a1b3d';
const GOLD = '#ffcf4a';
const GOLD_L = '#fff1a6';
const GOLD_D = '#d08a1c';
const SKIN = '#ffd3aa';
const SKIN_D = '#eaa77e';
const WHITE = '#ffffff';

/** 初级法师：蓝斗篷学徒 + 发光魔法书 */
export function acolyteSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, -1, 0][frame];
  const R = '#4f7cf0', RL = '#9cc0ff', RD = '#2c48b0';
  // 斗篷（短而圆的钟形，下摆露出靴子）
  p.poly([[11, 13 + b], [21, 13 + b], [25, 27 + b], [7, 27 + b]], R);
  p.autoShade([R], RL, RD);
  p.rect(7, 26 + b, 18, 1, '#cfe0ff');
  p.rect(10, 28, 4, 2, '#5a3a2a');
  p.rect(18, 28, 4, 2, '#5a3a2a');
  // 浅色内衫领口（V 形，不是胡子：位于脖子以下、两侧有蓝色斗篷边）
  p.poly([[13, 13 + b], [19, 13 + b], [16, 17 + b]], '#cfe0ff');
  // 头：圆脸 + 棕色刘海 + 披在后脑的蓝色兜帽（不盖住脸）
  p.ellipse(16, 8 + b, 7, 6.2, RD);
  p.ellipse(16, 9 + b, 5.2, 4.8, SKIN);
  p.rect(11, 4 + b, 10, 2, '#8a5a3a');
  p.set(12, 6 + b, '#8a5a3a');
  p.set(15, 6 + b, '#8a5a3a');
  p.set(19, 6 + b, '#8a5a3a');
  p.rect(13, 4 + b, 3, 1, '#b07a4a');
  if (blink) {
    p.rect(13, 9 + b, 2, 1, SKIN_D);
    p.rect(17, 9 + b, 2, 1, SKIN_D);
  } else {
    p.rect(13, 8 + b, 2, 2, OUT);
    p.rect(17, 8 + b, 2, 2, OUT);
    p.set(13, 8 + b, WHITE);
    p.set(17, 8 + b, WHITE);
  }
  p.set(12, 11 + b, '#ff9a9a');
  p.set(20, 11 + b, '#ff9a9a');
  p.rect(15, 12 + b, 2, 1, '#c86a5a');
  // 双手捧书（书在胸前，随帧轻轻上浮）
  const bb = [0, -1, -2, -1][frame];
  p.ellipse(9.5, 20 + b, 2, 1.8, SKIN);
  p.ellipse(22.5, 20 + b, 2, 1.8, SKIN);
  p.poly([[10, 17 + bb], [16, 18 + bb], [22, 17 + bb], [22, 22 + bb], [16, 23 + bb], [10, 22 + bb]], '#f4ecd8');
  p.rect(16, 18 + bb, 1, 5, '#8a6a4a');
  p.rect(10, 22 + bb, 13, 1, '#3a5ab8');
  // 书页上的发光符文（逐帧变化 = 翻页感）
  const glyph = ['#6ad8ff', '#9af0ff', '#ffffff', '#9af0ff'][frame];
  p.rect(12, 19 + bb, 3, 1, glyph);
  p.rect(18, 20 + bb, 3, 1, glyph);
  p.set(13, 21 + bb, glyph);
  p.set(19, 19 + bb, glyph);
  p.outline(OUT);
  // 书上方飘起的光点（不描边）
  const sp: Array<[number, number]> = [[14, 15], [18, 14], [16, 13], [20, 15]];
  const [sx, sy] = sp[frame];
  p.set(sx, sy + bb, '#bff6ff');
  p.set(sx + 1, sy + bb - 1, WHITE);
  return p;
}

/** 高级法师：深红长袍 + 金边主教冠 + 琥珀水晶球 */
export function hierophantSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, -2, -1][frame];
  const R = '#c8304a', RL = '#ff7f8a', RD = '#7a1a30';
  // 长袍（宽下摆 + 两侧金边）
  p.poly([[10, 13 + b], [22, 13 + b], [27, 29], [5, 29]], R);
  p.autoShade([R], RL, RD);
  p.rect(5, 28, 23, 1, GOLD);
  p.line(10, 14 + b, 6, 28, GOLD_D);
  p.line(22, 14 + b, 26, 28, GOLD_D);
  // 胸前的黑底金纹披带
  p.poly([[13, 13 + b], [19, 13 + b], [18, 27], [14, 27]], '#2a1838');
  for (let y = 15; y <= 25; y += 3) p.rect(15, y + (y < 20 ? b : 0), 2, 1, GOLD);
  // 立领（金色）
  p.rect(11, 12 + b, 10, 2, GOLD);
  p.rect(11, 12 + b, 10, 1, GOLD_L);
  // 脸（无胡子，眉毛严肃）
  p.ellipse(16, 9 + b, 4.2, 3.8, SKIN);
  p.rect(13, 7 + b, 2, 1, '#5a2a1a');
  p.rect(17, 7 + b, 2, 1, '#5a2a1a');
  if (blink) {
    p.rect(13, 9 + b, 2, 1, SKIN_D);
    p.rect(17, 9 + b, 2, 1, SKIN_D);
  } else {
    p.rect(13, 8 + b, 2, 2, OUT);
    p.rect(17, 8 + b, 2, 2, OUT);
    p.set(14, 8 + b, '#ffb03b');
    p.set(18, 8 + b, '#ffb03b');
  }
  p.rect(15, 11 + b, 2, 1, SKIN_D);
  // 主教冠（高耸，中间分叉，金十字）
  p.poly([[11, 6 + b], [21, 6 + b], [20, 2 + b], [16, 0 + b], [12, 2 + b]], R);
  p.autoShade([R], RL, RD);
  p.rect(11, 5 + b, 11, 1, GOLD);
  p.rect(15, 1 + b, 2, 4, GOLD);
  p.rect(14, 2 + b, 4, 1, GOLD);
  p.set(16, 1 + b, GOLD_L);
  // 双臂前伸，掌心之间悬着水晶球
  p.poly([[10, 14 + b], [7, 20 + b], [10, 21 + b], [12, 16 + b]], RD);
  p.poly([[22, 14 + b], [25, 20 + b], [22, 21 + b], [20, 16 + b]], RD);
  p.ellipse(9, 21 + b, 1.8, 1.6, SKIN);
  p.ellipse(23, 21 + b, 1.8, 1.6, SKIN);
  const orb = ['#ffb03b', '#ffd27a', '#fff1a6', '#ffd27a'][frame];
  p.ellipse(16, 20 + b, 3.4, 3.4, orb);
  p.ellipse(15, 19 + b, 1.2, 1.2, WHITE);
  p.set(17, 22 + b, GOLD_D);
  p.outline(OUT);
  // 水晶球的光芒（脉动，不描边）
  const rays: Array<Array<[number, number]>> = [
    [[16, 15]],
    [[12, 18], [20, 18]],
    [[16, 15], [11, 20], [21, 20]],
    [[12, 18], [20, 18]],
  ];
  for (const [x, y] of rays[frame]) p.set(x, y + b, GOLD_L);
  return p;
}

/** 大法师：黑紫长袍 + 尖刺高领 / 肩甲 + 苍白面具 + 三尖冠 + 环绕魔球 */
export function archmageSprite(frame: number, blink: boolean): Pix {
  const p = new Pix();
  const b = [0, -1, -2, -1][frame];
  const R = '#3a2456', RL = '#6e4a9a', RD = '#1c1030';
  // 长袍 + 破碎的斗篷下摆
  p.poly([[9, 13 + b], [23, 13 + b], [28, 29], [24, 27], [20, 29], [16, 27], [12, 29], [8, 27], [4, 29]], R);
  p.autoShade([R], RL, RD);
  p.poly([[14, 14 + b], [18, 14 + b], [19, 27], [13, 27]], '#5a1a2a');
  p.rect(15, 17 + b, 2, 2, '#c04aff');
  // 尖刺肩甲
  p.poly([[5, 11 + b], [12, 13 + b], [11, 17 + b], [6, 16 + b]], '#4a4a66');
  p.poly([[27, 11 + b], [20, 13 + b], [21, 17 + b], [26, 16 + b]], '#4a4a66');
  p.autoShade(['#4a4a66'], '#8a8ab0', '#24243a');
  p.set(5, 10 + b, '#8a8ab0');
  p.set(27, 10 + b, '#8a8ab0');
  // 高领（深紫，两侧尖角）
  p.poly([[9, 13 + b], [10, 5 + b], [13, 10 + b], [19, 10 + b], [22, 5 + b], [23, 13 + b]], RD);
  // 苍白面具 + 发光紫眼
  p.ellipse(16, 9 + b, 4, 3.8, '#e4e0f0');
  p.rect(14, 12 + b, 4, 1, '#b8b4cc');
  if (blink) {
    p.rect(13, 9 + b, 2, 1, '#8a84a8');
    p.rect(17, 9 + b, 2, 1, '#8a84a8');
  } else {
    p.rect(13, 8 + b, 2, 2, '#2a0a3a');
    p.rect(17, 8 + b, 2, 2, '#2a0a3a');
    p.set(13, 8 + b, '#e07aff');
    p.set(17, 8 + b, '#e07aff');
  }
  p.set(16, 10 + b, '#b8b4cc');
  // 三尖王冠
  p.rect(12, 5 + b, 9, 1, GOLD_D);
  p.poly([[12, 5 + b], [13, 1 + b], [14, 5 + b]], GOLD);
  p.poly([[15, 5 + b], [16, 0 + b], [17, 5 + b]], GOLD);
  p.poly([[18, 5 + b], [19, 1 + b], [20, 5 + b]], GOLD);
  p.set(16, 3 + b, '#ff4d63');
  p.outline(OUT);
  // 三颗环绕的魔球（不同相位，绕身体旋转）
  const orbit: Array<[number, number]> = [[3, 20], [7, 4], [25, 3], [29, 19], [24, 26], [8, 26]];
  for (let k = 0; k < 3; k++) {
    const [ox, oy] = orbit[(frame + k * 2) % 6];
    p.ellipse(ox, oy + b, 1.6, 1.6, '#b04aff');
    p.set(ox, oy - 1 + b, '#f0c8ff');
  }
  return p;
}
