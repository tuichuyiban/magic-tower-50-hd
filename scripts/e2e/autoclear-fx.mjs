// 自动清怪也播放武器攻击特效：每只被清的怪都在原格依次播放当前武器的短版特效（各档、各速度含瞬移），回退 / 存读档不受影响
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
const OUT = '/workspace/magic-tower/shots';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log((c ? '✅ ' : '❌ ') + msg); if (!c) fails++; };
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const key = async (k) => { await page.keyboard.press(k); await wait(250); };
const toggle = (k, v) => G((k, v) => { const i = document.querySelector(`[data-toggle="${k}"]`); i.checked = v; i.dispatchEvent(new Event('change')); }, k, v);
await key('KeyO'); await toggle('autoClear', true); await key('Escape'); await wait(300);

// 布置：楼层 f 拆掉所有门（怪物仍是初始地图上的，非剧情怪），勇士属性拉满，站在第一只可清怪旁边
async function arena(f, weapon) {
  return G((f, weapon) => {
    __freezeAt(null);
    if (!window.__base) window.__base = JSON.stringify(__game.serialize());
    __game.deserialize(JSON.parse(window.__base));
    Object.assign(__game.flags, { ambush3: true });
    Object.assign(__game.hero, { hp: 999999, atk: 99999, def: 99999, weapon });
    __game.changeFloor(f, { x: 5, y: 5 });
    const fl = __game.floors[f], n = fl.length;
    for (const row of fl) for (const c of row) if (c.door) { c.door = undefined; c.terrain = 'floor'; }
    let story = 0, normal = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (fl[y][x].monster) (__storyMonster({ x, y }, f) ? story++ : normal.push([x, y]));
    let hero = null, free = null;
    const empty = (x, y) => { const c = fl[y]?.[x]; return c && c.terrain === 'floor' && !c.monster && !c.item && !c.npc && !__storyMonster({ x, y }, f); };
    const DIRS = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    for (const [x, y] of normal) {
      for (const [dx, dy] of Object.values(DIRS)) {
        const hx = x + dx, hy = y + dy;
        if (!empty(hx, hy)) continue;
        const fr = Object.entries(DIRS).find(([, [ex, ey]]) => empty(hx + ex, hy + ey));
        if (fr) { hero = { x: hx, y: hy }; free = fr[0]; break; }
      }
      if (hero) break;
    }
    __game.pos = hero;
    __game.touchMap();
    __renderer.autoWeaponFx = [];
    __renderer.lastWeaponFx = null;
    const before = fl.map((r) => r.map((c) => c.monster ?? '').join(',')).join('|');
    return { story, normal: normal.length, hero, free, before };
  }, f, weapon);
}
const run = () => G(() => {
  const t0 = performance.now();
  __runAutoNow();
  const fx = __renderer.autoWeaponFx;
  return { t0, fx: fx.map((x) => ({ ...x, off: Math.round(x.start - t0) })), slashes: __renderer.fx.filter((f) => f.kind === 'slash').length, particles: __renderer.fx.filter((f) => f.kind === 'particle').length, busy: __director.busy };
});
const monstersNow = (f) => G((f) => __game.floors[f].map((r) => r.map((c) => c.monster ?? '').join(',')).join('|'), f);
const killed = (f) => G((f) => { let n = 0; const fl = __game.floors[f]; for (const row of fl) for (const c of row) if (c.monster) n++; return n; }, f);

const TIERS = [[null, '空手'], ['铁剑', '铁剑'], ['银剑', '银剑'], ['骑士剑', '骑士剑'], ['圣剑', '圣剑'], ['神圣剑', '神圣剑']];
const SPEEDS = [['slow', 200], ['normal', 130], ['fast', 80], ['faster', 45], ['instant', 0]];
const shots = [];
// ---- 各档武器 × 各速度
for (let i = 0; i < (process.env.QUICK ? 1 : TIERS.length); i++) {
  const [weapon, name] = TIERS[i];
  for (const [sp, ms] of SPEEDS) {
    await G((ms) => { __motion.stepMs = ms; }, ms);
    const a = await arena(7, weapon);
    const m0 = await killed(7);
    const r = await run();
    const m1 = await killed(7);
    const kills = m0 - m1;
    const offs = r.fx.map((x) => x.off);
    const step = ms === 0 ? 60 : 100;
    const distinct = new Set(offs).size === offs.length;
    const seq = offs.every((o, k) => k === 0 || o - offs[k - 1] === step);
    const tierOk = r.fx.every((x) => x.tier === i);
    const cells = new Set(r.fx.map((x) => `${x.at.x},${x.at.y}`)).size === r.fx.length;
    ok(kills > 1 && r.fx.length === kills && distinct && seq && tierOk && cells && r.particles <= 260 && !r.busy,
      `${name} · ${sp}：自动清掉 ${kills} 只 → ${r.fx.length} 次武器特效（档位 ${i}，各在自己的格子上，依次相隔 ${step}ms，偏移 ${offs.join('/')}，时长 ${r.fx[0]?.dur}ms，粒子 ${r.particles}）`);
    if (sp === 'normal' || sp === 'instant') {
      // 截图用：先等楼层标题淡出，再重新布置并清怪
      await wait(1800);
      await arena(7, weapon);
      Object.assign(r, await run());
      // 冻结在中段：前几只已经斩完、后面的仍在排队
      const k = Math.min(2, r.fx.length - 1);
      await G((t) => __freezeAt(t), r.fx[k].start + r.fx[k].dur * 0.3);
      await wait(150);
      const path = `${OUT}/autoclear-fx-${i}-${sp}.png`;
      // 以勇士为中心裁 7×7 格，便于看清逐只播放的特效
      const clip = await G(() => {
        const r = document.getElementById('game').getBoundingClientRect();
        const c = __renderer.tileCenterCss(__game.pos), c1 = __renderer.tileCenterCss({ x: __game.pos.x + 1, y: __game.pos.y });
        const T = c1.x - c.x, h = T * 3.5;
        return { x: r.left + c.x - h, y: r.top + c.y - h, width: h * 2, height: h * 2 };
      });
      await page.screenshot({ path, clip });
      if (sp === 'normal') shots.push(path);
      await G(() => __freezeAt(null));
    }
    await wait(Math.min(2500, (r.fx.at(-1)?.off ?? 0) + 700));
  }
}
console.log('   📸', `${OUT}/autoclear-fx-*-normal.png / *-instant.png`);
await G(() => { __motion.stepMs = 130; });

