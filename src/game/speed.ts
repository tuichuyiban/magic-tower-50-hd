/** 步长 / 行走速度：影响键盘与方向键按住连发、点击寻路的逐格行走以及勇士移动补间 */
export interface SpeedLevel {
  id: string;
  name: string;
  /** 每格间隔（毫秒）；0 = 瞬移（寻路一次走完） */
  step: number;
}

export const SPEEDS: SpeedLevel[] = [
  { id: 'slow', name: '慢', step: 200 },
  { id: 'normal', name: '标准', step: 130 },
  { id: 'fast', name: '快', step: 80 },
  { id: 'faster', name: '很快', step: 45 },
  { id: 'instant', name: '瞬移', step: 0 },
];

export const motion = {
  id: 'normal',
  /** 寻路每格间隔 */
  stepMs: 130,
  /** 按住方向键时的连发间隔与首次延迟 */
  repeatMs: 135,
  firstDelay: 240,
  /** 勇士移动补间时长 */
  tweenMs: 120,
};

export function applySpeed(id: string): SpeedLevel {
  const s = SPEEDS.find((x) => x.id === id) ?? SPEEDS[1];
  motion.id = s.id;
  motion.stepMs = s.step;
  motion.repeatMs = s.step ? Math.max(40, s.step + 5) : 35;
  motion.firstDelay = s.step ? Math.max(150, Math.min(260, s.step * 1.8)) : 150;
  motion.tweenMs = s.step ? Math.min(120, Math.round(s.step * 0.9)) : 0;
  return s;
}
