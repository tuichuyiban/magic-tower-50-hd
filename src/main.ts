import { storyMonster } from './game/autoExclude';
import { AUTO_FX_MAX, autoFxStep, weaponTier } from './render/weaponFx';
import { H5_EVENT_MONSTERS } from './game/h5EventMonsters';
import './style.css';
import { AudioEngine, TRACK_NAMES, trackForFloor, type Sfx, type Track } from './audio/audio';
import { describeAuto, runAuto, type AutoOptions } from './game/auto';
import { Director, type Face, type ScriptHost } from './game/director';
import { bagCount, ITEM_DESC, ITEMS, itemEffect, itemValue, MONSTERS, superPotionHeal, TEST_ZONES } from './game/entities';
import { vampireBattleActive } from './game/scripts2';
import { knightBattleActive } from './game/scripts4';
import { zone5Music } from './game/scripts5';
import { effectiveAtk } from './game/combat';
import { FLOORS, ratioForFloor } from './game/floors';
import { AutoWalker, passableMidway } from './game/pathfinding';
import { applySpeed, motion, SPEEDS } from './game/speed';
import { Game, type SaveData } from './game/state';
import { SCRIPTS, stepSpent } from './game/scripts';
import { applyVariants, type VariantOptions } from './game/variants';
import type { Dir, ItemId, Point } from './game/types';
import { setupInput } from './input/input';
import { buildPortraits } from './render/portraits';
import { criticalText, damageLabel, Renderer } from './render/renderer';
import { Dialog } from './ui/dialog';
import { Inventory } from './ui/inventory';
import { Modal } from './ui/modal';
import { deleteSlot, loadSetting, migrateSaves, setSlotNamespace, loadValue, PAGE_SIZE, PAGES, pageSlots, readSlot, readThumb, saveSetting, saveValue, slotInfo, slotName, storageUsage, writeSlot, type Slot } from './ui/saves';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const stage = document.getElementById('stage') as HTMLElement;
const curtainEl = document.getElementById('curtain') as HTMLElement;
const bannerEl = document.getElementById('floor-banner') as HTMLElement;
const modal = new Modal(document.getElementById('overlay') as HTMLElement);
const dialog = new Dialog(document.getElementById('dialog') as HTMLElement);

const game = new Game();
const renderer = new Renderer(canvas, game);

/** 设置：无怪物手册时也显示地图伤害（默认关闭 = 与原版一致） */
let alwaysDamage = loadSetting('alwaysDamage', false);
let shakeFlash = loadSetting('shakeFlash', true);
renderer.shakeFlash = () => shakeFlash;
renderer.showDamage = () => game.hero.tools.book || alwaysDamage;
/** 地图道具数值标签（如红宝石「+1」、红血瓶「+50」；随区域倍率变化），默认开 */
let itemValues = loadSetting('itemValues', true);
renderer.showItemValues = () => itemValues;

/* ---------------- 设置：步长 / 音乐 / 音效 / 自动 ---------------- */

/** 自动清怪 / 自动拾取（含血瓶）/ 自动开暗墙（默认关闭：避免剧透） */
// 设置版本 3：自动功能默认全部关闭（v3 去掉了「留怪等幸运金币」）；旧版本保存的开关在这里重置一次
const AUTO_SETTINGS_VERSION = '3';
// 旧存档迁移：完整楼层 → 紧凑格式，旧缩略图 → 小 WebP（存档位编号不变）
migrateSaves();
if (loadValue('autoSettingsVersion', '') !== AUTO_SETTINGS_VERSION) {
  for (const k of ['autoClear', 'autoPickup', 'autoPotions', 'autoHidden']) saveSetting(k, false);
  saveValue('autoSettingsVersion', AUTO_SETTINGS_VERSION);
}
const autoOpts: AutoOptions = {
  clear: loadSetting('autoClear', false),
  pickup: loadSetting('autoPickup', false),
  potions: loadSetting('autoPotions', false),
  hidden: loadSetting('autoHidden', false),
};

applySpeed(loadValue('speed', 'normal'));
const audio = new AudioEngine();
audio.musicOn = loadSetting('musicOn', true);
audio.sfxOn = loadSetting('sfxOn', true);
audio.musicVol = Number(loadValue('musicVol', '0.5'));
audio.sfxVol = Number(loadValue('sfxVol', '0.6'));
// 移动端自动播放限制：在第一次用户手势时创建 / 恢复音频
const unlockAudio = () => {
  audio.unlock();
  if (audio.state === 'running') {
    window.removeEventListener('pointerdown', unlockAudio, true);
    window.removeEventListener('keydown', unlockAudio, true);
  }
};
window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('keydown', unlockAudio, true);
const sfx = (s: Sfx, arg?: number) => audio.play(s, arg);

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const portraits = buildPortraits();

function faceUrl(face: Face): string {
  if (portraits[face]) return portraits[face];
  const u = renderer.sprites.url;
  if (face === 'hero') return u.hero;
  return (u.npc as Record<string, string>)[face] ?? (u.monster as Record<string, string>)[face] ?? '';
}

function showBanner(text: string): void {
  bannerEl.textContent = text;
  bannerEl.classList.remove('hidden');
  // 重新触发动画
  void bannerEl.offsetWidth;
  bannerEl.style.animation = 'none';
  void bannerEl.offsetWidth;
  bannerEl.style.animation = '';
  window.clearTimeout((showBanner as unknown as { t: number }).t);
  (showBanner as unknown as { t: number }).t = window.setTimeout(() => bannerEl.classList.add('hidden'), 1300);
}

async function curtain(dark: boolean, ms = 260): Promise<void> {
  curtainEl.style.setProperty('--fade', `${ms}ms`);
  curtainEl.classList.toggle('hidden', !dark);
  await sleep(ms);
}

const host: ScriptHost = {
  say: (who, text) => dialog.say(who.name, faceUrl(who.face), text),
  choose: (who, text, options) => dialog.choose(who.name, faceUrl(who.face), text, options),
  shop: (who, spec) => dialog.shop(who.name, faceUrl(who.face), spec, (ok) => { if (!ok) sfx('error'); }),
  wait: sleep,
  curtain,
  async transition(fn) {
    await curtain(true, 220);
    fn();
    await sleep(60);
    showBanner(game.floor.name);
    await curtain(false, 260);
  },
  tip: (text) => renderer.notice(text, game.pos, '#9dffb8'),
  autosave: () => {
    writeSlot('auto', game.serialize(), renderer.mapThumbnail());
  },
};

const director = new Director(game, host);
const walker = new AutoWalker(game, () => director.busy || dialog.isOpen);
renderer.route = () => ({ path: walker.path, dest: walker.dest });

const blocked = () => modal.isOpen || dialog.isOpen || director.busy;

/* ---------------- 回退（撤销上一个有意义的操作） ----------------
 * 每次玩家动作前记录一份完整快照（pending）；动作及其触发的剧情全部结束后，
 * 如果游戏状态发生了实质变化——战斗、开门、拾取、商店购买、NPC 剧情 / 对话、使用道具——就把快照压入历史栈。
 * 单纯走路、上下楼梯、魔杖传送（只改变位置 / 所在楼层 / 到过的楼层）不算操作，不占用历史：
 * 按一次「回退」会越过其间所有走路与换层，直接回到最近一次有意义操作之前（包括当时所在的楼层与位置）。
 * 快照包含全部楼层、属性、标志与备忘录，剧情（伏击 / 监狱 / 机关门）都能完整回退。
 */
const MAX_HISTORY = 100;
const history: SaveData[] = [];
let pending: { snap: SaveData; key: string } | null = null;
let restoring = false;
// 不含 floorId / 位置 / visited：换层与走路不算「操作」
const stateKey = (d: SaveData) => JSON.stringify([d.hero, d.floors, d.flags, d.notes.length]);
const pushHistory = (s: SaveData) => {
  history.push(s);
  if (history.length > MAX_HISTORY) history.shift();
};
function flushPending(): void {
  if (!pending || director.busy || dialog.isOpen) return;
  if (stateKey(game.serialize()) !== pending.key) pushHistory(pending.snap);
  pending = null;
}
game.beforeAction = () => {
  if (restoring || director.busy) return;
  flushPending();
  if (pending) return;
  const snap = game.serialize();
  pending = { snap, key: stateKey(snap) };
};
/** 立即记录当前状态（传送、读档、重新开始之前） */
function checkpoint(): void {
  flushPending();
  pending = null;
  pushHistory(game.serialize());
}
function undo(): void {
  walker.cancel();
  if (modal.isOpen || dialog.isOpen || director.busy) return;
  flushPending();
  pending = null;
  const s = history.pop();
  if (!s) {
    renderer.notice('没有可以回退的操作', game.pos, '#ff8a96');
    sfx('error');
    return;
  }
  restoring = true;
  game.deserialize(s, `已回退（还可回退 ${history.length} 步）`);
  restoring = false;
  renderer.notice('回退', game.pos, '#9fd8ff');
  sfx('undo');
}

/* ---------------- 自动清怪 / 拾取 / 开暗墙 ----------------
 * 每次玩家动作（移动、战斗、开门、拾取、换层）之后，在空闲时运行一批（见 game/auto.ts）。
 * 整批动作并入触发它的那次玩家动作的回退快照：按一次「回退」即撤销该动作及其引发的全部自动动作。
 */
