/**
 * 从 H5 魔塔广场「50层魔塔」(h5mota.com/games/51) 的工程数据生成第一区地图。
 * 用法：node scripts/import-h5.mjs [工程目录，默认 docs/h5-51-source]
 * 13×13 原始地图去掉外圈墙 → 11×11；坐标全部减 1。
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] || 'docs/h5-51-source';
globalThis.main = { floors: {} };
const CODE = {
  0: '.', 1: '#', 2: '?', 3: '!', 5: 'L', 17: '~', 321: 'Z', 330: 'X', 7: '<', 8: '>', 131: 'A',
  21: 'Y', 22: 'B', 23: 'R', 27: 'a', 28: 'd', 31: 'h', 32: 'H', 35: 'W', 36: 'D', 46: 'F', 73: 'M',
  37: 'w', 38: 'e', 43: 'K', 47: 'P',
  81: 'y', 82: 'b', 83: 'r', 85: 'g', 86: 'i', 87: 'U', 88: 'N',
  121: 'O', 122: 'T', 123: 'S', 124: 'Q', 127: '.',
  203: 'j', 206: 'k', 213: 'l', 214: 'm', 215: 'n', 216: 'o', 218: 'p', 258: 'q',
  201: '1', 202: '2', 205: '3', 217: '4', 209: '5', 210: '6', 221: '7', 222: '8', 211: '9',
  // 第三–五区 + 0F
  4: '*', 103: '.', 168: '(', 132: '@', 131: 'A',
  204: 'c', 207: 'f', 212: 's', 219: 't', 220: 'u', 223: 'v', 224: 'x', 225: 'z', 226: 'C', 227: 'E', 228: 'G', 246: 'I', 247: 'J', 257: 'V', 
  49: '=', 50: '-', 331: '-', 51: '/', 52: '|', 53: ';', 54: ':', 62: "'", 26: ',',
  39: '$', 40: '%', 41: '^', 42: '&', 44: '+', 245: '0',
};
const ENEMY_BG = { 209: '5', 210: '6', 206: 'k' };
/** 第 20 层：吸血鬼房间的 8 只大蝙蝠（事件中合体为吸血鬼）——原数据一只在主层、六只在背景层、一格被 whiteWall2 盖住，这里统一放成大蝙蝠 */
const RING20 = [[4, 4], [5, 4], [6, 4], [4, 5], [6, 5], [4, 6], [5, 6], [6, 6]];
const zones = { 1: [1, 10], 2: [11, 20], 3: [21, 30], 4: [31, 40], 5: [41, 50], 0: [0, 0] };
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
for (const [zone, [lo, hi]] of Object.entries(zones)) {
if (ONLY && !ONLY.includes(zone)) continue;
const out = [];
for (let n = lo; n <= hi; n++) {
  const src = fs.readFileSync(path.join(dir, 'floors', `MT${n}.js`), 'utf8');
  eval(src);
  const f = globalThis.main.floors[`MT${n}`];
  const rows = [];
  for (let y = 1; y <= 11; y++) {
    let r = '';
    for (let x = 1; x <= 11; x++) {
      const v = f.map[y][x];
      let ch = CODE[v];
      // 第 23 层：whiteWall2 = 隐形迷宫墙（原版绘制为空气墙，触碰后变为普通墙）
      if (n === 23 && v === 321) ch = '"';
      // 第 32 / 49 层：whiteWall2 与空气墙同为不可见的阻挡（剧情中被移除）
      if ((n === 32 || n === 49) && v === 321) ch = '~';
      // 第 38 层的单向花丛只能向下通过（33 层只能向右）
      if (n === 38 && v === 168) ch = ')';
      // 第 28 层的回收钥匙商人（原版 specialTrader，与 2F 祝福商人同图块）
      if (n === 28 && v === 124) ch = '`';
      // 第 42 层的骑士队长只是剧情角色（撞上去无效果，左侧空地触发剧情）
      if (n === 42 && v === 226) ch = '_';
      if (ch === undefined) throw new Error(`MT${n} 未知图块 ${v} @${x - 1},${y - 1}`);
      // 第 10 层：背景层中的"贴图骷髅"在伏击时会成为真正的怪物，这里直接放入
      if (ch === '.' && f.bgmap && ENEMY_BG[f.bgmap[y][x]]) ch = ENEMY_BG[f.bgmap[y][x]];
      r += ch;
    }
    rows.push(r);
  }
  // 初始隐藏（enable:false）的事件格：第 1 层作者 NPC、第 2 层右下小偷（35 层剧情）、第 10 层上楼梯（击败头目后出现）
  for (const [k, ev] of Object.entries(f.events || {})) {
    if (!ev || ev.enable !== false) continue;
    const [ex, ey] = k.split(',').map(Number);
    const r = rows[ey - 1];
    rows[ey - 1] = r.slice(0, ex - 1) + '.' + r.slice(ex);
  }
  if (n === 20) for (const [x, y] of RING20) rows[y] = rows[y].slice(0, x) + 'k' + rows[y].slice(x + 1);
  const p = (a) => (a ? { x: a[0] - 1, y: a[1] - 1 } : undefined);
  out.push({ id: n, name: `第 ${n} 层`, title: f.title, ratio: f.ratio, map: rows, arriveFromBelow: p(f.downFloor), arriveFromAbove: p(f.upFloor) });
}
const ts = `/* 本文件由 scripts/import-h5.mjs 自动生成，数据来源：h5mota.com/games/51（50层魔塔 flash 复刻版） */
import type { FloorData } from '../types';

export const ZONE${zone}: FloorData[] = ${JSON.stringify(out, null, 2)
  .replace(/"(\w+)":/g, '$1:')
  .replace(/\{\s+x: (\d+),\s+y: (\d+)\s+\}/g, '{ x: $1, y: $2 }')};
`;
fs.writeFileSync(`src/game/floors/zone${zone}.ts`, ts);
console.log(`写入 src/game/floors/zone${zone}.ts`);
for (const f of out) console.log(f.id, f.arriveFromBelow, f.arriveFromAbove, '\n' + f.map.join('\n'));
}
