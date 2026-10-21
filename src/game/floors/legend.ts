import type { Cell, FloorData } from '../types';

/**
 * 地图字符图例（11×11，由 scripts/import-h5.mjs 从原版数据生成）：
 *  #  墙壁   .  地板   ?  暗墙（撞开）   X  牢墙（剧情打开）   ~  空气墙
 *  U  上楼楼梯   N  下楼楼梯   < A >  祭坛（左侧 / 祭坛商店 / 右侧）
 *  y/b/r  黄/蓝/红门   g  机关门   i  铁门
 *  Y/B/R  黄/蓝/红钥匙   h  红血瓶   H  蓝血瓶   a  红宝石   d  蓝宝石
 *  W  铁剑   D  铁盾   F  魔杖（楼层传送）   M  备忘录
 *  O 老人  T 商人  S 小偷  Q 祝福商人
 *  1 绿色史莱姆 2 红色史莱姆 3 小蝙蝠 4 初级法师 5 骷髅人 6 骷髅士兵
 *  7 初级卫兵 8 中级卫兵 9 骷髅队长
 * 第二区：
 *  !  暗墙（fakeWall2，镐不能破坏，多带事件）   Z  坚固的墙（whiteWall2）   L  岩浆
 *  w  银剑   e  银盾   K  神圣剑   P  镐
 *  j 大史莱姆 k 大蝙蝠 l 兽人 m 兽人武士 n 石头人 o 幽灵 p 高级法师 q 大乌贼（3×3）
 * 第三–五区 / 0F：
 *  _  骑士队长（剧情角色，42F）   "  隐形迷宫墙（23F）   ( )  单向花丛（向右 / 向下）   *  星空（50F）   @  公主（洋娃娃）   `  特殊商人
 *  $ 骑士剑  % 骑士盾  ^ 圣剑  & 圣盾  + 神圣盾  = 炸弹  - 瞬移（3 次）  / 向上传送  | 向下传送
 *  ; 幸运金币  : 冰魔法  , 魔法钥匙  ' 屠龙匕
 *  c 史莱姆王 f 吸血蝙蝠 s 鬼战士 t 初级巫师 u 高级巫师 v 高级卫兵 x 双手剑士 z 战士
 *  C 骑士队长 E 骑士 G 黑暗骑士 I 魔法警卫 J 大法师 V 魔龙（3×3） 0 魔王
 */
export const LEGEND: Record<string, Partial<Cell>> = {
  '#': { terrain: 'wall' },
  '.': {},
  '?': { terrain: 'hiddenWall' },
  X: { terrain: 'sealedWall' },
  '!': { terrain: 'hiddenWall2' },
  Z: { terrain: 'solidWall' },
  L: { terrain: 'lava' },
  w: { item: 'silverSword' },
  e: { item: 'silverShield' },
  K: { item: 'holySword' },
  P: { item: 'pickaxe' },
  j: { monster: 'blackSlime' },
  k: { monster: 'bigBat' },
  l: { monster: 'zombie' },
  m: { monster: 'zombieKnight' },
  n: { monster: 'rock' },
  o: { monster: 'slimeMan' },
  p: { monster: 'redPriest' },
  q: { monster: 'octopus' },
  '~': { terrain: 'airwall' },
  '"': { terrain: 'mazeWall' },
  '(': { terrain: 'flower', oneWay: 'right' },
  ')': { terrain: 'flower', oneWay: 'down' },
  '*': { terrain: 'star' },
  '@': { npc: 'princess' },
  '`': { npc: 'specialTrader' },
  _: { npc: 'goldKnight' },
  $: { item: 'knightSword' },
  '%': { item: 'knightShield' },
  '^': { item: 'sacredSword' },
  '&': { item: 'sacredShield' },
  '+': { item: 'divineShield' },
  '=': { item: 'bomb' },
  '-': { item: 'centerFly' },
  '/': { item: 'upFly' },
  '|': { item: 'downFly' },
  ';': { item: 'coin' },
  ':': { item: 'snow' },
  ',': { item: 'bigKey' },
  "'": { item: 'knife' },
  c: { monster: 'slimelord' },
  f: { monster: 'redBat' },
  s: { monster: 'ghostSkeleton' },
  t: { monster: 'brownWizard' },
  u: { monster: 'redWizard' },
  v: { monster: 'redGuard' },
  x: { monster: 'swordsman' },
  z: { monster: 'soldier' },
  C: { monster: 'yellowKnight' },
  E: { monster: 'redKnight' },
  G: { monster: 'darkKnight' },
  I: { monster: 'whiteKing' },
  J: { monster: 'blackMagician' },
  V: { monster: 'magicDragon' },
  '0': { monster: 'redKing' },
  U: { terrain: 'stairsUp' },
  N: { terrain: 'stairsDown' },
  '<': { terrain: 'altarL' },
  '>': { terrain: 'altarR' },
  A: { npc: 'altar' },
  y: { door: 'yellow' },
  b: { door: 'blue' },
  r: { door: 'red' },
  g: { door: 'special' },
  i: { door: 'iron' },
  Y: { item: 'yellowKey' },
  B: { item: 'blueKey' },
  R: { item: 'redKey' },
  h: { item: 'redPotion' },
  H: { item: 'bluePotion' },
  a: { item: 'redGem' },
  d: { item: 'blueGem' },
  W: { item: 'ironSword' },
  D: { item: 'ironShield' },
  F: { item: 'fly' },
  M: { item: 'notebook' },
  O: { npc: 'oldman' },
  T: { npc: 'trader' },
  S: { npc: 'thief' },
  Q: { npc: 'blessTrader' },
  '1': { monster: 'greenSlime' },
  '2': { monster: 'redSlime' },
  '3': { monster: 'bat' },
  '4': { monster: 'bluePriest' },
  '5': { monster: 'skeleton' },
  '6': { monster: 'skeletonSoldier' },
  '7': { monster: 'yellowGuard' },
  '8': { monster: 'blueGuard' },
  '9': { monster: 'skeletonCaptain' },
};

export const MAP_SIZE = 11;

export function parseFloor(data: FloorData): Cell[][] {
  if (data.map.length !== MAP_SIZE) throw new Error(`楼层 ${data.id} 行数应为 ${MAP_SIZE}`);
  return data.map.map((row, y) => {
    if (row.length !== MAP_SIZE) throw new Error(`楼层 ${data.id} 第 ${y + 1} 行长度应为 ${MAP_SIZE}`);
    return [...row].map((ch, x) => {
      const def = LEGEND[ch];
      if (!def) throw new Error(`楼层 ${data.id} 未知字符 "${ch}" (${x},${y})`);
      return JSON.parse(JSON.stringify({ terrain: 'floor', ...def })) as Cell;
    });
  });
}
