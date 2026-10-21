/**
 * 地图伤害（51 号塔 functions.js updateCheckBlock）：
 *  - 领域（special 15）：怪物十字 range 格内（不含自身格）每格 + value；多只叠加；
 *  - 夹击（special 16）：两只相同的夹击怪物在同一行 / 列相隔一格时，中间格伤害 = floor((当前生命 − 该格已有伤害) / 2)
 *    （仅当剩余生命 > 1）；
 *  - 持有神圣盾（魔法免疫）时全部为 0。
 * 伤害在勇士「踏入」该格后结算（不在战斗中结算）；伤害 ≥ 当前生命的格子不能进入。
 */
import type { MonsterDef } from './entities';
import type { Cell, HeroStats, MonsterId } from './types';

export interface MapDamage {
  damage: number[][];
  /** 每格的伤害类型文字（"领域" / "夹击" / "领域、夹击"） */
  kinds: string[][];
  /** 是否存在任何地图伤害 */
  any: boolean;
}

export function computeMapDamage(grid: Cell[][], defOf: (id: MonsterId) => MonsterDef, hero: HeroStats): MapDamage {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const damage = Array.from({ length: h }, () => new Array<number>(w).fill(0));
  const kindSets = Array.from({ length: h }, () => Array.from({ length: w }, () => new Set<string>()));
  let any = false;
  if (!hero.tools.magicImmune) {
    // 领域
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const m = grid[y][x].monster;
        const z = m && defOf(m).special?.zone;
        if (!z) continue;
        for (let dy = -z.range; dy <= z.range; dy++)
          for (let dx = -z.range; dx <= z.range; dx++) {
            if (!dx && !dy) continue;
            if (!z.square && Math.abs(dx) + Math.abs(dy) > z.range) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            damage[ny][nx] += z.value;
            kindSets[ny][nx].add('领域');
            any = true;
          }
      }
    // 夹击：先右后下（与原版遍历顺序一致；一格只算一次）
    const checked = new Set<string>();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const m = grid[y][x].monster;
        if (!m || !defOf(m).special?.between) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const x2 = x + 2 * dx;
          const y2 = y + 2 * dy;
          if (x2 >= w || y2 >= h) continue;
          if (grid[y2][x2].monster !== m) continue;
          const mx = x + dx;
          const my = y + dy;
          const k = `${mx},${my}`;
          if (checked.has(k)) continue;
          checked.add(k);
          const left = hero.hp - damage[my][mx];
          if (left > 1) {
            const v = Math.floor(left / 2);
            if (v > 0) {
              damage[my][mx] += v;
              kindSets[my][mx].add('夹击');
              any = true;
            }
          }
        }
      }
  }
  const kinds = kindSets.map((r) => r.map((s) => [...s].join('、')));
  return { damage, kinds, any };
}