let autoDirty = false;
game.on((e) => {
  // 与样板 autoGet 一致：只在勇士自己走完一步（moveOneStep / moveDirectly）之后触发；
  // 踏上剧情格的那一步不触发（样板：勇士脚下有事件则不执行）。
  // （已失效的剧情格不再算事件——原来这里不看是否失效，走过 3F / 10F 等用过的剧情格后那一步不会触发）
  if (e.type === 'move') autoDirty = !scriptedStep(e.to);
  // 换层（楼梯 / 传送 / 剧情）、读档、回退、重新开始：作废尚未执行的批次，新楼层要等勇士走出一步
  if (e.type === 'floor' || e.type === 'load' || e.type === 'restart') autoDirty = false;
});
const scriptedStep = (p: Point): boolean => {
  const k = `${p.x},${p.y}`;
  return !!SCRIPTS[game.floorId]?.step?.[k] && !stepSpent(game.floorId, k, game.flags);
};
/** 剧情格：未失效的踏点、任何与剧情 / 事件有关的怪物（见 game/autoExclude.ts）——自动搜索不会穿过 / 触碰它们 */
const scriptedCell = (p: Point): boolean => {
  const sc = SCRIPTS[game.floorId];
  const k = `${p.x},${p.y}`;
  if (storyMonster(game, p)) return true;
  return !!sc?.step?.[k] && !stepSpent(game.floorId, k, game.flags);
};
function runAutoNow(): void {
  if (!autoDirty || blocked() || restoring) return;
  autoDirty = false;
  // 第 10 层伏击（击败骷髅队长前）全程不自动行动
  if (game.floorId === 10 && game.flags.ambush10 && !game.flags.captainDefeated) return;
  // 勇士正站在未失效的剧情格上
  if (scriptedCell(game.pos)) return;
  autoSfx.clear();
  autoKills = 0;
  const r = runAuto(game, autoOpts, scriptedCell, () => {
    if (pending) return;
    const snap = game.serialize();
    pending = { snap, key: stateKey(snap) };
  }, () => director.busy);
  if (!r) return;
  // 本批被剧情打断（例如 33F 每次战斗后的机关计数脚本）：剧情结束后接着做完同一批，而不是只打一只就停
  if (r.stopped && r.count) autoDirty = true;
  if (!r.count) return;
  for (const line of describeAuto(r)) game.addLog(line, 'good');
  [...autoSfx].forEach((k, i) => window.setTimeout(() => sfx(k), i * 90));
  lastGold = game.hero.gold;
}

/* ---------------- 音效 ---------------- */

const ITEM_SFX: Partial<Record<ItemId, Sfx>> = {
  yellowKey: 'key', blueKey: 'key', redKey: 'key',
  redGem: 'gem', blueGem: 'gem',
  redPotion: 'potion', bluePotion: 'potion',
  ironSword: 'equip', ironShield: 'equip',
  silverSword: 'equip', silverShield: 'equip', holySword: 'equip', cross: 'equip',
  knightSword: 'equip', knightShield: 'equip', sacredSword: 'equip', sacredShield: 'equip', divineShield: 'equip',
  coin: 'equip', knife: 'equip', snow: 'equip',
};
let lastGold = game.hero.gold;
/** 自动动作的音效：同一批中每种只播一次，依次错开 */
const autoSfx = new Set<Sfx>();
/** 本批自动清怪的序号：每只怪的挥剑音效与渲染器里的武器特效同步错开 */
let autoKills = 0;
game.on((e) => {
  if (e.type === 'battle' && e.auto) {
    const delay = Math.min(autoKills++, AUTO_FX_MAX) * autoFxStep(motion.stepMs);
    const tier = weaponTier(game.hero.weapon);
    if (autoKills <= 24) window.setTimeout(() => sfx('swing', tier), delay);
  }
  if ((e.type === 'pickup' || e.type === 'battle' || e.type === 'doorOpen') && e.auto) {
    autoSfx.add(e.type === 'pickup' ? (ITEM_SFX[e.item] ?? 'item') : e.type === 'battle' ? 'kill' : 'hidden');
    return;
  }
  if (e.type === 'statGain') {
    renderer.flashStat(e.stat, e.delta);
    if (!e.cost) sfx('item'); // 花金币的购买由主循环播放「购买」音效
    return;
  }
  switch (e.type) {
    case 'move': sfx('step'); break;
    case 'battle': {
      if (e.bomb) { sfx('heavy'); break; }
      const m = game.monsterDef(e.monster);
      const per = Math.max(1, effectiveAtk(game.hero, m) - m.def);
      const rounds = Math.ceil(m.hp / per);
      sfx('hit', rounds);
      // 武器音效层（所有速度都播放）
      sfx('swing', weaponTier(game.hero.weapon));
      window.setTimeout(() => sfx('kill'), Math.min(4, rounds) * 70 + 40);
      break;
    }
    case 'doorOpen': sfx(e.kind === 'hidden' ? 'hidden' : 'door'); break;
    case 'pickup': sfx(ITEM_SFX[e.item] ?? 'item'); break;
    case 'blocked': sfx('error'); break;
    case 'floor': sfx('stairs', e.floor > e.prev ? 1 : -1); break;
    case 'hit': sfx('heavy'); break;
    case 'mapDamage': sfx('hit', 1); break;
    case 'death': window.setTimeout(showGameOver, 700); break;
    case 'ending': window.setTimeout(() => showEnding(e.kind), 400); break;
    case 'load': case 'restart': lastGold = game.hero.gold; break;
  }
});
dialog.onType = (i) => {
  if (i % 3 === 1) sfx('blip');
};

game.on((e) => {
  if (e.type === 'restart' || e.type === 'load' || e.type === 'floor') walker.cancel();
  if (e.type === 'pickup' && ITEM_DESC[e.item] && e.item !== 'fly') {
    const desc = ITEM_DESC[e.item]!;
    director.run(e.at, (c) => c.say('hero', `获得「${ITEMS[e.item].name}」：${desc}`, '获得道具'));
  }
});

/* ---------------- 弹窗：怪物手册 ---------------- */

function showManual(): void {
  walker.cancel();
  if (dialog.isOpen || director.busy) return;
  if (!game.hero.tools.book) {
    modal.show('怪物手册', '<p>你还没有「怪物手册」。</p><p class="sub">据说第 3 层的老人会把它送给你。</p>', [{ label: '关闭', primary: true }]);
    return;
  }
  const list = document.createElement('div');
  list.className = 'manual';
  const ids = game.monsterTypesOnFloor();
  if (!ids.length) list.innerHTML = '<p class="empty">本层怪物已全部击败！</p>';
  for (const id of ids) {
    const def = MONSTERS[id];
    const info = game.monsterInfo(id);
    const { text, color } = damageLabel(info, game.hero.hp);
    const crit = criticalText(info);
    const row = document.createElement('div');
    row.className = 'manual-row';
    row.innerHTML = `
      <img src="${renderer.sprites.url.monster[id]}" alt="${def.name}" />
      <div class="m-main">
        <div class="m-name">${def.name}<span class="m-dmg" style="color:${color}">伤害 ${text}</span></div>
        <div class="m-stats">生命 ${def.hp} · 攻击 ${def.atk} · 防御 ${def.def} · 金币 ${def.gold}</div>
        <div class="m-crit">${crit.line1} · ${crit.line2}</div>
        <div class="m-desc">${def.desc}</div>
      </div>`;
    list.appendChild(row);
  }
  modal.show(`怪物手册 · ${game.floor.name}`, list, [{ label: '关闭', primary: true }]);
}

/* ---------------- 魔杖：楼层传送 ---------------- */

function showFly(): void {
  walker.cancel();
  if (dialog.isOpen || director.busy) return;
  if (!game.hero.tools.fly) {
    modal.show('魔杖', '<p>你还没有「魔杖」。</p><p class="sub">它就在第 1 层的某个角落……</p>', [{ label: '关闭', primary: true }]);
    return;
  }
  if (!game.nearStairs()) {
    renderer.notice('只有在楼梯边才能使用魔杖', game.pos, '#ff8a96');
    game.addLog('只有在楼梯边才能使用魔杖', 'warn');
    return;
  }
  openFlyer();
}

/**
 * 楼层传送器（仿 H5 样板）：中间是所选楼层的大幅地图预览（按该层当前状态实时绘制），
 * 两侧箭头 / 鼠标滚轮 / ↑↓ 键 / 触屏上下滑动切换（只在到过的楼层间切换），Enter 或「传送」确认。
 */
