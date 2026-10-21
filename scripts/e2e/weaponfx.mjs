// 武器攻击特效：6 档（空手 / 铁剑 / 银剑 / 骑士剑 / 圣剑 / 神圣剑）的档位选择、速度设置、震屏开关、粒子上限与截图
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
const key = async (k) => { await page.keyboard.press(k); await wait(60); };

const TIERS = [
  { weapon: null, id: 'fist', name: '空手' },
  { weapon: '铁剑', id: 'iron', name: '铁剑' },
  { weapon: '银剑', id: 'silver', name: '银剑' },
  { weapon: '骑士剑', id: 'knight', name: '骑士剑' },
  { weapon: '圣剑', id: 'sacred', name: '圣剑' },
  { weapon: '神圣剑', id: 'divine', name: '神圣剑' },
];
// 武器名与游戏道具一致：拾取每把剑后 hero.weapon 就是对应档位的名字
const picked = await G(() => ['ironSword', 'silverSword', 'knightSword', 'sacredSword', 'holySword'].map((id) => {
  __game.flags.ambush3 = true;
  const p = { x: __game.pos.x + 1, y: __game.pos.y };
  Object.assign(__game.cell(p), { terrain: 'floor', item: id, monster: undefined, door: undefined, npc: undefined });
  __game.pickup(p, true);
  return __game.hero.weapon;
}));
ok(picked.join(',') === '铁剑,银剑,骑士剑,圣剑,神圣剑', `拾取 ironSword / silverSword / knightSword / sacredSword / holySword → 武器 ${picked.join(' / ')}`);

async function arena(weapon, monster = 'skeleton') {
  await G((weapon, monster) => {
    __freezeAt(null);
    __game.flags.ambush3 = true;
    Object.assign(__game.hero, { hp: 99999, atk: 9999, def: 9999, weapon });
    if (__game.floorId !== 1) __game.changeFloor(1, { x: 5, y: 5 });
    const fl = __game.floors[1];
    for (const x of [3, 4, 5, 6, 7]) for (const y of [4, 5, 6]) Object.assign(fl[y][x], { terrain: 'floor', door: undefined, item: undefined, npc: undefined, monster: undefined });
    fl[5][6].monster = monster;
    __game.pos = { x: 5, y: 5 };
    __game.facing = 'right';
    __game.touchMap();
  }, weapon, monster);
  await wait(250);
}
const fx = () => G(() => ({ last: __renderer.lastWeaponFx, slash: __renderer.fx.filter((f) => f.kind === 'slash').map((f) => ({ tier: f.tier, dur: f.dur })), particles: __renderer.fx.filter((f) => f.kind === 'particle').length, shake: __renderer.shakeUntil - performance.now(), amp: __renderer.shakeAmp }));
const clip = async () => G(() => {
  const r = document.getElementById('game').getBoundingClientRect();
  const a = __renderer.tileCenterCss({ x: 4, y: 3 }), b = __renderer.tileCenterCss({ x: 8, y: 7 });
  const half = (b.x - a.x) / 8;
  return { x: r.left + a.x - half, y: r.top + a.y - half, width: b.x - a.x + half * 2, height: b.y - a.y + half * 2 };
});

// ---- 每档：档位选择、特效与截图（冻结在特效中段）
const shots = [];
for (let i = 0; i < TIERS.length; i++) {
  const T = TIERS[i];
  await arena(T.weapon);
  await page.keyboard.press('ArrowRight');
  await wait(16);
  const f = await fx();
  const dead = await G(() => !__game.floors[1][5][6].monster);
  ok(dead && f.last?.tier === i && f.last.id === T.id && !f.last.brief && f.slash.length === 1 && f.slash[0].tier === i,
    `${T.name}（weapon=${JSON.stringify(T.weapon)}）→ 档位 ${f.last?.tier} ${f.last?.id}，斩击特效 ${f.slash[0]?.dur}ms，粒子 ${f.particles}`);
  ok(f.slash[0]?.dur <= 460, `${T.name}：特效时长 ${f.slash[0]?.dur}ms ≤ 原有怪物消散动画 460ms（不拖慢战斗）`);
  ok(!(await G(() => __director.busy)), `${T.name}：战斗后立即可以继续操作`);
  if (i >= 4) ok(f.amp > 0.04, `${T.name}：震屏加强（幅度 ${f.amp}）`);
  await G((t) => __freezeAt(t), f.last.t + f.slash[0].dur * (i >= 4 ? 0.3 : 0.25));
  await wait(120);
  const path = `${OUT}/wfx-${i}-${T.id}.png`;
  await page.screenshot({ path, clip: await clip() });
  console.log('   📸', path);
  shots.push(path);
  await G(() => __freezeAt(null));
  await wait(550);
}
// 整屏截图：神圣剑
await arena('神圣剑', 'redKnight');
await page.keyboard.press('ArrowRight'); await wait(16);
const fd = await fx();
await G((t) => __freezeAt(t), fd.last.t + fd.slash[0].dur * 0.3); await wait(120);
await page.screenshot({ path: `${OUT}/wfx-divine-full.png` }); console.log('   📸', `${OUT}/wfx-divine-full.png`);
await G(() => __freezeAt(null)); await wait(500);

