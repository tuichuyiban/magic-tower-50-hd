import type { DoorKind, HeroStats, ItemId, MonsterId, NpcId, Point } from './types';

/**
 * 序章：勇士带着神圣剑、神圣盾进入魔塔（原版 1000/100/100），
 * 在第 3 层遭魔王伏击后被打回 400/10/10 并关进第 2 层监狱。
 */
export const HERO_START: HeroStats = {
  hp: 1000,
  atk: 100,
  def: 100,
  gold: 0,
  keys: { yellow: 0, blue: 0, red: 0 },
  weapon: '神圣剑',
  shield: '神圣盾',
  // 魔杖开局即拥有（与 h5mota 51 号塔 startText 中 setValue item:fly = 1 一致）
  tools: { book: false, fly: true, notebook: false },
  bag: {},
};
export const START_FLOOR = 1;

/**
 * 试玩模式（第二区）：从 11F 开始。攻击 / 防御 = 正常路线到达 11F 时的数值 + 100
 * （正常路线数值取自 scripts/simulate.ts 第一区路线搜索的终局：见 docs/zone1-end.json），生命 10000。
 */
export const ZONE1_ROUTE_END = { atk: 29, def: 36 };
export const TEST_HERO: HeroStats = {
  hp: 10000,
  atk: ZONE1_ROUTE_END.atk + 100,
  def: ZONE1_ROUTE_END.def + 100,
  gold: 5000,
  keys: { yellow: 20, blue: 10, red: 5 },
  weapon: '铁剑',
  shield: '铁盾',
  tools: { book: true, fly: true, notebook: false },
  bag: {},
};
export const TEST_FLOOR = 11;

/**
 * 各区的「正常路线」到达区首时的攻防（试玩模式在此基础上 +100）：
 *  - 第三区（21F）：第二区路线重放终局 820/77/79（docs/zone2-route.txt）；
 *  - 第四区（31F）：第三区没有宝石与装备，攻防不变（攻略同样记载 3 区开始 78/68，见 research.md §16.9）；
 *  - 第五区（41F）：取第四区路线检查终局（docs/zone4-end.json），与 TapTap 攻略「4区 生命71 攻162 防166」一致量级。
 */
export const ZONE2_ROUTE_END = { atk: 77, def: 79 };
/** 第三区路线（scripts/route3.ts）到 31F 时的属性 */
export const ZONE3_ROUTE_END = { atk: 83, def: 85 };
export const ZONE4_ROUTE_END = { atk: 162, def: 166 };

export interface TestZone {
  name: string;
  floor: number;
  hero: HeroStats;
  flags?: Record<string, number | boolean | string>;
}

const testHero = (hp: number, atk: number, def: number, weapon: string, shield: string, extra: Partial<HeroStats['tools']> = {}): HeroStats => ({
  hp,
  atk: atk + 100,
  def: def + 100,
  gold: 5000,
  keys: { yellow: 20, blue: 10, red: 5 },
  weapon,
  shield,
  tools: { book: true, fly: true, notebook: false, ...extra },
  bag: {},
});

export const TEST_ZONES: Record<number, TestZone> = {
  2: { name: '第二区', floor: 11, hero: TEST_HERO },
  3: { name: '第三区', floor: 21, hero: testHero(10000, ZONE2_ROUTE_END.atk, ZONE2_ROUTE_END.def, '银剑', '银盾', { cross: true }) },
  4: { name: '第四区', floor: 31, hero: testHero(15000, ZONE3_ROUTE_END.atk, ZONE3_ROUTE_END.def, '银剑', '银盾', { cross: true }) },
  5: { name: '第五区', floor: 41, hero: testHero(20000, ZONE4_ROUTE_END.atk, ZONE4_ROUTE_END.def, '骑士剑', '骑士盾', { cross: true }) },
};
export const START_POS: Point = { x: 5, y: 10 };
/** 第 3 层被魔王击晕后的属性 */
export const PRISON_STATS = { hp: 400, atk: 10, def: 10 };

export function cloneHero(h: HeroStats): HeroStats {
  return { ...h, keys: { ...h.keys }, tools: { ...h.tools }, bag: { ...(h.bag ?? {}) } };
}

