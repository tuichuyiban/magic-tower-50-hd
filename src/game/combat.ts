import { CROSS_TARGETS, type MonsterDef } from './entities';
import type { HeroStats } from './types';

export interface BattleForecast {
  /** 勇士能否破防 */
  canAttack: boolean;
  /** 勇士每回合造成的伤害 */
  heroHit: number;
  /** 怪物每回合造成的伤害 */
  monHit: number;
  /** 勇士需要攻击的回合数 */
  rounds: number;
  /** 本场战斗勇士损失的总生命（无法破防时为 Infinity） */
  damage: number;
  /** 是否可以安全获胜（损失 < 当前生命） */
  winnable: boolean;
}

/**
 * 经典魔塔回合制战斗公式（结果确定、可预测）：
 * 勇士先手，每回合造成 max(0, 勇士攻击 - 怪物防御)；
 * 怪物每回合造成 max(0, 怪物攻击 - 勇士防御)。
 * 勇士击杀怪物需要 ceil(怪物生命 / 勇士伤害) 回合，怪物反击次数为回合数 - 1。
 */
/** 实际用于战斗的攻击力：持有十字架时对兽人 / 兽人武士 / 吸血鬼加倍（51 号塔 functions.js getDamageInfo） */
export function effectiveAtk(hero: HeroStats, mon: MonsterDef): number {
  if (hero.tools?.cross && CROSS_TARGETS.has(mon.id)) return hero.atk * 2;
  // 屠龙匕：对魔龙攻击力加倍（functions.js getDamageInfo：hasItem('knife') && enemy.id == 'magicDragon'）
  if (hero.tools?.knife && mon.id === 'magicDragon') return hero.atk * 2;
  return hero.atk;
}

export function forecastBattle(hero: HeroStats, mon: MonsterDef): BattleForecast {
  const heroHit = Math.max(0, effectiveAtk(hero, mon) - mon.def);
  const monHit = Math.max(0, mon.atk - hero.def);
  if (heroHit <= 0) {
    return { canAttack: false, heroHit, monHit, rounds: Infinity, damage: Infinity, winnable: false };
  }
  const rounds = Math.ceil(mon.hp / heroHit);
  // 先攻（special 1）：怪物先出手，多打一回合（functions.js：init_damage += per_damage）
  const damage = (rounds - 1 + (mon.special?.first ? 1 : 0)) * monHit;
  return { canAttack: true, heroHit, monHit, rounds, damage, winnable: damage < hero.hp };
}

export interface CriticalInfo {
  /** 还需增加的攻击力；0 表示已无更低伤害可追求（伤害为 0 或 1 回合击杀） */
  atk: number;
  /** 达到该攻击后减少的伤害；未破防时为破防后的伤害（负数语义见 broken） */
  reduce: number;
  /** false 表示当前无法破防，atk 为"破防所需攻击" */
  broken: boolean;
  /** 未破防时：刚好破防后的预计伤害 */
  damageAfter?: number;
}

/**
 * 临界计算（与 H5 魔塔样板 mota-js `enemys.nextCriticals` 的回合数算法 `_nextCriticals_useTurn` 一致）：
 * 当前需 r = ceil(hp / (atk - def)) 回合；伤害下降意味着回合数减少到 r - 1，
 * 所需最小攻击 = ceil(hp / (r - 1)) + def，临界值 = 该攻击 - 当前攻击。O(1) 直接算出，无需逐点枚举。
 * 未破防时（样板 `_nextCriticals_overAtk`），临界值 = 刚好破防所需攻击 = def + 1 - atk。
 */
export function nextCritical(hero: HeroStats, mon: MonsterDef): CriticalInfo {
  // 十字架：实际攻击 = 2 × 面板攻击，临界值按面板攻击换算（向上取整）
  const mult = effectiveAtk(hero, mon) / Math.max(1, hero.atk) >= 2 ? 2 : 1;
  const toBase = (eff: number) => Math.ceil(eff / mult);
  const hit = effectiveAtk(hero, mon) - mon.def;
  if (hit <= 0) {
    const base = toBase(mon.def + 1);
    const after = forecastBattle({ ...hero, atk: base }, mon).damage;
    return { atk: base - hero.atk, reduce: 0, broken: false, damageAfter: after };
  }
  const f = forecastBattle(hero, mon);
  if (f.damage <= 0 || f.rounds <= 1) return { atk: 0, reduce: 0, broken: true };
  const nextAtk = toBase(Math.ceil(mon.hp / (f.rounds - 1)) + mon.def);
  const nextDamage = forecastBattle({ ...hero, atk: nextAtk }, mon).damage;
  return { atk: nextAtk - hero.atk, reduce: f.damage - nextDamage, broken: true };
}

/** N 防减伤（样板 `enemys.getDefDamage`）：防御 +k 后减少的伤害；无法破防返回 null（显示 ???） */
export function defDamage(hero: HeroStats, mon: MonsterDef, k = 1): number | null {
  const now = forecastBattle(hero, mon);
  if (!now.canAttack) return null;
  return now.damage - forecastBattle({ ...hero, def: hero.def + k }, mon).damage;
}