// ---- 瞬移速度：不播放斩击，只保留原有小粒子；快速档缩短
await G(() => { __motion.stepMs = 0; });
await arena('神圣剑');
await page.keyboard.press('ArrowRight'); await wait(16);
let f = await fx();
ok(f.last?.tier === 5 && f.last.brief && f.slash.length === 1 && f.slash[0].dur <= 300 && f.particles <= 20, `瞬移速度：神圣剑播放简短版（${f.slash[0]?.dur}ms，粒子 ${f.particles}）`);
await wait(500);
await G(() => { __motion.stepMs = 45; });
await arena('神圣剑');
await page.keyboard.press('ArrowRight'); await wait(16);
f = await fx();
ok(f.slash[0]?.dur === 440, `「很快」速度：特效完整播放（${f.slash[0]?.dur}ms，不缩短）`);
await G(() => { __motion.stepMs = 130; });
await wait(500);

// ---- 屏幕震动与闪光开关
await key('KeyO'); await wait(200);
ok(await G(() => document.querySelector('[data-toggle="shakeFlash"]')?.checked === true), '设置：「屏幕震动与闪光」默认开启');
await G(() => { const i = document.querySelector('[data-toggle="shakeFlash"]'); i.checked = false; i.dispatchEvent(new Event('change')); });
await key('Escape'); await wait(200);
await G(() => { __renderer.shakeUntil = 0; __renderer.flashUntil = 0; });
await arena('神圣剑');
await page.keyboard.press('ArrowRight'); await wait(16);
f = await fx();
const fl = await G(() => __renderer.flashUntil - performance.now());
ok(f.shake <= 0 && fl <= 0 && f.slash.length === 1, `关闭后：不震屏、不闪光，斩击照常（shake ${Math.round(f.shake)}，flash ${Math.round(fl)}）`);
ok(await G(() => localStorage.getItem('mota-hd-zone1:setting:shakeFlash') === '0'), '设置已保存');
await G(() => localStorage.setItem('mota-hd-zone1:setting:shakeFlash', '1'));
await wait(500);

// ---- 粒子上限：连续多次神圣剑攻击
for (let i = 0; i < 25; i++) {
  await G(() => { const fl = __game.floors[1]; fl[5][6].monster = 'skeleton'; __game.touchMap(); });
  await page.keyboard.press('ArrowRight'); await wait(10);
}
f = await fx();
ok(f.particles <= 260, `连续 25 次攻击：同屏粒子 ${f.particles} ≤ 上限 260`);

// ---- 自动清怪：现在也播放武器特效（短版），详见 autoclear-fx.mjs；这里手动摆放的怪属于剧情怪，不会被清
await wait(600);
await G(() => { Object.assign(__autoOpts, { clear: true }); __renderer.lastWeaponFx = null; const fl = __game.floors[1]; fl[5][7].monster = 'greenSlime'; fl[5][6].monster = undefined; __game.touchMap(); __runAutoNow(); });
await wait(50);
f = await fx();
const st = await G(() => ({ story: __storyMonster({ x: 7, y: 5 }, 1), alive: !!__game.floors[1][5][7].monster, auto: __renderer.autoWeaponFx.length, at75: __renderer.autoWeaponFx.some((x) => x.at.x === 7 && x.at.y === 5), allTier5: __renderer.autoWeaponFx.every((x) => x.tier === 5) }));
ok(st.story && st.alive && !st.at75, '自动清怪的范围不变：手动摆放的 (7,5) 属于剧情怪 → 保留、该格无特效');
ok(st.auto === f.slash.length && st.allTier5 && f.last?.auto, `本层其他被自动清掉的普通怪 ${st.auto} 只：每只都播放神圣剑短版特效`);

// ---- 对照图：6 档并排
const sheet = `${OUT}/wfx-contact-sheet.png`;
try {
  execFileSync('python3', [new URL('./contact-sheet.py', import.meta.url).pathname, sheet, ...shots]);
  console.log('   📸', sheet);
} catch (e) { ok(false, '对照图生成失败 ' + e.message); }

console.log(errs.length ? errs : 'no page errors'); await browser.close(); console.log(fails ? `❌ ${fails} failed` : 'ALL PASS'); process.exit(fails ? 1 : 0);