/** 消耗类道具数量 */
export const bagCount = (h: HeroStats, id: ItemId) => h.bag?.[id] ?? 0;
export function bagAdd(h: HeroStats, id: ItemId, n = 1): void {
  h.bag = { ...(h.bag ?? {}) };
  h.bag[id] = Math.max(0, (h.bag[id] ?? 0) + n);
}

/**
 * 怪物特殊能力（51 号塔 enemys.js special 编号）：
 *  1 先攻（怪物先出手；本塔只在 32F / 40F 剧情中由 setEnemy 临时赋予骑士队长与 40F 的军队）
 *  15 领域（初级 / 高级巫师：十字 1 格内的格子每次踏入减生命 value）
 *  16 夹击（魔法警卫：站在两只魔法警卫正中间时生命减半）
 * 神圣盾（魔法免疫）免疫 15 / 16。本塔第三–五区没有吸血、魔攻、坚固、连击、固伤等能力（见 research.md §16.4）。
 */
export interface MonsterSpecial {
  first?: boolean;
  zone?: { value: number; range: number; square?: boolean };
  between?: boolean;
}

export interface MonsterDef {
  id: MonsterId;
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  desc: string;
  special?: MonsterSpecial;
  /** 不能被炸弹炸死（头目） */
  noBomb?: boolean;
}

export const SPECIAL_TEXT = {
  first: { name: '先攻', color: '#ffcc33', desc: '怪物首先攻击' },
  zone: { name: '领域', color: '#c677dd', desc: (v: number) => `经过怪物周围十字范围内 1 格时自动减生命 ${v} 点` },
  between: { name: '夹击', color: '#bb99ee', desc: '经过两只相同的怪物中间，角色生命值变成一半' },
} as const;

/** 怪物能力的简短标签（手册 / 悬浮提示） */
export function specialTags(m: MonsterDef): { name: string; color: string; desc: string }[] {
  const out: { name: string; color: string; desc: string }[] = [];
  const sp = m.special;
  if (!sp) return out;
  if (sp.first) out.push({ ...SPECIAL_TEXT.first });
  if (sp.zone) out.push({ name: SPECIAL_TEXT.zone.name, color: SPECIAL_TEXT.zone.color, desc: SPECIAL_TEXT.zone.desc(sp.zone.value) });
  if (sp.between) out.push({ ...SPECIAL_TEXT.between });
  return out;
}

