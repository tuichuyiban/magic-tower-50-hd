export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIR_VEC: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface Point {
  x: number;
  y: number;
}

export type DoorColor = 'yellow' | 'blue' | 'red';
/** special = 机关门（击败守卫/触发事件后打开），iron = 铁门（只能由事件打开） */
export type DoorKind = DoorColor | 'special' | 'iron';

export type Terrain =
  | 'floor'
  | 'wall'
  | 'stairsUp'
  | 'stairsDown'
  /** 空气墙：不可见、不可通行（第 10 层伏击房间） */
  | 'airwall'
  /** 暗墙：外观与普通墙完全相同，撞上去会打开 */
  | 'hiddenWall'
  /** 牢墙：外观略有裂纹，只能由剧情打开（第 2 层越狱暗道等） */
  | 'sealedWall'
  /** 祭坛左右两侧的装饰（不可通行） */
  | 'altarL'
  | 'altarR'
  /** 暗墙（原版 fakeWall2）：外观同墙，撞上去打开，但不能被镐破坏；打开后常有事件（第二区） */
  | 'hiddenWall2'
  /** 坚固的墙（原版 whiteWall2）：外观同墙，镐无法破坏 */
  | 'solidWall'
  /** 岩浆：不可通行（第 13 / 26 层），冰魔法可冻结 */
  | 'lava'
  /** 隐形迷宫墙（第 23 层，原版 whiteWall2 + 事件）：看不见、不可通行，碰到后显形为普通墙 */
  | 'mazeWall'
  /** 单向花丛（第 33 / 38 层，原版 flower）：看不见；只能沿 cell.oneWay 方向穿过，离开后变成墙；从其他方向碰到则立即变成墙 */
  | 'flower'
  /** 星空（第 50 层四周的背景，不可通行） */
  | 'star';

export type ItemId =
  | 'yellowKey'
  | 'blueKey'
  | 'redKey'
  | 'redPotion'
  | 'bluePotion'
  | 'redGem'
  | 'blueGem'
  | 'ironSword'
  | 'ironShield'
  | 'fly'
  | 'notebook'
  /** 第二区 */
  | 'silverSword'
  | 'silverShield'
  | 'holySword'
  | 'pickaxe'
  | 'cross'
  | 'superPotion'
  /** 第三–五区 */
  | 'knightSword'
  | 'knightShield'
  | 'sacredSword'
  | 'sacredShield'
  | 'divineShield'
  | 'bomb'
  | 'centerFly'
  | 'upFly'
  | 'downFly'
  | 'coin'
  | 'snow'
  | 'earthquake'
  | 'bigKey'
  | 'knife';

export type MonsterId =
  | 'greenSlime'
  | 'redSlime'
  | 'bat'
  | 'bluePriest'
  | 'skeleton'
  | 'skeletonSoldier'
  | 'yellowGuard'
  | 'blueGuard'
  | 'skeletonCaptain'
  /** 第二区 */
  | 'blackSlime'
  | 'bigBat'
  | 'zombie'
  | 'zombieKnight'
  | 'rock'
  | 'slimeMan'
  | 'redPriest'
  | 'octopus'
  | 'vampire'
  /** 第三–五区 */
  | 'slimelord'
  | 'redBat'
  | 'ghostSkeleton'
  | 'brownWizard'
  | 'redWizard'
  | 'redGuard'
  | 'swordsman'
  | 'soldier'
  | 'yellowKnight'
  | 'redKnight'
  | 'darkKnight'
  | 'whiteKing'
  | 'blackMagician'
  | 'magicDragon'
  | 'redKing';

export type NpcId = 'oldman' | 'trader' | 'thief' | 'blessTrader' | 'altar' | 'demonKing' | 'magicGuard' | 'specialTrader' | 'princess' | 'goldKnight';

export interface Cell {
  terrain: Terrain;
  door?: DoorKind;
  item?: ItemId;
  monster?: MonsterId;
  npc?: NpcId;
  /** 单向花丛允许穿过的方向 */
  oneWay?: Dir;
}

export interface HeroStats {
  hp: number;
  atk: number;
  def: number;
  gold: number;
  keys: Record<DoorColor, number>;
  weapon: string | null;
  shield: string | null;
  /** 永久道具：怪物手册 / 魔杖（楼层传送）/ 备忘录 */
  tools: {
    book: boolean;
    fly: boolean;
    notebook: boolean;
    cross?: boolean;
    /** 幸运金币：战斗金币 ×2 */
    coin?: boolean;
    /** 冰魔法：冻结相邻岩浆（永久） */
    snow?: boolean;
    /** 屠龙匕：对魔龙攻击力加倍 */
    knife?: boolean;
    /** 神圣盾：免疫领域 / 夹击等魔法伤害 */
    magicImmune?: boolean;
  };
  /** 消耗类道具数量（镐、圣水……） */
  bag?: Partial<Record<ItemId, number>>;
}

export interface FloorData {
  id: number;
  name: string;
  title?: string;
  /** 宝物倍率（第一区为 1） */
  ratio: number;
  map: string[];
  /** 从下层走上楼梯到达本层时的落脚点（原版 downFloor） */
  arriveFromBelow?: Point;
  /** 从上层走下楼梯到达本层时的落脚点（原版 upFloor） */
  arriveFromAbove?: Point;
  /** 不能用魔杖飞往 / 飞离（原版 canFlyTo: false：0F、44F、50F） */
  noFly?: boolean;
}