// ---- 剧情怪不受影响：仍然不被清（找一层同时有剧情怪和普通怪的楼层）
const SF = await G(() => { for (let f = 2; f < 50; f++) { const fl = __game.floors[f]; let s = 0, n = 0; for (let y = 0; y < fl.length; y++) for (let x = 0; x < fl.length; x++) if (fl[y][x].monster) (__storyMonster({ x, y }, f) ? s++ : n++); if (s && n > 2) return f; } return 7; });
const a = await arena(SF, '神圣剑');
const storyBefore = await G(() => { const fl = __game.floors[__game.floorId]; const out = []; for (let y = 0; y < fl.length; y++) for (let x = 0; x < fl.length; x++) if (fl[y][x].monster && __storyMonster({ x, y }, __game.floorId)) out.push(`${x},${y},${fl[y][x].monster}`); return out; });
await run();
const storyAfter = await G((list) => list.filter((s) => { const [x, y, m] = s.split(','); return __game.floors[__game.floorId][+y][+x].monster === m; }).length, storyBefore);
ok(storyBefore.length > 0 && storyAfter === storyBefore.length, `${SF}F：剧情怪 ${storyBefore.length} 只全部保留（自动清怪的范围不变）`);
await wait(1500);

// ---- 回退：一批自动清怪可以整体回退
const b = await arena(7, '银剑');
await wait(200);
await key(b.free); await wait(50); // 走一步 → 触发自动清怪（真实路径）
await wait(400);
let fxN = await G(() => __renderer.autoWeaponFx.length);
const afterMoves = await monstersNow(7);
ok(fxN > 0 && afterMoves !== b.before, `走一步触发自动清怪：${fxN} 次武器特效`);
await wait(2500);
await key('KeyZ'); await wait(400);
const undone = await monstersNow(7);
ok(undone === b.before, '回退（Z）：自动清掉的怪物恢复');
ok(await G(() => __renderer.fx.filter((f) => f.kind === 'slash').length === 0), '回退后没有残留的排队特效');

// ---- 存读档：自动清怪后存档，再改动、读档，状态恢复
const hpBefore = await G(() => __game.hero.hp);
await key('KeyP');
await G(() => document.querySelector('.slot[data-slot="1"] .s-thumb').click()); await wait(300);
await key('Escape'); await wait(200);
await G(() => { __game.hero.hp = 1; });
await key('KeyL');
await G(() => document.querySelector('.slot[data-slot="1"] .s-thumb').click()); await wait(700);
const st = await G(() => ({ hp: __game.hero.hp, modal: __modal.isOpen, busy: __director.busy }));
ok(st.hp === hpBefore && !st.modal && !st.busy, `存档 / 读档正常（生命 ${st.hp}）`);

// ---- 整屏截图：神圣剑、标准速度，自动清怪中段
await arena(7, '神圣剑'); await wait(1800); // 等楼层标题淡出
let rr = await run();
await G((t) => __freezeAt(t), rr.fx[Math.min(3, rr.fx.length - 1)].start + rr.fx[0].dur * 0.35); await wait(150);
await page.screenshot({ path: `${OUT}/autoclear-fx-divine-full.png` }); console.log('   📸', `${OUT}/autoclear-fx-divine-full.png`);
await G(() => __freezeAt(null)); await wait(2000);
await G(() => { __motion.stepMs = 0; });
await arena(7, '银剑'); await wait(1800);
rr = await run();
await G((t) => __freezeAt(t), rr.fx[Math.min(3, rr.fx.length - 1)].start + rr.fx[0].dur * 0.35); await wait(150);
await page.screenshot({ path: `${OUT}/autoclear-fx-instant-full.png` }); console.log('   📸', `${OUT}/autoclear-fx-instant-full.png`);
await G(() => { __freezeAt(null); __motion.stepMs = 130; });

// ---- 50F：剧情楼层，开着自动清怪也不清、不播放特效
const r50 = await G(() => { __game.changeFloor(50, { x: 5, y: 9 }); __renderer.autoWeaponFx = []; __runAutoNow(); return __renderer.autoWeaponFx.length; });
ok(r50 === 0, `50F（剧情楼层）：不自动清怪、无特效（${r50}）`);

const sheet = `${OUT}/autoclear-fx-contact-sheet.png`;
try { execFileSync('python3', [new URL('./contact-sheet.py', import.meta.url).pathname, sheet, ...shots]); console.log('   📸', sheet); } catch (e) { ok(false, '对照图生成失败 ' + e.message); }
console.log(errs.length ? errs : 'no page errors'); await browser.close(); console.log(fails ? `❌ ${fails} failed` : 'ALL PASS'); process.exit(fails ? 1 : 0);