/** 数值与原版一致（h5mota 51 号塔 enemys.js；与 orochitian/mota、h5mota 论坛数据帖交叉核对）。原版无经验值。 */
export const MONSTERS: Record<MonsterId, MonsterDef> = {
  greenSlime: { id: 'greenSlime', name: '绿色史莱姆', hp: 35, atk: 18, def: 1, gold: 1, desc: '软乎乎的史莱姆，塔中最弱的怪物。' },
  redSlime: { id: 'redSlime', name: '红色史莱姆', hp: 45, atk: 20, def: 2, gold: 2, desc: '脾气火爆的史莱姆，比绿色的稍强。' },
  bat: { id: 'bat', name: '小蝙蝠', hp: 35, atk: 38, def: 3, gold: 3, desc: '攻击很高但很脆，提升防御最有效。' },
  bluePriest: { id: 'bluePriest', name: '初级法师', hp: 60, atk: 32, def: 8, gold: 5, desc: '身披蓝袍的见习法师，防御较高。' },
  skeleton: { id: 'skeleton', name: '骷髅人', hp: 50, atk: 42, def: 6, gold: 6, desc: '挥舞弯刀的骷髅，伤害可观。' },
  skeletonSoldier: { id: 'skeletonSoldier', name: '骷髅士兵', hp: 55, atk: 52, def: 12, gold: 8, desc: '持盾的骷髅精兵，攻击需超过 12 才能破防。' },
  yellowGuard: { id: 'yellowGuard', name: '初级卫兵', hp: 50, atk: 48, def: 22, gold: 12, desc: '第 8 层机关门的守卫，打败两名后门会自动打开。' },
  blueGuard: { id: 'blueGuard', name: '中级卫兵', hp: 100, atk: 180, def: 110, gold: 50, desc: '看守第 2 层铁门的精锐，第一区内几乎无法战胜。' },
  skeletonCaptain: { id: 'skeletonCaptain', name: '骷髅队长', hp: 100, atk: 65, def: 15, gold: 30, desc: '第一区的头目，第 10 层伏击的指挥者。' },
  // —— 第二区（11F–20F）：原版均无特殊能力 ——
  blackSlime: { id: 'blackSlime', name: '大史莱姆', hp: 130, atk: 60, def: 3, gold: 8, desc: '黑色的大史莱姆，血厚但几乎没有防御。' },
  bigBat: { id: 'bigBat', name: '大蝙蝠', hp: 60, atk: 100, def: 8, gold: 12, desc: '攻击极高的大蝙蝠，二区最常见的敌人。' },
  zombie: { id: 'zombie', name: '兽人', hp: 260, atk: 85, def: 5, gold: 18, desc: '皮糙肉厚的兽人。持有十字架时攻击力加倍。' },
  zombieKnight: { id: 'zombieKnight', name: '兽人武士', hp: 320, atk: 120, def: 15, gold: 30, desc: '身披铠甲的兽人战士。持有十字架时攻击力加倍。' },
  rock: { id: 'rock', name: '石头人', hp: 20, atk: 100, def: 68, gold: 28, desc: '防御高达 68，攻击不足时无法破防。' },
  slimeMan: { id: 'slimeMan', name: '幽灵', hp: 320, atk: 140, def: 20, gold: 30, desc: '飘忽不定的幽灵（英文版名 Slime Man）。' },
  redPriest: { id: 'redPriest', name: '高级法师', hp: 100, atk: 95, def: 30, gold: 22, desc: '身披红袍的法师，防御 30。' },
  octopus: { id: 'octopus', name: '大乌贼', hp: 1200, atk: 180, def: 20, gold: 100, desc: '盘踞在第 15 层的巨型乌贼，身下压着「镐」。' },
  vampire: { id: 'vampire', name: '吸血鬼', hp: 444, atk: 199, def: 66, gold: 144, desc: '第二区的头目，由 8 只大蝙蝠合体而成。持有十字架时攻击力加倍。', noBomb: true },
  // —— 第三–五区（21F–50F），数值取自 51 号塔 enemys.js ——
  slimelord: { id: 'slimelord', name: '史莱姆王', hp: 360, atk: 310, def: 20, gold: 40, desc: '头戴王冠的史莱姆之王，第五区的常见敌人。' },
  redBat: { id: 'redBat', name: '吸血蝙蝠', hp: 200, atk: 390, def: 90, gold: 50, desc: '猩红色的吸血蝙蝠（本塔中没有吸血能力）。' },
  ghostSkeleton: { id: 'ghostSkeleton', name: '鬼战士', hp: 220, atk: 180, def: 30, gold: 35, desc: '被诅咒的骷髅战士，第四区最常见的敌人。' },
  brownWizard: { id: 'brownWizard', name: '初级巫师', hp: 220, atk: 370, def: 110, gold: 80, desc: '领域：十字 1 格内每走一步减生命 100。', special: { zone: { value: 100, range: 1 } } },
  redWizard: { id: 'redWizard', name: '高级巫师', hp: 200, atk: 380, def: 130, gold: 90, desc: '领域：十字 1 格内每走一步减生命 200。', special: { zone: { value: 200, range: 1 } } },
  redGuard: { id: 'redGuard', name: '高级卫兵', hp: 180, atk: 460, def: 360, gold: 200, desc: '守护 44F 神圣盾的精锐卫兵，防御高达 360。' },
  swordsman: { id: 'swordsman', name: '双手剑士', hp: 100, atk: 680, def: 50, gold: 55, desc: '攻击 680，仅次于魔王；最好等到能一击必杀（攻击 ≥ 150）再战。' },
  soldier: { id: 'soldier', name: '战士', hp: 210, atk: 200, def: 65, gold: 45, desc: '全副武装的战士。' },
  yellowKnight: { id: 'yellowKnight', name: '骑士队长', hp: 120, atk: 150, def: 50, gold: 100, desc: '第四区的头目（金骑士），32F 与 40F 剧情中带有先攻。', noBomb: true },
  redKnight: { id: 'redKnight', name: '骑士', hp: 160, atk: 230, def: 105, gold: 65, desc: '红甲骑士，防御 105。' },
  darkKnight: { id: 'darkKnight', name: '黑暗骑士', hp: 180, atk: 430, def: 210, gold: 120, desc: '漆黑铠甲的骑士，防御 210。' },
  whiteKing: { id: 'whiteKing', name: '魔法警卫', hp: 230, atk: 450, def: 100, gold: 100, desc: '夹击：从两只魔法警卫中间经过时生命减半。', special: { between: true } },
  blackMagician: { id: 'blackMagician', name: '大法师', hp: 4500, atk: 560, def: 310, gold: 1000, desc: '魔塔的主人，住在 25 楼。以较低的属性挑战他简直就是自杀。', noBomb: true },
  magicDragon: { id: 'magicDragon', name: '魔龙', hp: 1500, atk: 600, def: 250, gold: 800, desc: '盘踞在 35 楼的巨龙。持有屠龙匕时攻击力加倍。', noBomb: true },
  redKing: { id: 'redKing', name: '魔王', hp: 8000, atk: 5000, def: 1000, gold: 500, desc: '魔塔的真正主宰。49F 被骰子 5 形的封印削弱为一成功力。', noBomb: true },
};

