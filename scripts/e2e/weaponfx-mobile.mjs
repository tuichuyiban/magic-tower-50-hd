// 用户场景复现：平板（1024×768 触屏）+ 旧格式存档（v2，2026/10/19，20F）+ 点击怪物寻路攻击
// 每档武器各一个旧存档（20F 下方中间的房间：勇士 (4,9)，怪物 (6,9)，点击怪物 → 走到 (5,9) → 向右攻击）；另有一个缺少 weapon 字段的旧存档（应按已拾取的剑推断为银剑）
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
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; vivo Pad2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36');
await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2, hasTouch: true, isMobile: true, isLandscape: true });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const tapEl = async (sel) => { const b = await G((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (!b) return false; await page.touchscreen.tap(b.x, b.y); await wait(250); return true; };
const tapTile = async (x, y) => { const p = await G((x, y) => { const r = document.getElementById('game').getBoundingClientRect(); const t = __renderer.tileCenterCss({ x, y }); return { x: r.left + t.x, y: r.top + t.y }; }, x, y); await page.touchscreen.tap(p.x, p.y); };

const TIERS = [[null, 'fist', '空手'], ['铁剑', 'iron', '铁剑'], ['银剑', 'silver', '银剑'], ['骑士剑', 'knight', '骑士剑'], ['圣剑', 'sacred', '圣剑'], ['神圣剑', 'divine', '神圣剑']];
// ---- 用旧格式（v2：完整楼层）写入 7 个存档：20F 下方房间，(6,9) 一只怪物，勇士在 (4,9)
await G((TIERS) => {
  __game.flags.ambush3 = true;
  __game.flags.vampire20 = true;
  __game.changeFloor(20, { x: 4, y: 9 });
  const fl = __game.floors[20];
  for (const x of [4, 5, 6]) Object.assign(fl[9][x], { terrain: 'floor', item: undefined, monster: undefined, npc: undefined, door: undefined });
  fl[9][6].monster = 'skeleton';
  Object.assign(__game.hero, { hp: 5000, atk: 300, def: 300 });
  const base = __game.serialize();
  base.time = new Date('2026-10-19T19:52:00').getTime();
  TIERS.forEach(([w], i) => {
    const d = JSON.parse(JSON.stringify(base));
    d.hero.weapon = w;
    d.hero.hp = 5001 + i;
    localStorage.setItem('mota-hd-zone1:' + (i + 1), JSON.stringify(d));
  });
  // 存档 7：缺少 weapon 字段（更旧的格式），5F 铁剑与 11F 附近的银剑已被拾取
  const d = JSON.parse(JSON.stringify(base));
  delete d.hero.weapon;
  d.hero.hp = 5007;
  for (const [f, rows] of Object.entries(d.floors)) rows.forEach((row) => row.forEach((c) => { if (c.item === 'ironSword' || c.item === 'silverSword') delete c.item; }));
  localStorage.setItem('mota-hd-zone1:7', JSON.stringify(d));
}, TIERS);
await page.reload({ waitUntil: 'networkidle0' }); await wait(1000);
ok(await G(() => JSON.parse(localStorage.getItem('mota-hd-zone1:1')).v === 3), '旧格式存档已迁移');
ok(await G(() => __renderer.shakeFlash()), '屏幕震动与闪光默认开启');

async function loadSlot(n) {
  ok(await tapEl('#btn-load'), '触屏点击「读档」');
  const pg = Math.ceil(n / 4);
  await G((pg) => { const i = document.querySelector('.page-input'); i.value = String(pg); i.dispatchEvent(new Event('change')); }, pg);
  await wait(150);
  await tapEl(`.slot[data-slot="${n}"] .s-thumb`);
  await wait(500);
  ok((await G(() => __game.hero.hp)) === 5000 + n, `读取存档 ${n}（第 ${pg} 页，触屏点击缩略图，无确认）`);
}
async function tapBattle(label, expectTier, shotName, speed = 'normal') {
  await G((s) => { __motion.stepMs = s === 'instant' ? 0 : s === 'faster' ? 45 : 130; }, speed);
  await G(() => { __renderer.lastWeaponFx = null; });
  await tapTile(6, 9);
  let f = null;
  for (let i = 0; i < 40 && !f; i++) { await wait(25); f = await G(() => __renderer.lastWeaponFx && { ...__renderer.lastWeaponFx, slash: __renderer.fx.filter((x) => x.kind === 'slash').map((x) => x.dur) }); }
  const dead = await G(() => !__game.floors[20][9][6].monster);
  ok(dead && f && f.tier === expectTier && f.slash.length === 1, `${label}：点击怪物 → 寻路攻击 → 档位 ${f?.tier} ${f?.id}（${f?.weapon}），斩击 ${f?.slash[0]}ms`);
  if (shotName && f) {
    await G((t) => __freezeAt(t), f.t + f.slash[0] * (expectTier >= 4 ? 0.3 : 0.28));
    await wait(120);
    const clip = await G(() => { const r = document.getElementById('game').getBoundingClientRect(); const a = __renderer.tileCenterCss({ x: 4, y: 7 }), b = __renderer.tileCenterCss({ x: 8, y: 11 }); const h = (b.x - a.x) / 8; return { x: r.left + a.x - h, y: r.top + a.y - h, width: b.x - a.x + h * 2, height: b.y - a.y + h * 2 }; });
    await page.screenshot({ path: `${OUT}/${shotName}.png`, clip });
    console.log('   📸', `${OUT}/${shotName}.png`);
    await G(() => __freezeAt(null));
  }
  await wait(600);
}
for (let i = 0; i < TIERS.length; i++) {
  await loadSlot(i + 1);
  const s = await G(() => ({ f: __game.floorId, w: __game.hero.weapon, pos: { ...__game.pos } }));
  ok(s.f === 20 && s.w === TIERS[i][0], `旧存档 ${i + 1}（${TIERS[i][2]}）读取：20F，武器 ${s.w}`);
  await tapBattle(`旧存档 ${TIERS[i][2]}`, i, `wfx-mobile-${i}-${TIERS[i][1]}`);
}
// 整屏：银剑（用户的情况）
await loadSlot(3);
await G(() => { __renderer.lastWeaponFx = null; });
await tapTile(6, 9);
let lf = null; for (let i = 0; i < 40 && !lf; i++) { await wait(25); lf = await G(() => __renderer.lastWeaponFx); }
const sd = await G(() => __renderer.fx.find((x) => x.kind === 'slash')?.dur);
await G((t) => __freezeAt(t), lf.t + sd * 0.28); await wait(120);
await page.screenshot({ path: `${OUT}/wfx-mobile-silver-full.png` }); console.log('   📸', `${OUT}/wfx-mobile-silver-full.png`);
await G(() => __freezeAt(null)); await wait(500);
// 缺少 weapon 字段的旧存档：推断为银剑
await loadSlot(7);
ok((await G(() => __game.hero.weapon)) === '银剑', `缺少武器字段的旧存档：按已拾取的剑推断为 ${await G(() => __game.hero.weapon)}`);
await tapBattle('推断武器的旧存档', 2, null);
// 各速度：很快 / 瞬移 都可见
await loadSlot(3);
await tapBattle('很快速度', 2, null, 'faster');
await loadSlot(3);
await tapBattle('瞬移速度（简短版）', 2, 'wfx-mobile-instant-silver', 'instant');

// 平板上的存档页 2×2：点击缩略图直接存档（闪光 +「已存档」）
await tapEl('#btn-save'); await wait(200);
await G(() => { const i = document.querySelector('.page-input'); i.value = '1'; i.dispatchEvent(new Event('change')); }); await wait(150);
const g = await G(() => { const r = [...document.querySelectorAll('.slots .slot')].map((e) => e.getBoundingClientRect()); const close = document.querySelector('.modal .modal-actions button').getBoundingClientRect(); return { n: r.length, cols: new Set(r.map((b) => Math.round(b.left))).size, rows: new Set(r.map((b) => Math.round(b.top))).size, fits: close.bottom <= innerHeight }; });
ok(g.n === 4 && g.cols === 2 && g.rows === 2 && g.fits, `平板 1024×768：存档页 2×2（${g.cols}×${g.rows}），整页放得下`);
await tapEl('.slot[data-slot="2"] .s-thumb'); await wait(120);
ok(await G(() => !document.querySelector('.s-confirm') && !!document.querySelector('.slot[data-slot="2"] .s-saved')), '点击已有存档的缩略图：直接覆盖，显示「已存档」');
await page.screenshot({ path: `${OUT}/r4-save-page-2x2-tablet.png` }); console.log('   📸', `${OUT}/r4-save-page-2x2-tablet.png`);
await wait(900);
await tapEl('.save-tab[data-tab="load"]'); await wait(200);
await page.screenshot({ path: `${OUT}/r4-load-page-2x2-tablet.png` }); console.log('   📸', `${OUT}/r4-load-page-2x2-tablet.png`);
const t0 = Date.now();
await tapEl('.slot[data-slot="1"] .s-thumb');
let done = false; for (let i = 0; i < 40 && !done; i++) { await wait(20); done = await G(() => document.getElementById('curtain')?.classList.contains('hidden') ?? true); }
ok(Date.now() - t0 < 700 && (await G(() => __game.hero.hp)) === 5001, `读档：无确认，短暂淡入淡出后完成（约 ${Date.now() - t0}ms，含触屏与轮询开销）`);
const sheet = `${OUT}/wfx-mobile-contact-sheet.png`;
execFileSync('python3', [new URL('./contact-sheet.py', import.meta.url).pathname, sheet, ...TIERS.map(([, id], i) => `${OUT}/wfx-mobile-${i}-${id}.png`)]);
console.log('   📸', sheet);
console.log(errs.length ? errs : 'no page errors'); await browser.close(); console.log(fails ? `❌ ${fails} failed` : 'ALL PASS'); process.exit(fails ? 1 : 0);
