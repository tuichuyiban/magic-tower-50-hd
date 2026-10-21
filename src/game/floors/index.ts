import type { FloorData } from '../types';
import { ZONE0 } from './zone0';
import { ZONE1 } from './zone1';
import { ZONE2 } from './zone2';
import { ZONE3 } from './zone3';
import { ZONE4 } from './zone4';
import { ZONE5 } from './zone5';
import { ZONE_RATIO } from '../entities';

/**
 * 0F（隐藏地下室）+ 第一区 1F–10F … 第五区 41F–50F。
 * 原版 canFlyTo: false 的楼层（0F、44F、50F）不能用魔杖飞往 / 飞离。
 * 44F「异空间」：原版 floorIds 中 43F 与 45F 之间的楼层，但没有通往 43F 的楼梯、43F 的上楼梯也没有对应的落脚点
 * ——这里按 flash 原版：43F 上楼直接到 45F、45F 下楼直接到 43F，44F 只能在 43F 用「向上传送」到达（见 research.md §16）。
 */
const ALL: FloorData[] = [...ZONE0, ...ZONE1, ...ZONE2, ...ZONE3, ...ZONE4, ...ZONE5];
for (const f of ALL) if (f.id === 0 || f.id === 44 || f.id === 50) f.noFly = true;
export const FLOORS: Record<number, FloorData> = Object.fromEntries(ALL.map((f) => [f.id, f]));
/** 楼梯的目标楼层（默认 ±1） */
export const STAIR_TARGET: Record<number, { up?: number; down?: number }> = { 43: { up: 45 }, 45: { down: 43 }, 44: { up: 45 } };
export const stairTarget = (floor: number, dir: 'up' | 'down') => STAIR_TARGET[floor]?.[dir] ?? floor + (dir === 'up' ? 1 : -1);
export const FIRST_FLOOR = 1;
export const LAST_FLOOR = 50;
/** 区域编号（每 10 层一个区域；0F 视为第一区之前的"第零区"） */
export const zoneOf = (floor: number) => Math.max(0, Math.ceil(floor / 10));
export const ZONE_NAMES = ['地下室', '第一区', '第二区', '第三区', '第四区', '第五区'];

/** 楼层的数值倍率：楼层数据中的 ratio（0F 为 0），缺省按区域 */
export const ratioForFloor = (floor: number): number => FLOORS[floor]?.ratio ?? ZONE_RATIO[Math.min(4, Math.max(0, zoneOf(floor) - 1))];