/** 持有十字架时攻击力加倍的怪物（51 号塔 functions.js：zombie / zombieKnight / vampire） */
export const CROSS_TARGETS = new Set<MonsterId>(['zombie', 'zombieKnight', 'vampire']);
/** 不能被炸弹炸死的头目（备用） */
export const BOSSES = new Set<MonsterId>(['skeletonCaptain', 'octopus', 'vampire', 'yellowKnight', 'blackMagician', 'magicDragon', 'redKing']);
/** 占 3×3 格的大型怪物（原版 bigImage）：以所在格为底边中心绘制 */
export const BIG_MONSTERS = new Set<MonsterId>(['octopus', 'magicDragon']);

export interface ItemDef {
  id: ItemId;
  name: string;
  /** 简短效果文字，用于飘字 */
  effect: string;
  color: string;
  apply(h: HeroStats, ratio: number): void;
}

/** 宝物数值 × 区域倍率（第一区 ratio = 1）：红血瓶 50、蓝血瓶 200、红/蓝宝石 1 */
export const ITEMS: Record<ItemId, ItemDef> = {
  yellowKey: { id: 'yellowKey', name: '黄钥匙', effect: '黄钥匙 +1', color: '#ffd23f', apply: (h) => void h.keys.yellow++ },
  blueKey: { id: 'blueKey', name: '蓝钥匙', effect: '蓝钥匙 +1', color: '#6cc4ff', apply: (h) => void h.keys.blue++ },
  redKey: { id: 'redKey', name: '红钥匙', effect: '红钥匙 +1', color: '#ff7a86', apply: (h) => void h.keys.red++ },
  redPotion: { id: 'redPotion', name: '红血瓶', effect: '生命 +50', color: '#ff6b81', apply: (h, r) => void (h.hp += BASE_VALUES.redPotion * r) },
  bluePotion: { id: 'bluePotion', name: '蓝血瓶', effect: '生命 +200', color: '#7fb2ff', apply: (h, r) => void (h.hp += BASE_VALUES.bluePotion * r) },
  redGem: { id: 'redGem', name: '红宝石', effect: '攻击 +1', color: '#ff5c7a', apply: (h, r) => void (h.atk += BASE_VALUES.redGem * r) },
  blueGem: { id: 'blueGem', name: '蓝宝石', effect: '防御 +1', color: '#5ab0ff', apply: (h, r) => void (h.def += BASE_VALUES.blueGem * r) },
  ironSword: { id: 'ironSword', name: '铁剑', effect: '攻击 +10', color: '#ffe27a', apply: (h) => void ((h.atk += 10), (h.weapon = '铁剑')) },
  ironShield: { id: 'ironShield', name: '铁盾', effect: '防御 +10', color: '#ffe27a', apply: (h) => void ((h.def += 10), (h.shield = '铁盾')) },
  fly: { id: 'fly', name: '魔杖', effect: '获得魔杖', color: '#c79bff', apply: (h) => void (h.tools.fly = true) },
  notebook: { id: 'notebook', name: '备忘录', effect: '获得备忘录', color: '#ffe9a8', apply: (h) => void (h.tools.notebook = true) },
  silverSword: { id: 'silverSword', name: '银剑', effect: '攻击 +20', color: '#e8f0ff', apply: (h) => void ((h.atk += 20), (h.weapon = '银剑')) },
  silverShield: { id: 'silverShield', name: '银盾', effect: '防御 +20', color: '#e8f0ff', apply: (h) => void ((h.def += 20), (h.shield = '银盾')) },
  holySword: { id: 'holySword', name: '神圣剑', effect: '攻击 +100', color: '#9fe8ff', apply: (h) => void ((h.atk += 100), (h.weapon = '神圣剑')) },
  pickaxe: { id: 'pickaxe', name: '镐', effect: '获得镐', color: '#ffd59a', apply: (h) => bagAdd(h, 'pickaxe') },
  cross: { id: 'cross', name: '十字架', effect: '获得十字架', color: '#fff1a6', apply: (h) => void (h.tools.cross = true) },
  superPotion: { id: 'superPotion', name: '圣水', effect: '获得圣水', color: '#9ff0ff', apply: (h) => bagAdd(h, 'superPotion') },
  // —— 第三–五区（51 号塔 items.js；装备按 flash 原版 itemEffect 数值：圣剑 / 圣盾 +50）——
  knightSword: { id: 'knightSword', name: '骑士剑', effect: '攻击 +40', color: '#ffe27a', apply: (h) => void ((h.atk += 40), (h.weapon = '骑士剑')) },
  knightShield: { id: 'knightShield', name: '骑士盾', effect: '防御 +40', color: '#ffe27a', apply: (h) => void ((h.def += 40), (h.shield = '骑士盾')) },
  sacredSword: { id: 'sacredSword', name: '圣剑', effect: '攻击 +50', color: '#fff1a6', apply: (h) => void ((h.atk += 50), (h.weapon = '圣剑')) },
  sacredShield: { id: 'sacredShield', name: '圣盾', effect: '防御 +50', color: '#fff1a6', apply: (h) => void ((h.def += 50), (h.shield = '圣盾')) },
  divineShield: { id: 'divineShield', name: '神圣盾', effect: '防御 +100', color: '#9fe8ff', apply: (h) => void ((h.def += 100), (h.shield = '神圣盾'), (h.tools.magicImmune = true)) },
  bomb: { id: 'bomb', name: '炸弹', effect: '获得炸弹', color: '#ffb36b', apply: (h) => bagAdd(h, 'bomb') },
  centerFly: { id: 'centerFly', name: '瞬移', effect: '瞬移 ×3', color: '#c9a6ff', apply: (h) => bagAdd(h, 'centerFly', 3) },
  upFly: { id: 'upFly', name: '向上传送', effect: '获得向上传送', color: '#8fe0ff', apply: (h) => bagAdd(h, 'upFly') },
  downFly: { id: 'downFly', name: '向下传送', effect: '获得向下传送', color: '#ffb0d0', apply: (h) => bagAdd(h, 'downFly') },
  coin: { id: 'coin', name: '幸运金币', effect: '战后金币 ×2', color: '#ffd23f', apply: (h) => void (h.tools.coin = true) },
  snow: { id: 'snow', name: '冰魔法', effect: '获得冰魔法', color: '#bff3ff', apply: (h) => void (h.tools.snow = true) },
  earthquake: { id: 'earthquake', name: '地震卷轴', effect: '获得地震卷轴', color: '#e0b080', apply: (h) => bagAdd(h, 'earthquake') },
  bigKey: { id: 'bigKey', name: '魔法钥匙', effect: '获得魔法钥匙', color: '#ffe066', apply: (h) => bagAdd(h, 'bigKey') },
  knife: { id: 'knife', name: '屠龙匕', effect: '对魔龙攻击 ×2', color: '#ffcf9a', apply: (h) => void (h.tools.knife = true) },
};