function openFlyer(): void {
  const floors = [...game.visited].filter((f) => FLOORS[f]).sort((a, b) => a - b);
  let sel = game.floorId;
  const box = document.createElement('div');
  box.className = 'flyer';
  box.innerHTML = `
    <div class="fly-main">
      <div class="fly-stage" data-fly="stage"></div>
      <div class="fly-side">
        <button class="fly-arrow jump" data-fly="up10" aria-label="上 10 层">▲▲</button>
        <button class="fly-arrow" data-fly="up" aria-label="上一层">▲</button>
        <div class="fly-num" data-fly="num"></div>
        <button class="fly-arrow" data-fly="down" aria-label="下一层">▼</button>
        <button class="fly-arrow jump" data-fly="down10" aria-label="下 10 层">▼▼</button>
      </div>
    </div>
    <div class="fly-name" data-fly="name"></div>
    <div class="sub fly-help">↑↓ / 滚轮 / 上下滑动 ±1 层 · ←→ / ▲▲ ▼▼ ±10 层<br/>Enter 传送 · Esc 取消 · 只能飞往到过的楼层：去更高层到达其下楼梯旁，去更低层到达其上楼梯旁。</div>`;
  const q = (k: string) => box.querySelector<HTMLElement>(`[data-fly="${k}"]`)!;
  const stageEl = q('stage');
  const upBtn = q('up') as HTMLButtonElement;
  const downBtn = q('down') as HTMLButtonElement;
  const up10Btn = q('up10') as HTMLButtonElement;
  const down10Btn = q('down10') as HTMLButtonElement;
  const okBtn = () => document.querySelector<HTMLButtonElement>('#overlay .modal-actions .ui-btn.primary');
  const paint = (dir: 0 | 1 | -1) => {
    const cv = renderer.floorPreview(sel, 64);
    cv.className = 'fly-pic';
    cv.dataset.floor = String(sel);
    const old = [...stageEl.querySelectorAll<HTMLElement>('.fly-pic')];
    if (dir !== 0) {
      cv.classList.add(dir > 0 ? 'in-up' : 'in-down');
      for (const o of old) {
        o.classList.add('leaving', dir > 0 ? 'out-up' : 'out-down');
        window.setTimeout(() => o.remove(), 150);
      }
    } else old.forEach((o) => o.remove());
    stageEl.appendChild(cv);
    const i = floors.indexOf(sel);
    // 与样板一致：该方向没有到过的楼层时，▲ 与 ▲▲（或 ▼ 与 ▼▼）一起隐藏 / 禁用
    upBtn.disabled = up10Btn.disabled = i >= floors.length - 1;
    downBtn.disabled = down10Btn.disabled = i <= 0;
    q('num').textContent = `${sel}F`;
    q('name').innerHTML = `${FLOORS[sel].name}${sel === game.floorId ? '<span class="here">（当前所在）</span>' : ''}`;
    const ok = okBtn();
    if (ok) {
      ok.disabled = !canGo();
      ok.textContent = sel !== game.floorId ? `传送到 ${sel}F` : canGo() ? '回到本层下楼梯旁' : '当前楼层';
    }
    stageEl.classList.toggle('can-go', canGo());
    stageEl.title = canGo() ? (sel === game.floorId ? '点击：回到本层下楼梯旁' : `点击：传送到 ${sel}F`) : '';
  };
  /**
   * 样板 actions._getNextFlyFloor(delta)：沿该方向数「到过（且可飞）的楼层」，数满 |delta| 个为止；
   * 不足时停在该方向最远的到过的楼层（越界即停），未到过的楼层不计数、直接跳过。
   */
  const step = (delta: number) => {
    const i = floors.indexOf(sel);
    const j = Math.max(0, Math.min(floors.length - 1, i + delta));
    if (j === i) return;
    sel = floors[j];
    sfx('blip');
    paint(delta > 0 ? 1 : -1);
  };
  /** 选中当前楼层时：传送到本层下楼梯旁（已经在那里则不可用） */
  const canGo = () => {
    if (sel !== game.floorId) return true;
    const p = game.flyHomeSpot();
    return !!p && (p.x !== game.pos.x || p.y !== game.pos.y);
  };
  const confirm = () => {
    if (!canGo()) return;
    const id = sel;
    modal.hide();
    flushPending(); // 传送只是换层，不单独占一步回退
    director.fly(id);
  };
  upBtn.onclick = () => step(1);
  downBtn.onclick = () => step(-1);
  up10Btn.onclick = () => step(10);
  down10Btn.onclick = () => step(-10);
  let wheelAt = 0;
  box.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = performance.now();
    if (now - wheelAt < 160 || Math.abs(e.deltaY) < 1) return;
    wheelAt = now;
    step(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  // 触屏：上滑 = 上一层（更高），下滑 = 下一层
  let touch: { y: number; id: number } | null = null;
  stageEl.addEventListener('pointerdown', (e) => { touch = { y: e.clientY, id: e.pointerId }; });
  stageEl.addEventListener('pointerup', (e) => {
    if (!touch || touch.id !== e.pointerId) return;
    const dy = e.clientY - touch.y;
    touch = null;
    if (Math.abs(dy) > 30) step(dy < 0 ? 1 : -1);
    // 轻点中间的楼层预览 = 传送到该层（与「传送到 N 楼」按钮相同）
    else if (Math.abs(dy) < 10 && (e.target as HTMLElement).closest('.fly-pic')) confirm();
  });
  stageEl.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  const onKey = (e: KeyboardEvent) => {
    const k = e.code;
    let handled = true;
    // 样板 _keyDownFly：↑ +1、↓ −1、→ +10、← −10；_keyUpFly：Enter / 空格 / C 确认，G / Esc / X 关闭
    if (k === 'ArrowUp' || k === 'KeyW') step(1);
    else if (k === 'ArrowDown' || k === 'KeyS') step(-1);
    else if (k === 'ArrowRight' || k === 'KeyD' || k === 'PageUp') step(10);
    else if (k === 'ArrowLeft' || k === 'KeyA' || k === 'PageDown') step(-10);
    else if (k === 'Enter' || k === 'Space' || k === 'NumpadEnter' || k === 'KeyC') confirm();
    else if (k === 'Escape') modal.hide();
    else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  window.addEventListener('keydown', onKey, true);
  modal.show('魔杖 · 楼层传送器', box, [{ label: '取消' }, { label: '传送', primary: true, onClick: () => window.setTimeout(confirm) }], () => window.removeEventListener('keydown', onKey, true));
  paint(0);
}

/* ---------------- 备忘录 ---------------- */

function showNotes(): void {
  walker.cancel();
  if (dialog.isOpen || director.busy) return;
  if (!game.hero.tools.notebook) {
    modal.show('备忘录', '<p>你还没有「备忘录」。</p><p class="sub">它被遗落在第 5 层。</p>', [{ label: '关闭', primary: true }]);
    return;
  }
  const box = document.createElement('div');
  box.className = 'notes';
  if (!game.notes.length) box.innerHTML = '<p class="empty">还没有记录任何谈话。</p>';
  for (const n of game.notes) {
    const el = document.createElement('div');
    el.className = 'note';
    el.innerHTML = `<b>${n.floor}层${n.speaker}</b>`;
    el.appendChild(document.createTextNode(n.text));
    box.appendChild(el);
  }
  modal.show('备忘录 · 留言簿', box, [{ label: '关闭', primary: true }]);
}

/* ---------------- 存档 / 读档（仿 H5 样板：缩略图网格 + 分页） ---------------- */

/** 游戏时长：时:分:秒 */
function fmtDuration(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const z = (n: number) => String(n).padStart(2, '0');
  return `${Math.floor(t / 3600)}:${z(Math.floor(t / 60) % 60)}:${z(t % 60)}`;
}
function fmtTime(t: number): string {
  const d = new Date(t);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

let savePage = 0;
type SaveMode = 'save' | 'load';
let saveMode: SaveMode | null = null;
let saveRender: (() => void) | null = null;
const savesOpen = () => modal.isOpen && saveMode !== null && !!document.querySelector('.modal .saves');

/** 存档页 / 读档页（分开的两个页面，可用顶部标签或 P / L 切换）：每页 2 格 × 200 页 */
function showSaves(mode: SaveMode = 'save', page?: number): void {
  walker.cancel();
  if (dialog.isOpen || director.busy) return;
  if (savesOpen() && saveRender) {
    if (saveMode !== mode) document.querySelector('.modal .save-msg')!.textContent = '';
    saveMode = mode;
    if (page !== undefined) savePage = page;
    saveRender();
    return;
  }
  saveMode = mode;
  if (page !== undefined) savePage = page;
  const box = document.createElement('div');
  box.className = 'saves';
  const tabs = document.createElement('div');
  tabs.className = 'save-tabs';
  const tab = (m: SaveMode, label: string) => {
    const b = document.createElement('button');
    b.className = 'ui-btn small save-tab';
    b.dataset.tab = m;
    b.innerHTML = label;
    b.onclick = () => { if (saveMode !== m) say(''); saveMode = m; render(); };
    return b;
  };
  tabs.append(tab('save', '存档 <kbd>P</kbd>'), tab('load', '读档 <kbd>L</kbd>'));
  const autoRow = document.createElement('div');
  autoRow.className = 'auto-row';
  const grid = document.createElement('div');
  grid.className = 'slots';
  const pager = document.createElement('div');
  pager.className = 'pager';
  const msg = document.createElement('div');
  msg.className = 'save-msg';
  const usage = document.createElement('div');
  usage.className = 'sub usage';
  box.append(tabs, autoRow, grid, pager, msg, usage);
  const say = (text: string, bad = false) => {
    msg.textContent = text;
    msg.classList.toggle('bad', bad);
  };
  const go = (p: number) => {
    savePage = Math.max(0, Math.min(PAGES - 1, p));
    render();
  };
  const btn = (label: string, action: string, disabled: boolean, onClick: () => void) => {
    const b = document.createElement('button');
    b.className = 'ui-btn small';
    b.textContent = label;
    b.dataset.action = action;
    b.disabled = disabled;
    b.onclick = onClick;
    return b;
  };
  const render = () => {
    const m = saveMode ?? 'save';
    box.dataset.mode = m;
    document.querySelector('.modal .modal-title')!.textContent = m === 'save' ? '存档' : '读档';
    for (const t of tabs.querySelectorAll<HTMLElement>('.save-tab')) t.classList.toggle('primary', t.dataset.tab === m);
    autoRow.replaceChildren();
    if (m === 'load') autoRow.appendChild(autoCard());
    grid.replaceChildren(...pageSlots(savePage).map((s) => slotCard(s, m, render, say)));
    const label = document.createElement('label');
    label.className = 'page-label';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = String(PAGES);
    input.value = String(savePage + 1);
    input.className = 'page-input';
    input.dataset.action = 'page';
    input.onchange = () => { const v = Math.round(Number(input.value)); if (Number.isFinite(v)) go(v - 1); };
    input.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') input.dispatchEvent(new Event('change')); };
    label.append('第 ', input, ` / ${PAGES} 页`);
    pager.replaceChildren(
      btn('«10', 'prev10', savePage === 0, () => go(savePage - 10)),
      btn('◀ 上一页', 'prev', savePage === 0, () => go(savePage - 1)),
      label,
      btn('下一页 ▶', 'next', savePage === PAGES - 1, () => go(savePage + 1)),
      btn('10»', 'next10', savePage === PAGES - 1, () => go(savePage + 10)),
    );
    usage.textContent = `本地存储已用约 ${(storageUsage() / 1024).toFixed(0)} KB（浏览器上限通常约 5 MB）· 存档 ${savePage * PAGE_SIZE + 1}–${savePage * PAGE_SIZE + PAGE_SIZE} / ${PAGES * PAGE_SIZE}`;
  };
  saveRender = render;
  say('');
  render();
  modal.show(mode === 'save' ? '存档' : '读档', box, [{ label: '关闭', primary: true }], () => {
    saveMode = null;
    saveRender = null;
  });
}

function thumbBox(s: Slot, hasData: boolean, action: SaveMode, onPick: () => void): HTMLElement {
  const thumb = hasData ? readThumb(s) : null;
  const pic = document.createElement('button');
  pic.type = 'button';
  pic.className = 's-thumb';
  pic.dataset.action = action === 'save' ? 'save-thumb' : 'load-thumb';
  const disabled = action === 'load' && !hasData;
  pic.disabled = disabled;
  pic.title = disabled ? '空存档位' : action === 'save' ? `存入${slotName(s)}` : `读取${slotName(s)}`;
  if (thumb) {
    const img = document.createElement('img');
    img.src = thumb;
    img.alt = `${slotName(s)} 缩略图`;
    img.loading = 'lazy';
    pic.appendChild(img);
  } else {
    const t = document.createElement('span');
    t.className = 's-empty';
    t.textContent = hasData ? '无缩略图' : '空';
    pic.appendChild(t);
  }
  if (!disabled) {
    const tag = document.createElement('span');
    tag.className = 's-tap';
    tag.textContent = action === 'save' ? (hasData ? '点击覆盖存档' : '点击存档') : '点击读档';
    pic.appendChild(tag);
  }
  pic.onclick = () => { if (!disabled) onPick(); };
  return pic;
}

function slotInfoHtml(s: Slot, d: ReturnType<typeof slotInfo>, emptyText = '（空）'): string {
  return d
    ? `<div class="s-name">${slotName(s)}<span class="s-floor">${FLOORS[d.floorId]?.name ?? ''}</span></div>
       <div class="s-stats"><span class="hp">生命 ${d.hero.hp}</span><span class="atk">攻击 ${d.hero.atk}</span><span class="def">防御 ${d.hero.def}</span></div>
       <div class="s-time">${fmtTime(d.time)}</div>`
    : `<div class="s-name">${slotName(s)}</div><div class="s-time">${emptyText}</div>`;
}

function doLoad(s: Slot): void {
  const d = readSlot(s);
  if (!d) return;
  modal.hide();
  loadSave(d);
}

/** 读档页顶部：自动存档（每次换层时保存） */
function autoCard(): HTMLElement {
  const d = slotInfo('auto');
  const card = document.createElement('div');
  card.className = `slot auto mini${d ? '' : ' empty'}`;
  card.dataset.slot = 'auto';
  const info = document.createElement('div');
  info.className = 's-info';
  info.innerHTML = slotInfoHtml('auto', d, '每次换层时自动保存');
  card.append(thumbBox('auto', !!d, 'load', () => doLoad('auto')), info);
  return card;
}

function slotCard(s: Slot, mode: SaveMode, rerender: () => void, say: (t: string, bad?: boolean) => void): HTMLElement {
  const d = slotInfo(s);
  const card = document.createElement('div');
  card.className = `slot${d ? '' : ' empty'}`;
  card.dataset.slot = s;
  const info = document.createElement('div');
  info.className = 's-info';
  info.innerHTML = slotInfoHtml(s, d);
  const save = () => {
    const r = writeSlot(s, game.serialize(), renderer.mapThumbnail());
    const text = r === 'fail'
      ? '存档失败：浏览器本地存储空间已满。请删除一些不用的存档后再试（原有存档未受影响）。'
      : r === 'nothumb' ? `已存入${slotName(s)}（存储空间不足，未保存缩略图）` : `已存入${slotName(s)}`;
    game.addLog(r === 'fail' ? '存档失败（存储空间已满）' : text, r === 'fail' ? 'bad' : 'good');
    sfx(r === 'fail' ? 'error' : 'save');
    rerender();
    say(text, r === 'fail');
    if (r !== 'fail') {
      const el = document.querySelector<HTMLElement>(`.modal .slot[data-slot="${s}"]`);
      if (el) {
        el.classList.add('just-saved');
        const b = document.createElement('div');
        b.className = 's-saved';
        b.textContent = '已存档';
        el.appendChild(b);
        window.setTimeout(() => { el.classList.remove('just-saved'); b.remove(); }, 900);
      }
    }
  };
  // 直接存档（不再确认覆盖），卡片闪一下并显示「已存档」
  const pick = mode === 'save' ? save : () => doLoad(s);
  const acts = document.createElement('div');
  acts.className = 's-acts';
  const main = document.createElement('button');
  main.className = 'ui-btn primary small';
  main.textContent = mode === 'save' ? '存档' : '读档';
  main.dataset.action = mode;
  main.disabled = mode === 'load' && !d;
  main.onclick = pick;
  acts.appendChild(main);
  if (d) {
    const del = document.createElement('button');
    del.className = 'ui-btn small ghost';
    del.textContent = '删除';
    del.dataset.action = 'delete';
    del.onclick = () => {
      if (!card.classList.contains('del-armed')) {
        card.classList.add('del-armed');
        del.textContent = '确认删除';
        return;
      }
      deleteSlot(s);
      rerender();
      say(`已删除${slotName(s)}`);
    };
    acts.appendChild(del);
  }
  card.append(thumbBox(s, !!d, mode, pick), info, acts);
  return card;
}

/** 读档：不确认，极短的淡入淡出（约 250ms） */
function loadSave(d: SaveData): void {
  checkpoint();
  void (async () => {
    await curtain(true, 110);
    game.deserialize(d);
    showBanner(game.floor.name);
    await curtain(false, 140);
  })();
}

/* ---------------- 设置 ---------------- */

function showSettings(): void {
  walker.cancel();
  if (dialog.isOpen || director.busy) return;
  const box = document.createElement('div');
  box.className = 'settings';
  // 步长
  const sp = document.createElement('div');
  sp.className = 'set-row';
  sp.innerHTML = '<div class="set-label">移动速度（步长）</div>';
  const seg = document.createElement('div');
  seg.className = 'seg';
  for (const lv of SPEEDS) {
    const b = document.createElement('button');
    b.className = `ui-btn small${lv.id === motion.id ? ' on' : ''}`;
    b.textContent = lv.name;
    b.dataset.speed = lv.id;
    b.onclick = () => {
      applySpeed(lv.id);
      saveValue('speed', lv.id);
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    };
    seg.appendChild(b);
  }
  sp.appendChild(seg);
  sp.insertAdjacentHTML('beforeend', '<div class="sub">影响按住方向键连续移动与点击寻路；「瞬移」时寻路一步到位（遇到怪物 / 门 / 剧情仍会停下）。</div>');
  box.appendChild(sp);
  // 音乐 / 音效
  const audioRow = (label: string, key: 'music' | 'sfx') => {
    const row = document.createElement('div');
    row.className = 'set-row audio-row';
    const on = key === 'music' ? audio.musicOn : audio.sfxOn;
    const vol = key === 'music' ? audio.musicVol : audio.sfxVol;
    row.innerHTML = `<label class="set-label"><input type="checkbox" data-toggle="${key}" ${on ? 'checked' : ''}/> ${label}</label>
      <input type="range" min="0" max="1" step="0.05" value="${vol}" data-volume="${key}" aria-label="${label}音量"/>`;
    row.querySelector<HTMLInputElement>('[data-toggle]')!.onchange = (e) => {
      const v = (e.target as HTMLInputElement).checked;
      if (key === 'music') audio.musicOn = v;
      else audio.sfxOn = v;
      saveSetting(key + 'On', v);
      audio.unlock();
      audio.applyVolumes();
      if (key === 'sfx') sfx('item');
    };
    row.querySelector<HTMLInputElement>('[data-volume]')!.oninput = (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      if (key === 'music') audio.musicVol = v;
      else audio.sfxVol = v;
      saveValue(key + 'Vol', String(v));
      audio.applyVolumes();
    };
    row.querySelector<HTMLInputElement>('[data-volume]')!.onchange = () => {
      if (key === 'sfx') sfx('gem');
    };
    return row;
  };
  box.append(audioRow('背景音乐', 'music'), audioRow('音效', 'sfx'));
  // 试听各区域曲目（关闭设置后恢复当前楼层的曲子）
  const pv = document.createElement('div');
  pv.className = 'set-row audio-row';
  pv.innerHTML = `<label class="set-label" for="bgm-preview">试听</label><select id="bgm-preview" data-preview>
    <option value="">（当前楼层）</option>${(Object.keys(TRACK_NAMES) as Array<keyof typeof TRACK_NAMES>).map((k) => `<option value="${k}" ${audio.preview === k ? 'selected' : ''}>${TRACK_NAMES[k]}</option>`).join('')}</select>`;
  pv.querySelector<HTMLSelectElement>('select')!.onchange = (e) => {
    const v = (e.target as HTMLSelectElement).value as Track | '';
    audio.unlock();
    audio.setPreview(v || null);
  };
  box.append(pv);
  // 道具数值标签
  const iv = document.createElement('label');
  iv.className = 'setting';
  iv.innerHTML = `<input type="checkbox" data-toggle="itemValues" ${itemValues ? 'checked' : ''}/> 地图上显示道具数值（宝石 / 血瓶 / 装备：攻击红、防御蓝、生命绿）`;
  iv.querySelector('input')!.addEventListener('change', (e) => {
    itemValues = (e.target as HTMLInputElement).checked;
    saveSetting('itemValues', itemValues);
  });
  box.appendChild(iv);
  // 屏幕震动与闪光（武器特效、受伤等；默认开）
  const sf = document.createElement('label');
  sf.className = 'setting';
  sf.innerHTML = `<input type="checkbox" data-toggle="shakeFlash" ${shakeFlash ? 'checked' : ''}/> 屏幕震动与闪光（攻击特效、受伤；关闭后只保留斩击与粒子）`;
  sf.querySelector('input')!.addEventListener('change', (e) => {
    shakeFlash = (e.target as HTMLInputElement).checked;
    saveSetting('shakeFlash', shakeFlash);
  });
  box.appendChild(sf);
  // 地图伤害辅助
  const set = document.createElement('label');
  set.className = 'setting';
  set.innerHTML = `<input type="checkbox" data-toggle="damage" ${alwaysDamage ? 'checked' : ''}/> 未获得怪物手册时也显示地图伤害（辅助，原版不显示）`;
  set.querySelector('input')!.addEventListener('change', (e) => {
    alwaysDamage = (e.target as HTMLInputElement).checked;
    saveSetting('alwaysDamage', alwaysDamage);
  });
  box.appendChild(set);
  // 自动功能（仿 H5 魔塔样板 autoGet 插件）
  const au = document.createElement('div');
  au.className = 'set-row auto-row';
  au.innerHTML = '<div class="set-label">自动功能</div>';
  const autoToggle = (key: keyof AutoOptions, store: string, label: string, sub = false) => {
    const el = document.createElement('label');
    el.className = `setting${sub ? ' sub-setting' : ''}`;
    el.innerHTML = `<input type="checkbox" data-toggle="${store}" ${autoOpts[key] ? 'checked' : ''}/> ${label}`;
    const input = el.querySelector('input')!;
    input.addEventListener('change', () => {
      autoOpts[key] = input.checked;
      saveSetting(store, input.checked);
      sync();
    });
    au.appendChild(el);
    return input;
  };
  autoToggle('clear', 'autoClear', '自动清怪');
  const pick = autoToggle('pickup', 'autoPickup', '自动拾取');
  const pot = autoToggle('potions', 'autoPotions', '含血瓶', true);
  autoToggle('hidden', 'autoHidden', '自动开暗墙');
  const sync = () => {
    pot.disabled = !pick.checked;
    pot.parentElement!.classList.toggle('disabled', !pick.checked);
  };
  sync();
  box.appendChild(au);
  modal.show('设置', box, [{ label: '完成', primary: true }], () => audio.setPreview(null));
}

function confirmRestart(): void {
  walker.cancel();
  if (dialog.isOpen || director.busy) return;
  modal.show('重新开始', '<p>确定要从头开始吗？未存档的进度将会丢失。</p><p class="sub">（存档栏位不会被清除）</p>', [
    { label: '取消' },
    { label: '重新开始', primary: true, onClick: () => { checkpoint(); newGame(); } },
  ]);
}

function newGame(test = !!game.flags.testMode, zone = Number(game.flags.testZone ?? 2)): void {
  // 开局选项（上古版变体）：36F 暗道 / 48F 隐藏白衣武士。选择记入存档 flags，默认沿用上次的选择
  chooseVariants((v) => {
    void host.transition(() => {
      if (test) game.startTestMode(zone);
      else game.reset();
      applyVariants(game, v);
      if (v.secret36 || v.hidden48) game.addLog(`开局选项：${[v.secret36 && '36 层暗道', v.hidden48 && '48 层隐藏白衣武士'].filter(Boolean).join('、')} 已开启`, 'info');
      syncSlotNamespace();
    });
  });
}

/** 开局选项弹窗：两个可选的「上古版」变体，开启后可略微降低难度 */
function chooseVariants(done: (v: VariantOptions) => void): void {
  const box = document.createElement('div');
  box.className = 'variant-box';
  const v36 = loadSetting('variant36', false);
  const v48 = loadSetting('variant48', false);
  box.innerHTML = `
    <p class="big">开局选项</p>
    <p class="sub">有些版本（如「上古」版，即原作 Tower of the Sorcerer 1.2）的 36 层与 48 层与经典版不同。可以按喜好开启——<b>开启后可略微降低难度</b>。</p>
    <label class="setting variant"><input type="checkbox" data-variant="secret36" ${v36 ? 'checked' : ''}/> 开启 <b>36 层暗道</b>：四块角落墙体里各藏一条 L 形暗道（连接两侧走廊与上 / 下一行），可绕开双手剑士与骑士上楼</label>
    <label class="setting variant"><input type="checkbox" data-variant="hidden48" ${v48 ? 'checked' : ''}/> 开启 <b>48 层隐藏白衣武士</b>：最左上角那格空地藏着一名魔法警卫，撞上即现身，击败后圣剑房间的门会打开（经典版只能用镐破墙）</label>
    <p class="sub">选择会随存档保存，本局中途不能更改。都不勾选 = 经典版（与 h5 51 号塔相同）。</p>`;
  const read = (): VariantOptions => ({
    secret36: box.querySelector<HTMLInputElement>('[data-variant="secret36"]')!.checked,
    hidden48: box.querySelector<HTMLInputElement>('[data-variant="hidden48"]')!.checked,
  });
  window.setTimeout(() => modal.show('新的冒险', box, [
    { label: '经典版（都不开启）', onClick: () => { saveSetting('variant36', false); saveSetting('variant48', false); done({ secret36: false, hidden48: false }); } },
    { label: '开始冒险', primary: true, onClick: () => { const v = read(); saveSetting('variant36', v.secret36); saveSetting('variant48', v.hidden48); done(v); } },
  ]));
}

/** 试玩模式的存档与正式存档分开存放（localStorage 前缀 …test:） */
function syncSlotNamespace(): void {
  setSlotNamespace(game.flags.testMode ? 'test:' : '');
}
game.on((e) => {
  if (e.type === 'restart' || e.type === 'load') syncSlotNamespace();
});

/* ---------------- 输入 ---------------- */

/** 手动输入（键盘 / 方向键 / 点击相邻格）：会打断正在进行的自动寻路 */
const move = (d: Dir) => {
  walker.cancel();
  // 存档 / 读档页里 ← → 翻页
  if (savesOpen() && (d === 'left' || d === 'right') && document.activeElement?.tagName !== 'INPUT') {
    showSaves(saveMode ?? 'save', Math.max(0, Math.min(PAGES - 1, savePage + (d === 'right' ? 1 : -1))));
    return;
  }
  if (blocked()) return;
  game.tryMove(d);
};

setupInput({
  dpad: document.querySelector('.dpad') as HTMLElement,
  onDir: move,
  onKey: (code) => {
    if (dialog.isOpen) return;
    if (code === 'Escape') return modal.hide();
    if (savesOpen()) {
      // 存档 / 读档页：P / L 切换页面，PageUp / PageDown 翻页（Shift = ±10 页）
      if (code === 'KeyP') return showSaves('save');
      if (code === 'KeyL') return showSaves('load');
      if (code === 'PageUp' || code === 'PageDown') return showSaves(saveMode ?? 'save', Math.max(0, Math.min(PAGES - 1, savePage + (code === 'PageDown' ? 1 : -1))));
    }
    if (modal.isOpen) {
      if (['KeyM', 'KeyX', 'KeyF', 'KeyG', 'KeyN', 'KeyP', 'KeyL', 'KeyO'].includes(code)) modal.hide();
      return;
    }
    if (code === 'KeyM' || code === 'KeyX') showManual();
    else if (code === 'KeyF' || code === 'KeyG') showFly();
    else if (code === 'KeyN') showNotes();
    else if (code === 'KeyP') showSaves('save');
    else if (code === 'KeyL') showSaves('load');
    else if (code === 'KeyR') confirmRestart();
    else if (code === 'KeyZ' || code === 'Backspace') undo();
    else if (code === 'KeyO') showSettings();
    else if (code === 'Digit1' || code === 'Numpad1') useBagItem('pickaxe');
    else {
      // 51 号塔 onKeyUp：2 炸弹、3 瞬移、4 上楼器、5 下楼器、6 冰魔法、7 地震卷轴、8 魔法钥匙
      const m = /^(?:Digit|Numpad)([2-8])$/.exec(code);
      if (m) useBagItem(HOTKEY_ITEMS[Number(m[1])]);
    }
  },
});

document.getElementById('btn-manual')!.addEventListener('click', showManual);
document.getElementById('btn-fly')!.addEventListener('click', showFly);
document.getElementById('btn-notes')!.addEventListener('click', showNotes);
document.getElementById('btn-save')!.addEventListener('click', () => showSaves('save'));
document.getElementById('btn-load')!.addEventListener('click', () => showSaves('load'));
document.getElementById('btn-restart')!.addEventListener('click', confirmRestart);
document.getElementById('btn-undo')!.addEventListener('click', undo);
document.getElementById('btn-settings')!.addEventListener('click', showSettings);

/* ---------------- 背包：通用道具注册表 ----------------
 * 新道具只需 inventory.register({ id, name, desc, icon, count, use, ... })，背包网格、说明、点击使用、分页自动生效。
 */
const inventory = new Inventory();
const S = renderer.sprites;
inventory.register({
  id: 'fly', name: '魔杖（楼层传送器）', hotkey: 'G / F', permanent: true,
  desc: '站在楼梯旁时可飞往任意到过的楼层。',
  icon: () => S.item.fly, count: () => (game.hero.tools.fly ? 1 : 0), use: () => showFly(),
});
inventory.register({
  id: 'book', name: '怪物手册', hotkey: 'M / X', permanent: true,
  desc: '查看本层所有怪物的属性、预计伤害与临界值；地图上会标出伤害。',
  icon: () => S.icon.book, count: () => (game.hero.tools.book ? 1 : 0), use: () => showManual(),
});
inventory.register({
  id: 'notebook', name: '备忘录', hotkey: 'N', permanent: true,
  desc: '自动记录与老人、商人等的重要谈话。',
  icon: () => S.item.notebook, count: () => (game.hero.tools.notebook ? 1 : 0), use: () => showNotes(),
});
// —— 第二区道具（快捷键与 H5 样板 / 51 号塔 onKeyUp 一致：1 = 破墙镐）——
inventory.register({
  id: 'pickaxe', name: '镐', hotkey: '1',
  desc: '可破坏你周围（上下左右）的墙，用后消失。坚固的墙与带机关的暗墙无法破坏。',
  icon: () => S.item.pickaxe, count: () => bagCount(game.hero, 'pickaxe'),
  usable: () => game.pickaxeTargets().length > 0,
  effect: () => `破坏周围 ${game.pickaxeTargets().length} 面墙，镐随之消失`,
  use: () => usePickaxe(),
});
inventory.register({
  id: 'superPotion', name: '圣水',
  desc: '使用后生命增加 round(0.74 ×（攻击 + 防御）) × 10 点，越晚使用效果越好。',
  icon: () => S.item.superPotion, count: () => bagCount(game.hero, 'superPotion'),
  effect: () => `生命 +${superPotionHeal(game.hero)}（按当前攻防计算）`,
  use: () => useSuperPotion(),
});
inventory.register({
  id: 'cross', name: '十字架', permanent: true,
  desc: '持有即生效：对兽人、兽人武士和吸血鬼攻击力加倍。',
  icon: () => S.item.cross, count: () => (game.hero.tools.cross ? 1 : 0),
  use: () => renderer.notice('十字架：对兽人和吸血鬼攻击力加倍（被动生效）', game.pos, '#fff1a6'),
});
// —— 第三–五区道具 ——
inventory.register({
  id: 'bomb', name: '炸弹', hotkey: '2',
  desc: '炸死周围（上下左右）生命低于 500 的敌人，获得其金币（不受幸运金币加倍），用后消失。',
  icon: () => S.item.bomb, count: () => bagCount(game.hero, 'bomb'),
  usable: () => game.bombTargets().length > 0,
  effect: () => {
    const t = game.bombTargets();
    const gold = t.reduce((a, p) => a + game.monsterDef(game.cell(p)!.monster!).gold, 0);
    return `炸死周围 ${t.length} 个敌人，获得 ${gold} 金币`;
  },
  use: () => toolUse('bomb', () => game.useBomb().length > 0, '周围没有可以炸死的敌人（生命需低于 500）'),
});
inventory.register({
  id: 'centerFly', name: '瞬移', hotkey: '3',
  desc: '飞向当前楼层中心对称的位置（目标格必须为空地）。',
  icon: () => S.item.centerFly, count: () => bagCount(game.hero, 'centerFly'),
  // 不弹确认框：第一次使用 = 在地图上预览落点（绿 = 可以，红 = 被阻挡），再使用一次 = 瞬移；其他任何操作取消
  confirm: false,
  usable: () => !!game.centerTarget(),
  effect: () => {
    const t = game.centerTarget();
    return t ? `瞬移到 (${t.x + 1}, ${t.y + 1})` : '对称位置不是空地';
  },
  use: () => centerFlyTap(),
});
inventory.register({
  id: 'upFly', name: '上楼器', hotkey: '4',
  desc: '飞到上一层的相同位置（目标格必须为空地；49F 不能使用）。',
  icon: () => S.item.upFly, count: () => bagCount(game.hero, 'upFly'),
  usable: () => game.verticalTarget('up').ok,
  effect: () => {
    const t = game.verticalTarget('up');
    return t.ok ? `飞往 ${t.floor}F 的相同位置` : t.reason ?? '无法使用';
  },
  use: () => toolUse('upFly', () => game.useVerticalFly('up'), game.verticalTarget('up').reason ?? '无法使用'),
});
inventory.register({
  id: 'downFly', name: '降临之翼', hotkey: '5',
  desc: '飞到下一层的相同位置（目标格必须为空地）。',
  icon: () => S.item.downFly, count: () => bagCount(game.hero, 'downFly'),
  usable: () => game.verticalTarget('down').ok,
  effect: () => {
    const t = game.verticalTarget('down');
    return t.ok ? `飞往 ${t.floor === 0 ? '地下室' : `${t.floor}F`} 的相同位置` : t.reason ?? '无法使用';
  },
  use: () => toolUse('downFly', () => game.useVerticalFly('down'), game.verticalTarget('down').reason ?? '无法使用'),
});
inventory.register({
  id: 'snow', name: '冰魔法', hotkey: '6', permanent: true,
  desc: '冻结周围（上下左右）的岩浆，使其变成平地。可反复使用。',
  icon: () => S.item.snow, count: () => (game.hero.tools.snow ? 1 : 0),
  usable: () => game.snowTargets().length > 0,
  effect: () => `冻结周围 ${game.snowTargets().length} 格岩浆`,
  use: () => toolUse('snow', () => game.useSnow().length > 0, '周围没有岩浆'),
});
inventory.register({
  id: 'earthquake', name: '地震卷轴', hotkey: '7',
  desc: '摧毁本层所有可以破坏的墙（坚固的墙除外），用后消失。',
  icon: () => S.item.earthquake, count: () => bagCount(game.hero, 'earthquake'),
  usable: () => game.earthquakeTargets().length > 0,
  effect: () => `摧毁本层 ${game.earthquakeTargets().length} 堵墙`,
  use: () => toolUse('earthquake', () => game.useEarthquake().length > 0, '本层没有可以摧毁的墙'),
});
inventory.register({
  id: 'bigKey', name: '魔法钥匙', hotkey: '8',
  desc: '打开本层所有的黄门，用后消失。',
  icon: () => S.item.bigKey, count: () => bagCount(game.hero, 'bigKey'),
  usable: () => game.bigKeyTargets().length > 0,
  effect: () => `打开本层 ${game.bigKeyTargets().length} 扇黄门`,
  use: () => toolUse('bigKey', () => game.useBigKey().length > 0, '本层没有黄门'),
});
inventory.register({
  id: 'coin', name: '幸运金币', permanent: true,
  desc: '持有即生效：打败敌人后获得双倍金币（炸弹炸死的不加倍）。',
  icon: () => S.item.coin, count: () => (game.hero.tools.coin ? 1 : 0),
  use: () => renderer.notice('幸运金币：战斗金币 ×2（被动生效）', game.pos, '#ffd23f'),
});
inventory.register({
  id: 'knife', name: '屠龙匕', permanent: true,
  desc: '持有即生效：对魔龙攻击力加倍。',
  icon: () => S.item.knife, count: () => (game.hero.tools.knife ? 1 : 0),
  use: () => renderer.notice('屠龙匕：对魔龙攻击力加倍（被动生效）', game.pos, '#ffcf9a'),
});
inventory.register({
  id: 'divineShield', name: '神圣盾', permanent: true,
  desc: '持有即生效：免疫领域（巫师）与夹击（魔法警卫）的魔法攻击。',
  icon: () => S.item.divineShield, count: () => (game.hero.tools.magicImmune ? 1 : 0),
  use: () => renderer.notice('神圣盾：免疫魔法攻击（被动生效）', game.pos, '#9fe8ff'),
});
renderer.inventory = () => inventory.owned();

/**
 * 使用确认（会消耗 / 产生效果的道具）：图标 + 效果 + 说明，「使用 / 取消」，Enter / 空格确认、Esc 取消。
 * 查看类永久道具（手册、备忘录、魔杖）不经过这里，直接打开各自界面（魔杖界面本身有「传送」确认）。
 */
inventory.confirmer = (item, ok) => {
  walker.cancel();
  if (blocked()) return;
  const box = document.createElement('div');
  box.className = 'use-confirm';
  const icon = document.createElement('canvas');
  const src = item.icon();
  icon.width = src.width;
  icon.height = src.height;
  icon.getContext('2d')!.drawImage(src, 0, 0);
  icon.className = 'use-icon';
  const text = document.createElement('div');
  text.className = 'use-text';
  const q = document.createElement('p');
  q.className = 'big';
  q.textContent = `是否使用「${item.name}」？`;
  const eff = document.createElement('p');
  eff.className = 'use-effect';
  eff.textContent = item.effect?.() ?? item.desc;
  const desc = document.createElement('p');
  desc.className = 'sub';
  desc.textContent = item.desc;
  text.append(q, eff);
  if (item.effect) text.append(desc);
  box.append(icon, text);
  let done = false;
  const confirm = () => {
    if (done) return;
    done = true;
    modal.hide();
    window.setTimeout(ok);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      confirm();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      modal.hide();
    }
  };
  window.addEventListener('keydown', onKey, true);
  sfx('blip');
  modal.show('使用道具', box, [{ label: '取消' }, { label: '使用', primary: true, onClick: confirm }], () => window.removeEventListener('keydown', onKey, true));
};
/** 瞬移两段式：预览所在的楼层 / 勇士位置；变化即失效 */
let centerArmed: { floor: number; x: number; y: number } | null = null;
function cancelCenterPreview(): void {
  centerArmed = null;
  renderer.centerPreview = null;
}
function centerFlyTap(): void {
  walker.cancel();
  if (blocked()) return;
  const armed = centerArmed && centerArmed.floor === game.floorId && centerArmed.x === game.pos.x && centerArmed.y === game.pos.y;
  if (armed) {
    cancelCenterPreview();
    toolUse('centerFly', () => game.useCenterFly(), '对称位置被阻挡（墙 / 怪物 / 道具等），无法瞬移');
    return;
  }
  const t = { x: game.size - 1 - game.pos.x, y: game.size - 1 - game.pos.y };
  if (t.x === game.pos.x && t.y === game.pos.y) {
    renderer.notice('已在中心，对称位置就是这里', game.pos, '#ffb4b4');
    sfx('error');
    return;
  }
  const ok = !!game.centerTarget();
  centerArmed = { floor: game.floorId, x: game.pos.x, y: game.pos.y };
  renderer.centerPreview = { ...t, ok };
  sfx('blip');
  renderer.notice(ok ? '落点可用：再使用一次瞬移（3）确认' : '落点被阻挡：无法瞬移', game.pos, ok ? '#9dffb8' : '#ffb4b4');
}
/** 是否为「再次使用瞬移」的输入（快捷键 3 / 点击背包里的瞬移格） */
function isCenterFlyInput(e: Event): boolean {
  if (e instanceof KeyboardEvent) return e.code === 'Digit3' || e.code === 'Numpad3';
  if (e instanceof PointerEvent && e.target === canvas) {
    const b = renderer.bagHit(e.offsetX, e.offsetY);
    return b?.kind === 'slot' && b.id === 'centerFly';
  }
  return false;
}
// 预览期间：其他任何按键 / 点击都取消预览（不消耗道具）
for (const ev of ['keydown', 'pointerdown', 'wheel'] as const) {
  window.addEventListener(ev, (e) => {
    if (!centerArmed) return;
    if (e instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    if (!isCenterFlyInput(e)) cancelCenterPreview();
  }, true);
}
/** 快捷键使用背包道具：与点击背包同一路径（含确认框） */
function useBagItem(id: string): void {
  walker.cancel();
  if (blocked()) return;
  inventory.use(id);
}

const HOTKEY_ITEMS: Record<number, string> = { 2: 'bomb', 3: 'centerFly', 4: 'upFly', 5: 'downFly', 6: 'snow', 7: 'earthquake', 8: 'bigKey' };

/** 第三–五区道具的统一使用入口（确认框之后调用）：不能使用时提示且不消耗 */
function toolUse(id: ItemId, run: () => boolean, fail: string): void {
  walker.cancel();
  if (blocked()) return;
  const floor = game.floorId;
  if (!run()) {
    renderer.notice(fail, game.pos, '#ffb4b4');
    sfx('error');
    return;
  }
  const SND: Partial<Record<ItemId, Sfx>> = { bomb: 'heavy', earthquake: 'heavy', snow: 'gem', bigKey: 'door', centerFly: 'stairs', upFly: 'stairs', downFly: 'stairs' };
  sfx(SND[id] ?? 'item');
  host.tip(`${ITEMS[id].name}使用成功`);
  if (game.floorId !== floor) {
    showBanner(game.floor.name);
    host.autosave();
  }
}

/** 阵亡：读档或重新开始（原版 lose 事件） */
function showGameOver(): void {
  if (!game.dead) return;
  walker.cancel();
  dialog.close?.();
  const auto = readSlot('auto');
  const buttons: { label: string; primary?: boolean; onClick?: () => void }[] = [
    { label: '重新开始', onClick: () => newGame() },
  ];
  if (history.length) buttons.push({ label: '回退一步', onClick: () => undo() });
  if (auto) buttons.push({ label: '读取自动存档', primary: true, onClick: () => loadSave(auto) });
  buttons.push({ label: '读档…', onClick: () => window.setTimeout(() => showSaves('load')) });
  modal.show('勇士倒下了', `<p class="big">你被打败了……</p><p class="sub">${game.floor.name} · 击败敌人 ${game.kills} · 金币 ${game.hero.gold}</p>`, buttons);
}

/** 通关画面：结局 + 统计 + 制作名单 */
function showEnding(kind: 'NE' | 'TE'): void {
  walker.cancel();
  const h = game.hero;
  const playMs = Number(game.flags.playMs ?? 0) + (performance.now() - sessionStart);
  const box = document.createElement('div');
  box.className = 'ending';
  box.innerHTML = `
    <p class="big">${kind === 'TE' ? '真结局 · TE' : '普通结局 · NE'}</p>
    <p class="sub">${kind === 'TE'
      ? '你先识破了 50F 的「小偷」，又在 49F 用骰子「5」的封印削去了魔王九成功力——真正的魔王已被打倒。'
      : '你打倒了魔王。（提示：先在 50F 与小偷对话，再回 49F 用骰子「5」的形状封印魔王，可达成真结局）'}</p>
    <table class="ending-stats">
      <tr><td>生命</td><td>${h.hp}</td><td>攻击</td><td>${h.atk}</td><td>防御</td><td>${h.def}</td></tr>
      <tr><td>金币</td><td>${h.gold}</td><td>击败敌人</td><td>${game.kills}</td><td>步数</td><td>${game.steps ?? '-'}</td></tr>
      <tr><td>钥匙</td><td colspan="3">黄 ${h.keys.yellow} · 蓝 ${h.keys.blue} · 红 ${h.keys.red}</td><td>本次时长</td><td>${fmtDuration(playMs)}</td></tr>
    </table>
    <p class="sub credits">原作：《魔塔》50 层 Flash 版（胖老鼠）· H5 移植：h5mota 51 号塔（纯净版）<br/>
    高清重制：美术、音乐、程序全部原创重绘 / 重写 · ${game.flags.testMode ? '试玩模式' : '正式模式'}</p>`;
  modal.show('恭喜通关！', box, [
    { label: '继续查看地图' },
    { label: '重新开始', primary: true, onClick: () => newGame(false) },
  ]);
}
const sessionStart = performance.now();

function usePickaxe(): void {
  walker.cancel();
  if (blocked() || bagCount(game.hero, 'pickaxe') <= 0) return;
  if (!game.pickaxeTargets().length) {
    // 原版即使周围没有墙也会消耗镐；这里改为提示且不消耗（见 docs/research.md 偏差说明）
    renderer.notice('周围没有可以破坏的墙', game.pos, '#ffb4b4');
    sfx('error');
    return;
  }
  game.usePickaxe();
  sfx('heavy');
  host.tip('使用镐，破坏了周围的墙');
}

function useSuperPotion(): void {
  walker.cancel();
  if (blocked() || bagCount(game.hero, 'superPotion') <= 0) return;
  const hp = superPotionHeal(game.hero);
  game.useSuperPotion();
  sfx('potion');
  host.tip(`使用圣水，增加 ${hp} 生命`);
}

const toolButtons = () => {
  const t = game.hero.tools;
  document.getElementById('btn-manual')!.classList.toggle('locked', !t.book);
  document.getElementById('btn-fly')!.classList.toggle('locked', !t.fly);
  document.getElementById('btn-notes')!.classList.toggle('locked', !t.notebook);
  document.getElementById('btn-undo')!.classList.toggle('locked', !history.length && !pending);
};

/**
 * 背景音乐：按区域选曲（1–10F 塔中、11–20F 迷雾、21–30F 深渊、31–40F 进军、41–50F 远征；第二轮反馈后三–五区轮换），
 * 第 10 层伏击（击败队长前）、第 3 层魔王登场、20F 吸血鬼战时切换为紧张曲，结束后淡回区域曲。
 */
const musicTrack = (): Track => {
  const f = game.flags;
  const z5 = zone5Music(game.floorId, f);
  if (z5) return z5;
  if (knightBattleActive(game.floorId, f)) return 'knight';
  if (game.floorId === 26 && f.princess) return 'princess';
  if (game.floorId === 10 && f.ambush10 && !f.captainDefeated) return 'tension';
  if (game.floorId === 3 && f.ambush3 && director.busy) return 'tension';
  if (vampireBattleActive(game.floorId, f)) return 'tension';
  return trackForFloor(game.floorId);
};

// 画布：鼠标悬停查看情报；点击任意可达格子自动寻路（终点为怪物/门/道具/NPC 时到达后触发交互）
// 地图悬停情报浮窗只用于有鼠标悬停能力的设备；触屏点击 = 寻路 / 攻击，绝不弹出情报（触屏请用怪物手册）
const hoverCapable = window.matchMedia('(hover: hover)');
// ?hover=1：无头浏览器测试用（无头 Chrome 的 (hover: hover) 恒为 false 且无法模拟）
const forceHover = new URLSearchParams(location.search).has('hover');
const mouseHover = (e: PointerEvent) => e.pointerType === 'mouse' && (hoverCapable.matches || forceHover);
let bagPress: { id: number; timer: number; long: boolean; index: number } | null = null;
canvas.addEventListener('pointermove', (e) => {
  if (!mouseHover(e)) return;
  renderer.hover = renderer.tileAt(e.offsetX, e.offsetY);
  const b = renderer.bagHit(e.offsetX, e.offsetY);
  renderer.bagHover = b?.kind === 'slot' ? b.index : null;
  canvas.style.cursor = b ? 'pointer' : '';
});
canvas.addEventListener('pointerleave', (e) => {
  if (e.pointerType !== 'mouse') return;
  renderer.hover = null;
  renderer.bagHover = null;
});
/** 背包：点击使用；触屏长按（450 ms）只显示说明、不使用 */
function bagPointerDown(e: PointerEvent): boolean {
  const b = renderer.bagHit(e.offsetX, e.offsetY);
  if (!b) return false;
  if (b.kind === 'prev' || b.kind === 'next') {
    renderer.bagPage += b.kind === 'next' ? 1 : -1;
    renderer.bagHover = null;
    sfx('blip');
    return true;
  }
  if (mouseHover(e)) {
    if (!blocked()) inventory.use(b.id);
    return true;
  }
  if (bagPress) window.clearTimeout(bagPress.timer);
  const press = { id: e.pointerId, long: false, index: b.index, timer: 0 };
  press.timer = window.setTimeout(() => { press.long = true; renderer.bagHover = b.index; }, 450);
  bagPress = press;
  return true;
}
canvas.addEventListener('pointerup', (e) => {
  const pr = bagPress;
  if (!pr || pr.id !== e.pointerId) return;
  bagPress = null;
  window.clearTimeout(pr.timer);
  if (pr.long) return; // 长按：说明保持显示，直到下一次点击
  renderer.bagHover = null;
  const b = renderer.bagHit(e.offsetX, e.offsetY);
  if (b?.kind === 'slot' && b.index === pr.index && !blocked()) inventory.use(b.id);
});
canvas.addEventListener('pointercancel', () => {
  if (bagPress) window.clearTimeout(bagPress.timer);
  bagPress = null;
});
canvas.addEventListener('pointerdown', (e) => {
  if (!mouseHover(e)) {
    renderer.hover = null;
    renderer.bagHover = null;
  }
  if (bagPointerDown(e)) return;
  if (blocked()) return;
  const p = renderer.tileAt(e.offsetX, e.offsetY);
  walker.cancel();
  if (!p) return;
  const c = game.cell(p)!;
  if (p.x === game.pos.x && p.y === game.pos.y) return;
  if (c.terrain === 'wall' || c.terrain === 'sealedWall' || c.terrain === 'airwall') {
    // 带「撞墙」事件的墙（41F 右上角的牢墙等）：点击 = 走到旁边再撞一下（与键盘撞墙相同）
    if (SCRIPTS[game.floorId]?.bump?.[`${p.x},${p.y}`]) bumpWall(p);
    return;
  }
  if (!walker.start(p)) {
    renderer.notice('无法到达', p);
    game.addLog('无法到达该位置', 'warn');
  }
});
/** 点击带事件的墙：已相邻则直接撞；否则走到最近的相邻空地再撞（优先与墙同一行的左侧格，即 41F 原版要求的位置） */
function bumpWall(p: Point): void {
  const dirs: Array<[Dir, Point]> = [['right', { x: p.x - 1, y: p.y }], ['left', { x: p.x + 1, y: p.y }], ['down', { x: p.x, y: p.y - 1 }], ['up', { x: p.x, y: p.y + 1 }]];
  const here = dirs.find(([, q]) => q.x === game.pos.x && q.y === game.pos.y);
  if (here) {
    game.tryMove(here[0]);
    return;
  }
  for (const [d, q] of dirs) {
    const qc = game.cell(q);
    if (!qc || !passableMidway(qc)) continue;
    if (walker.start(q, () => game.tryMove(d))) return;
  }
  renderer.notice('无法到达', p);
}
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------------- 尺寸与主循环 ---------------- */

const fit = () => renderer.resize(stage.clientWidth, stage.clientHeight);
new ResizeObserver(fit).observe(stage);
window.addEventListener('resize', fit);
fit();

/** 测试 / 截图用：把渲染时间冻结在某一刻（null = 正常） */
let frozenT: number | null = null;
const loop = (t: number) => {
  // 勇士移动 / 换层 / 读档后瞬移预览失效
  if (centerArmed && (centerArmed.floor !== game.floorId || centerArmed.x !== game.pos.x || centerArmed.y !== game.pos.y)) cancelCenterPreview();
  runAutoNow();
  renderer.draw(frozenT ?? t);
  flushPending();
  toolButtons();
  audio.setTrack(musicTrack());
  // 商店 / 祭坛购买：金币减少时播放购买音效
  if (game.hero.gold < lastGold) sfx('buy');
  lastGold = game.hero.gold;
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

/* ---------------- 启动 ---------------- */

const query = new URLSearchParams(location.search);
const TEST_INFO =
  '<p class="sub test-note">试玩模式：直接从 11F / 21F / 31F / 41F 开始体验对应区域（之前的楼层可用魔杖飞行）。' +
  '攻击 / 防御 = 正常路线在该区起点的数值 + 100，大量生命，钥匙 20 黄 / 10 蓝 / 5 红，金币 5000，附送魔杖、怪物手册与对应装备。存档与正式存档分开保存。</p>';
/** 试玩模式：选择区域 */
function chooseTestZone(): void {
  const box = document.createElement('div');
  box.innerHTML = '<p class="big">试玩模式 · 选择起点</p>' + TEST_INFO;
  modal.show('试玩模式', box, [
    { label: '取消', onClick: () => window.setTimeout(showStart) },
    ...[2, 3, 4, 5].map((z) => ({
      label: `${TEST_ZONES[z].floor}F 起（${TEST_ZONES[z].name}）`,
      primary: z === 2,
      onClick: () => newGame(true, z),
    })),
  ]);
}
function showStart(): void {
  const auto = readSlot('auto');
  const buttons = [
    { label: '试玩模式…', onClick: () => window.setTimeout(chooseTestZone) },
    { label: auto ? '新的冒险' : '开始冒险', primary: !auto, onClick: () => newGame(false) },
  ];
  if (auto) buttons.push({ label: '继续游戏', primary: true, onClick: () => loadSave(auto) });
  modal.show(
    '魔塔 · 高清重制（1F–50F）',
    (auto
      ? `<p class="big">欢迎回来，勇士！</p><p class="sub">自动存档：${FLOORS[auto.floorId]?.name ?? ''} · 生命 ${auto.hero.hp} · 攻击 ${auto.hero.atk} · 防御 ${auto.hero.def}</p>`
      : '<p class="big">欢迎来到魔塔，勇士！</p><p class="sub">全部五个区域（1F–50F）与隐藏的地下室均已开放。</p>'),
    buttons,
  );
}
if (query.has('test')) {
  game.startTestMode(Number(query.get('test')) || 2);
  syncSlotNamespace();
  showBanner(game.floor.name);
} else if (query.has('new')) {
  showBanner(game.floor.name);
} else {
  showStart();
}

// 调试 / 自动化测试入口
Object.assign(window as unknown as Record<string, unknown>, {
  __game: game,
  __renderer: renderer,
  __walker: walker,
  __director: director,
  __dialog: dialog,
  __audio: audio,
  __modal: modal,
  __values: { itemValue, itemEffect, ratioForFloor, trackForFloor },
  __musicTrack: () => musicTrack(),
  __showEnding: (k: 'NE' | 'TE') => showEnding(k),
  __history: history,
  __motion: motion,
  __portraits: portraits,
  __autoOpts: autoOpts,
  __inventory: inventory,
  __h5EventMonsters: H5_EVENT_MONSTERS,
  __storyMonster: (p: Point, f?: number) => storyMonster(game, p, f),
  __freezeAt: (t: number | null) => { frozenT = t; },
  __runAutoNow: () => { autoDirty = true; runAutoNow(); },
});
