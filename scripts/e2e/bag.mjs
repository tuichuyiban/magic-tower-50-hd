// 背包面板 / 道具注册表 / 悬停情报浮窗（仅鼠标）的无头测试
import puppeteer from 'puppeteer-core';
const OUT = '/workspace/magic-tower/shots';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
const errs = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log((c ? '✅ ' : '❌ ') + msg); if (!c) fails++; };
async function open(touch) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await page.setViewport({ width: touch ? 900 : 1280, height: touch ? 600 : 800, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch });
  await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); for (const k of ['autoClear', 'autoPickup']) localStorage.setItem('mota-hd-zone1:setting:' + k, '0'); });
  await page.goto(`http://localhost:4173/?new${touch ? '' : '&hover'}`, { waitUntil: 'networkidle0' });
  await wait(800);
  return page;
}
let page = await open(false);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = async (name) => { await wait(300); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };
const slotXY = (i) => G((i) => { const r = document.getElementById('game').getBoundingClientRect(); const s = __renderer.bagSlotCss(i); return s && { x: r.left + s.x, y: r.top + s.y }; }, i);
const tileXY = (x, y) => G((x, y) => { const r = document.getElementById('game').getBoundingClientRect(); const t = __renderer.tileCenterCss({ x, y }); return { x: r.left + t.x, y: r.top + t.y }; }, x, y);
const modalTitle = () => G(() => document.getElementById('overlay').classList.contains('hidden') ? '' : document.querySelector('#overlay .modal-title').textContent);
const owned = () => G(() => __inventory.owned().map((s) => s.item.id));

ok(JSON.stringify(await owned()) === '["fly"]', `开局背包：${await owned()}`);
await G(() => { __game.hero.tools.book = true; __game.hero.tools.notebook = true; });
await wait(100);
ok(JSON.stringify(await owned()) === '["fly","book","notebook"]', `获得手册 / 备忘录后：${await owned()}`);
// 悬停显示说明
let p = await slotXY(1);
await page.mouse.move(p.x, p.y); await wait(200);
ok((await G(() => __renderer.bagHover)) === 1, '鼠标悬停背包格：显示名称与说明');
await shot('18-backpack-panel');
// 点击手册 → 手册
await page.mouse.click(p.x, p.y); await wait(300);
ok((await modalTitle()).startsWith('怪物手册'), `点击「怪物手册」→ ${await modalTitle()}`);
await page.keyboard.press('Escape'); await wait(200);
p = await slotXY(2); await page.mouse.click(p.x, p.y); await wait(300);
ok((await modalTitle()).startsWith('备忘录'), `点击「备忘录」→ ${await modalTitle()}`);
await page.keyboard.press('Escape'); await wait(200);
// 魔杖：不在楼梯旁 → 提示；楼梯旁 → 传送器
p = await slotXY(0); await page.mouse.click(p.x, p.y); await wait(300);
ok((await modalTitle()) === '', '不在楼梯旁点击「魔杖」：不打开（提示须在楼梯旁）');
await G(() => __game.changeFloor(1, { x: 1, y: 0 })); await wait(300);
p = await slotXY(0); await page.mouse.click(p.x, p.y); await wait(300);
ok(!!(await G(() => document.querySelector('.flyer'))), `楼梯旁点击「魔杖」→ ${await modalTitle()}`);
await page.keyboard.press('Escape'); await wait(200);
await page.keyboard.press('KeyG'); await wait(300);
ok(!!(await G(() => document.querySelector('#overlay:not(.hidden) .flyer'))), 'G 键打开楼层传送器');
await page.keyboard.press('KeyG'); await wait(200);
ok((await modalTitle()) === '', '再按 G 关闭');
await page.keyboard.press('KeyF'); await wait(300);
ok(!!(await G(() => document.querySelector('#overlay:not(.hidden) .flyer'))), 'F 键仍可打开传送器');
await page.keyboard.press('Escape'); await wait(200);
// 注册表扩展：模拟以后的道具 → 分页
await G(() => {
  window.__used = 0;
  const S = __renderer.sprites.item;
  const demo = [['wing', '升降之翼', S.redGem], ['holyWater', '圣水', S.bluePotion], ['pickaxe', '破墙镐', S.ironSword], ['bomb', '炸弹', S.redPotion], ['cross', '十字架', S.blueGem], ['coin', '幸运金币', S.yellowKey], ['snow', '冰冻徽章', S.blueKey]];
  for (const [id, name, icon] of demo) __inventory.register({ id, name, desc: `测试用道具：${name}，用于验证注册表与分页。`, icon: () => icon, count: () => 3, use: () => { window.__used++; } });
});
await wait(200);
ok((await owned()).length === 10, `注册 7 个新道具 → 背包共 ${(await owned()).length} 个，分 2 页`);
await page.mouse.move(5, 5); await wait(150);
await shot('18b-backpack-page1');
const next = await G(() => { const r = document.getElementById('game').getBoundingClientRect(); for (let y = 0; y < 600; y += 2) for (let x = 0; x < 260; x += 2) { const h = __renderer.bagHit(x, y); if (h?.kind === 'next') return { x: r.left + x + 3, y: r.top + y + 3 }; } return null; });
ok(!!next, '出现翻页按钮 ▶');
await page.mouse.click(next.x, next.y); await wait(200);
ok((await G(() => __renderer.bagPage)) === 1, '翻到第 2 页');
p = await slotXY(8); await page.mouse.click(p.x, p.y); await wait(200);
ok((await G(() => window.__used)) === 0 && (await G(() => !!document.querySelector('#overlay:not(.hidden) .use-confirm'))), '点击第 2 页的新（消耗型）道具 → 自动弹出使用确认框');
await G(() => [...document.querySelectorAll('#overlay .modal-actions button')].find((b) => b.textContent === '使用').click()); await wait(200);
ok((await G(() => window.__used)) === 1, '确认后调用其 use()');
await page.mouse.move(p.x, p.y); await wait(150);
await shot('18c-backpack-page2');
// 悬停怪物：浮窗（仅鼠标）
await G(() => { for (const id of ['wing', 'holyWater', 'pickaxe', 'bomb', 'cross', 'coin', 'snow']) __inventory.unregister(id); __game.changeFloor(1, { x: 1, y: 0 }); });
await wait(200);
const t = await tileXY(2, 0);
await page.mouse.move(t.x, t.y); await wait(250);
ok(JSON.stringify(await G(() => __renderer.hover)) === '{"x":2,"y":0}' , '鼠标悬停怪物：显示情报浮窗（hover: hover 设备；无头测试用 ?hover 模拟）');
await shot('19-monster-hover-tip');
await page.close();