/**
 * 宝石 / 血瓶的基础数值（51 号塔 data.js values：redGem 1、blueGem 1、redPotion 50、bluePotion 200），
 * 实际效果 = 基础值 × 楼层 ratio（items.js itemEffect：core.values.X * core.status.thisMap.ratio）。
 * 各楼层 ratio（floors/MTn.js）：1–10F = 1，11–20F = 2，21–30F = 3，31–40F = 4，41–50F = 5。
 */
export const BASE_VALUES = { redGem: 1, blueGem: 1, redPotion: 50, bluePotion: 200 } as const;
/** 区域 → ratio（第一区 … 第五区），与原版各层 ratio 一致；尚未制作的楼层也用它 */
export const ZONE_RATIO = [1, 2, 3, 4, 5] as const;

export type StatKind = 'atk' | 'def' | 'hp';
/** 能直接提升属性的道具在给定 ratio 下的数值（装备为固定值，与 ratio 无关）；其他道具返回 null */
export function itemValue(id: ItemId, ratio: number): { stat: StatKind; v: number } | null {
  switch (id) {
    case 'redGem': return { stat: 'atk', v: BASE_VALUES.redGem * ratio };
    case 'blueGem': return { stat: 'def', v: BASE_VALUES.blueGem * ratio };
    case 'redPotion': return { stat: 'hp', v: BASE_VALUES.redPotion * ratio };
    case 'bluePotion': return { stat: 'hp', v: BASE_VALUES.bluePotion * ratio };
    case 'ironSword': return { stat: 'atk', v: 10 };
    case 'silverSword': return { stat: 'atk', v: 20 };
    case 'holySword': return { stat: 'atk', v: 100 };
    case 'ironShield': return { stat: 'def', v: 10 };
    case 'silverShield': return { stat: 'def', v: 20 };
    case 'knightSword': return { stat: 'atk', v: 40 };
    case 'knightShield': return { stat: 'def', v: 40 };
    case 'sacredSword': return { stat: 'atk', v: 50 };
    case 'sacredShield': return { stat: 'def', v: 50 };
    case 'divineShield': return { stat: 'def', v: 100 };
    default: return null;
  }
}

