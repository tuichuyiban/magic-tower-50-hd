import { motion } from '../game/speed';
import type { Dir } from '../game/types';

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};


/** 按住连续移动：首次立即触发，延迟后按固定间隔重复 */
class Repeater {
  private timer = 0;
  current: Dir | null = null;
  constructor(private fire: (d: Dir) => void) {}

  start(d: Dir): void {
    this.stop();
    this.current = d;
    this.fire(d);
    const loop = () => {
      if (!this.current) return;
      this.fire(this.current);
      this.timer = window.setTimeout(loop, motion.repeatMs);
    };
    this.timer = window.setTimeout(loop, motion.firstDelay);
  }

  stop(): void {
    window.clearTimeout(this.timer);
    this.current = null;
  }
}

export interface InputOptions {
  onDir: (d: Dir) => void;
  onKey?: (code: string) => void;
  dpad: HTMLElement;
}

/** 键盘（方向键 / WASD）+ 屏幕方向键（Pointer Events，支持按住连发） */
export function setupInput(opts: InputOptions): () => void {
  const rep = new Repeater(opts.onDir);
  const held: Dir[] = [];

  const onKeyDown = (e: KeyboardEvent) => {
    const d = KEY_DIR[e.code];
    if (d) {
      e.preventDefault();
      if (e.repeat) return;
      if (!held.includes(d)) held.push(d);
      rep.start(d);
      return;
    }
    if (!e.repeat) opts.onKey?.(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const d = KEY_DIR[e.code];
    if (!d) return;
    const i = held.indexOf(d);
    if (i >= 0) held.splice(i, 1);
    if (rep.current === d) {
      const next = held[held.length - 1];
      if (next) rep.start(next);
      else rep.stop();
    }
  };
  const onBlur = () => {
    held.length = 0;
    rep.stop();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  const buttons = Array.from(opts.dpad.querySelectorAll<HTMLButtonElement>('[data-dir]'));
  const cleanups: Array<() => void> = [];
  for (const btn of buttons) {
    const d = btn.dataset.dir as Dir;
    const down = (e: PointerEvent) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('pressed');
      rep.start(d);
    };
    const up = (e: PointerEvent) => {
      btn.classList.remove('pressed');
      btn.releasePointerCapture?.(e.pointerId);
      if (rep.current === d) rep.stop();
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', () => {
      btn.classList.remove('pressed');
      if (rep.current === d) rep.stop();
    });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    cleanups.push(() => {
      btn.removeEventListener('pointerdown', down);
      btn.removeEventListener('pointerup', up);
      btn.removeEventListener('pointercancel', up);
    });
  }

  return () => {
    rep.stop();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    cleanups.forEach((f) => f());
  };
}