// ---- 触屏：点击怪物 = 寻路攻击，不弹情报；长按背包看说明、轻点使用
page = await open(true);
const G2 = (fn, ...a) => page.evaluate(fn, ...a);
await G2(() => { __game.hero.tools.book = true; __game.changeFloor(1, { x: 1, y: 0 }); });
await wait(300);
const tt = await G2(() => { const r = document.getElementById('game').getBoundingClientRect(); const t = __renderer.tileCenterCss({ x: 2, y: 0 }); return { x: r.left + t.x, y: r.top + t.y }; });
await page.touchscreen.tap(tt.x, tt.y); await wait(800);
const r2 = await G2(() => ({ hover: __renderer.hover, mon: __game.cell({ x: 2, y: 0 }).monster, modal: !document.getElementById('overlay').classList.contains('hidden') }));
ok(r2.hover === null && !r2.mon && !r2.modal, `触屏点击怪物：直接攻击（怪物已被击败），不显示情报浮窗 / 弹窗 → hover=${JSON.stringify(r2.hover)}`);
const bs = await G2(() => { const r = document.getElementById('game').getBoundingClientRect(); const s = __renderer.bagSlotCss(1); return { x: r.left + s.x, y: r.top + s.y }; });
await G2(() => { const s = __renderer.bagSlotCss(1); const cv = document.getElementById('game'); const r = cv.getBoundingClientRect(); window.__pe = { bubbles: true, pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: r.left + s.x, clientY: r.top + s.y }; cv.dispatchEvent(new PointerEvent('pointerdown', window.__pe)); });
await wait(650);
await G2(() => document.getElementById('game').dispatchEvent(new PointerEvent('pointerup', window.__pe)));
await wait(200);
const lp = await G2(() => ({ hov: __renderer.bagHover, modal: !document.getElementById('overlay').classList.contains('hidden') }));
ok(lp.hov === 1 && !lp.modal, '触屏长按背包格：只显示说明，不使用');
await page.touchscreen.tap(bs.x, bs.y); await wait(400);
ok((await G2(() => document.querySelector('#overlay .modal-title').textContent)).startsWith('怪物手册') && (await G2(() => !document.getElementById('overlay').classList.contains('hidden'))), '触屏轻点「怪物手册」→ 打开手册');
await page.close();

ok(errs.length === 0, `无页面错误 ${errs.join(' | ')}`);
console.log(fails ? `\n❌ ${fails} 项失败` : '\n✅ 背包 / 悬停情报检查全部通过');
await browser.close();
process.exit(fails ? 1 : 0);