const STAT_NAMES: Record<StatKind, string> = { atk: '攻击', def: '防御', hp: '生命' };

/** 随区域倍率变化的效果文字（第二区红血瓶 +100、宝石 +2…）；与 itemValue 同源 */
export function itemEffect(id: ItemId, ratio: number): string {
  const v = itemValue(id, ratio);
  return v ? `${STAT_NAMES[v.stat]} +${v.v}` : ITEMS[id].effect;
}

/** 圣水（51 号塔 items.js superPotion）：生命 + round(0.74 × (攻击 + 防御)) × 10 */
export const superPotionHeal = (h: HeroStats) => Math.round(0.74 * (h.atk + h.def)) * 10;

export const ITEM_DESC: Partial<Record<ItemId, string>> = {
  fly: '可以飞往到过的楼层（需站在楼梯旁）。快捷键 F。',
  notebook: '自动记录与 NPC 的对话。快捷键 N。',
  pickaxe: '可破坏你周围（上下左右）的墙，用后消失。快捷键 1。',
  cross: '对兽人、兽人武士和吸血鬼攻击力加倍（持有即生效）。',
  superPotion: '使用后生命增加 round(0.74 ×（攻击 + 防御）) × 10 点，越晚使用效果越好。',
  bomb: '炸死你周围（上下左右）生命低于 500 的敌人并获得其金币（头目除外）。用后消失。快捷键 2。',
  centerFly: '飞向当前楼层中心对称的位置（目标格必须为空地）。快捷键 3。',
  upFly: '传送到楼上的相同位置（目标格必须为空地）。用后消失。快捷键 4。',
  downFly: '传送到楼下的相同位置（目标格必须为空地）。在 1 楼使用可到达地下室。用后消失。快捷键 5。',
  coin: '持有时，打败敌人后获得双倍金币。',
  snow: '冻结你周围（上下左右）的岩浆，可反复使用。快捷键 6。',
  earthquake: '摧毁当前楼层所有可破坏的墙。用后消失。快捷键 7。',
  bigKey: '打开当前楼层所有的黄门。用后消失。快捷键 8。',
  knife: '持有时，对魔龙的攻击力加倍。',
  divineShield: '防御 +100，并且可以忽略魔法攻击（领域、夹击）。',
};

export const DOOR_NAMES: Record<DoorKind, string> = { yellow: '黄', blue: '蓝', red: '红', special: '机关', iron: '铁' };

export const NPC_NAMES: Record<NpcId, string> = {
  oldman: '老人',
  trader: '商人',
  thief: '小偷',
  blessTrader: '商人',
  altar: '祭坛',
  demonKing: '魔王',
  magicGuard: '魔法警卫',
  specialTrader: '商人',
  princess: '洋娃娃',
  goldKnight: '骑士队长',
};
