// 自动清怪 / 自动拾取 / 自动开暗墙 / 回退 / 楼层传送器 的无头测试
import puppeteer from 'puppeteer-core';
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
await wait(1000);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = async (name) => { await wait(300); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };
const cell = (x, y) => G((x, y) => ({ ...__game.cell({ x, y }) }), x, y);
const tp = (f, x, y) => G((f, x, y) => __game.changeFloor(f, { x, y }), f, x, y);
const logs = () => G(() => __game.log.map((l) => l.text ?? l));
const key = async (k) => { await page.keyboard.press(k); await wait(250); };

// ---- 默认设置：全部关闭（设置版本 2）
const defs = await G(() => ({ ...window.__autoOpts }));
ok(!defs.clear && !defs.pickup && !defs.hidden, `默认：自动清怪 / 自动拾取 / 自动开暗墙 全部关闭 → ${JSON.stringify(defs)}`);
ok((await G(() => localStorage.getItem('mota-hd-zone1:value:autoSettingsVersion') ?? Object.keys(localStorage).find((k) => k.includes('autoSettingsVersion')))) !== null, '设置版本已写入');
// 旧版本存储（自动功能开）→ 重新加载后被重置为关闭
await G(() => { for (const k of Object.keys(localStorage)) if (k.includes('autoSettingsVersion')) localStorage.removeItem(k); localStorage.setItem('mota-hd-zone1:setting:autoClear', '1'); localStorage.setItem('mota-hd-zone1:setting:autoPickup', '1'); });
await page.reload({ waitUntil: 'networkidle0' }); await wait(800);
const defs2 = await G(() => ({ ...window.__autoOpts }));
ok(!defs2.clear && !defs2.pickup, `旧设置（开）在版本升级时被重置为关闭 → ${JSON.stringify(defs2)}`);
// 开启（经设置面板）——切换开关本身不触发
const toggle = (k, v) => G((k, v) => { const i = document.querySelector(`[data-toggle="${k}"]`); i.checked = v; i.dispatchEvent(new Event('change')); }, k, v);
await key('KeyO');
await toggle('autoClear', true); await toggle('autoPickup', true);
await key('Escape'); await wait(500);
ok((await cell(4, 9)).item === 'yellowKey', '开启自动拾取后（未走动）：同房间 (4,9) 黄钥匙仍在——切换设置不触发');

// ---- 序章：走一步后才自动拾取（只拾取钥匙），回退
await key('ArrowRight'); await wait(300);
let h = await G(() => ({ k: __game.hero.keys.yellow, pos: { ...__game.pos } }));
ok(h.k === 1 && !(await cell(4, 9)).item && h.pos.x === 6, `走出第一步后立即自动拾取（勇士仍在 (6,10)）→ 钥匙 ${h.k}`);
ok((await logs()).some((t) => String(t).includes('自动拾取：黄钥匙×1')), '消息记录：「自动拾取：黄钥匙×1」');
ok((await cell(5, 8)).door === 'yellow', '有钥匙也不会自动开门（(5,8) 黄门仍在）');
await key('KeyZ'); await wait(400);
h = await G(() => ({ k: __game.hero.keys.yellow, pos: { ...__game.pos } }));
ok(h.k === 0 && (await cell(4, 9)).item === 'yellowKey' && h.pos.x === 5, `回退一次：这一步 + 自动拾取一起撤销 → 钥匙 ${h.k}，位置 (${h.pos.x},${h.pos.y})`);
ok((await cell(4, 9)).item === 'yellowKey', '回退之后不会再次自动拾取（需再走一步）');
// 读档不触发
await G(() => __game.deserialize(__game.serialize())); await wait(400);
ok((await cell(4, 9)).item === 'yellowKey', '读档后不触发');

// ---- 自动清怪：到达楼层不触发；走一步后 0 伤害的打，>0 的不打
await G(() => { __game.flags.ambush3 = true; Object.assign(__game.hero, { hp: 400, atk: 20, def: 18 }); });
const dmg = await G(() => ({ g: __game.monsterInfo('greenSlime').forecast.damage, r: __game.monsterInfo('redSlime').forecast.damage }));
ok(dmg.g === 0 && dmg.r > 0, `测试属性：绿史莱姆伤害 ${dmg.g}，红史莱姆伤害 ${dmg.r}`);
await tp(1, 6, 0); await wait(500);
ok((await cell(4, 0)).monster === 'greenSlime', '换层到达 1F (6,0)：不触发，(4,0) 绿史莱姆仍在');
await key('ArrowRight'); await wait(500);
let c2 = await cell(2, 0), c3 = await cell(3, 0), c4 = await cell(4, 0);
h = await G(() => ({ hp: __game.hero.hp, gold: __game.hero.gold, pos: { ...__game.pos } }));
ok(!c4.monster && c3.monster === 'redSlime' && c2.monster === 'greenSlime', `走一步到 (7,0) 后：(4,0) 绿史莱姆被清除；(3,0) 红史莱姆（伤害 ${dmg.r}）保留；其后的 (2,0) 不可直达也保留`);
ok(h.hp === 400 && h.gold === 1 && h.pos.x === 7, `清怪无损血、金币 +1、勇士不动 → HP ${h.hp} 金币 ${h.gold}`);
ok((await logs()).some((t) => String(t).includes('自动清怪：绿色史莱姆×1')), '消息记录：「自动清怪：绿色史莱姆×1（金币 +1）」');
await key('KeyZ'); await wait(300);
ok((await cell(4, 0)).monster === 'greenSlime' && (await G(() => __game.hero.gold)) === 0, '回退：这一步 + 自动清怪一起撤销，史莱姆复活、金币 0');
// 经楼梯到达不触发：2F 下楼 → 1F (1,0)，旁边 (2,0) 就是 0 伤害绿史莱姆
await tp(2, 0, 1); await wait(300);
await key('ArrowUp'); await wait(1100);
const arr = await G(() => ({ f: __game.floorId, x: __game.pos.x, y: __game.pos.y }));
ok(arr.f === 1 && arr.x === 1 && arr.y === 0 && (await cell(2, 0)).monster === 'greenSlime', '走楼梯到达 1F (1,0)：不触发，相邻 0 伤害的 (2,0) 史莱姆仍在');

// ---- 自动拾取：不含血瓶 → 含血瓶
await key('KeyO');
await toggle('autoPotions', false);
await shot('17-settings-auto');
await key('Escape');
ok((await G(() => localStorage.getItem('mota-hd-zone1:setting:autoPotions'))) === '0', '「含血瓶」关闭已保存到 localStorage');
await G(() => { __game.hero.keys.yellow = 0; });
await tp(1, 1, 8); await wait(400);
ok((await cell(2, 9)).item === 'yellowKey', '到达 (1,8)：不触发');
await key('ArrowLeft'); await wait(500);
let k = await G(() => __game.hero.keys.yellow);
ok(k === 2 && !(await cell(2, 9)).item && !(await cell(2, 10)).item, `走一步后（不含血瓶）：拾取 (2,9)(2,10) 两把黄钥匙 → ${k}`);
ok((await cell(0, 9)).item === 'redPotion' && (await cell(0, 10)).item === 'redPotion', '不含血瓶：(0,9)(0,10) 血瓶留在原地');
ok((await cell(1, 10)).item === 'fly', '魔杖等剧情道具不会被自动拾取');
ok((await cell(1, 7)).door === 'yellow', '有钥匙也不自动开门（(1,7) 黄门仍在）');
const hp0 = await G(() => __game.hero.hp);
await key('KeyO'); await toggle('autoPotions', true); await key('Escape'); await wait(400);
ok((await cell(0, 9)).item === 'redPotion', '打开「含血瓶」本身不触发');
await key('ArrowRight'); await wait(500);
const hp1 = await G(() => __game.hero.hp);
ok(!(await cell(0, 9)).item && !(await cell(0, 10)).item && hp1 > hp0, `再走一步：两瓶血瓶被拾取 HP ${hp0} → ${hp1}`);
await key('KeyZ'); await wait(300);
ok((await cell(0, 9)).item === 'redPotion' && (await G(() => __game.hero.hp)) === hp0, '回退：血瓶回到地上，HP 恢复');

// ---- 自动开暗墙
await tp(5, 7, 9); await wait(300);
await key('ArrowDown'); await key('ArrowUp'); await wait(300);
ok((await cell(8, 10)).terrain === 'hiddenWall', '自动开暗墙关闭：5F (8,10) 暗墙未被打开');
await key('KeyO'); await toggle('autoHidden', true); await key('Escape'); await wait(300);
ok((await cell(8, 10)).terrain === 'hiddenWall', '开启后：勇士还没走步，暗墙不会被打开');
await key('ArrowDown'); await wait(500);
ok((await cell(8, 10)).terrain === 'floor', '开启后：走一步，可直接到达的暗墙 (8,10) 自动打开');
ok((await logs()).some((t) => String(t).includes('自动打开暗墙')), '消息记录：「自动打开暗墙」');
await key('KeyZ'); await wait(300);
ok((await cell(8, 10)).terrain === 'hiddenWall', '回退：暗墙恢复');
await tp(5, 7, 10); await wait(400);
ok((await cell(8, 10)).terrain === 'hiddenWall', '直接到达暗墙旁（换层）不触发');

// ---- 剧情期间不自动行动：10F 伏击
await G(() => { Object.assign(__game.hero, { atk: 500, def: 500 }); __game.flags.ambush10 = true; });
await tp(10, 5, 6); await wait(300);
await key('ArrowDown'); await wait(500);
const mons10 = await G(() => __game.grid.flat().filter((c) => c.monster).length);
ok(mons10 > 0, `10F 伏击中（未击败骷髅队长）走动也不自动清怪：本层仍有 ${mons10} 个怪物`);

// ---- 楼层传送器
await G(() => { __game.flags.ambush10 = false; Object.assign(__game.hero, { atk: 20, def: 18 }); __game.visited.clear(); for (const f of [1, 2, 3, 5, 6, 8, 9, 10]) __game.visited.add(f); });
await G(() => { for (const k of ['autoClear', 'autoPickup', 'autoHidden']) window.__autoOpts[k] = false; });
await tp(5, 3, 3); await wait(300);
await key('KeyF');
ok(await G(() => document.getElementById('overlay').classList.contains('hidden')), '不在楼梯旁：传送器不打开（保留原版规则）');
await tp(5, 0, 9); await wait(300);
await key('KeyF'); await wait(200);
const sel = () => G(() => Number(document.querySelector('.fly-pic:not(.leaving)')?.dataset.floor ?? 0));
const pv = () => G(() => {
  const shown = document.querySelector('.fly-pic:not(.leaving)');
  const px = (cv) => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const a = px(shown);
  let best = 0, bestD = Infinity;
  for (let f = 1; f <= 10; f++) {
    const b = px(__renderer.floorPreview(f, 64));
    let d = 0;
    for (let i = 0; i < a.length; i += 64) d += Math.abs(a[i] - b[i]);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
});
const btn = (k) => G((k) => document.querySelector(`[data-fly="${k}"]`).click(), k);
const dis = () => G(() => Object.fromEntries(['up10', 'up', 'down', 'down10'].map((k) => [k, document.querySelector(`[data-fly="${k}"]`).disabled])));
ok((await sel()) === 5 && (await pv()) === 5, `打开时预览当前楼层 5F（像素比对 → ${await pv()}F）`);
ok(await G(() => !!document.querySelector('[data-fly="up10"]') && !!document.querySelector('[data-fly="down10"]')), '有 ▲▲（上 10 层）与 ▼▼（下 10 层）按钮');
const dur = await G(() => getComputedStyle(document.querySelector('.fly-pic')).animationDuration);
await btn('down'); await wait(60);
const dur2 = await G(() => getComputedStyle(document.querySelector('.fly-pic:not(.leaving)')).animationDuration);
ok(dur2 === '0.12s', `切换动画加快：${dur2}（原 0.26s）`);
ok((await sel()) === 3, `▼：跳过未到过的 4F → ${await sel()}F`);
await wait(200);
ok((await G(() => document.querySelectorAll('.fly-pic').length)) === 1, '旧预览在 150 ms 内移除');
await btn('up10'); await wait(200);
ok((await sel()) === 10 && (await pv()) === 10, `▲▲：到过的楼层不足 10 个 → 停在该方向最远的到过楼层 ${await sel()}F（像素比对 ${await pv()}F）`);
let d = await dis();
ok(d.up && d.up10 && !d.down && !d.down10, `最高层：▲ 与 ▲▲ 一起禁用 ${JSON.stringify(d)}`);
await shot('16-fly-ui');
await btn('down10'); await wait(200);
ok((await sel()) === 1, `▼▼ → ${await sel()}F（最低到过楼层）`);
d = await dis();
ok(d.down && d.down10 && !d.up && !d.up10, '最低层：▼ 与 ▼▼ 一起禁用');
await key('ArrowRight'); await wait(150);
ok((await sel()) === 10, `键盘 → = +10 → ${await sel()}F`);
await key('ArrowLeft'); await wait(150);
ok((await sel()) === 1, `键盘 ← = −10 → ${await sel()}F`);
await key('ArrowUp'); await wait(150);
ok((await sel()) === 2, `键盘 ↑ = +1 → ${await sel()}F`);
await key('ArrowUp'); await key('ArrowUp'); await wait(150);
ok((await sel()) === 5, `↑↑：3F → 5F 跳过 4F → ${await sel()}F`);
const stageBox = await G(() => { const r = document.querySelector('.fly-stage').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await page.mouse.move(stageBox.x, stageBox.y);
await page.mouse.wheel({ deltaY: -120 }); await wait(250);
ok((await sel()) === 6, `滚轮向上 = +1 → ${await sel()}F`);
await page.mouse.wheel({ deltaY: 120 }); await wait(250);
ok((await sel()) === 5, `滚轮向下 = −1 → ${await sel()}F`);
const swipe = (dy) => G((dy) => {
  const el = document.querySelector('.fly-stage');
  const r = el.getBoundingClientRect();
  const o = { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: r.left + 50, clientY: r.top + 150 };
  el.dispatchEvent(new PointerEvent('pointerdown', o));
  el.dispatchEvent(new PointerEvent('pointerup', { ...o, clientY: o.clientY + dy }));
}, dy);
await swipe(80); await wait(200);
ok((await sel()) === 3, `下滑 → ${await sel()}F`);
await swipe(-80); await wait(200);
ok((await sel()) === 5, `上滑 → ${await sel()}F`);
await key('ArrowDown');
await G(() => [...document.querySelectorAll('#overlay .modal-actions button')].find((b) => b.textContent === '取消').click()); await wait(300);
ok((await G(() => __game.floorId)) === 5 && (await G(() => document.getElementById('overlay').classList.contains('hidden'))), '「取消」：关闭且不传送');
// 传送到达不触发自动功能：开启自动清怪后飞往 1F（落在 (1,0)，相邻 0 伤害史莱姆）
await G(() => { window.__autoOpts.clear = true; });
await key('KeyF'); await key('ArrowLeft');
ok((await sel()) === 1, `选择 1F → ${await sel()}F`);
await key('Enter'); await wait(1100);
let s = await G(() => ({ f: __game.floorId, pos: { ...__game.pos } }));
ok(s.f === 1 && s.pos.x === 1 && s.pos.y === 0, `Enter 传送：到达 1F 上楼梯旁 → ${s.f}F (${s.pos.x},${s.pos.y})`);
ok((await cell(2, 0)).monster === 'greenSlime', '传送到达后不触发自动清怪（(2,0) 史莱姆仍在）');
await G(() => { window.__autoOpts.clear = false; });
const histFly = await G(() => __history.length);
await key('KeyF'); await key('ArrowUp'); await wait(100);
await G(() => document.querySelector('#overlay .modal-actions .primary').click()); await wait(1100);
ok((await G(() => __game.floorId)) === 2, `「传送」按钮：到达 ${await G(() => __game.floorId)}F`);
ok((await G(() => __history.length)) === histFly, `传送 / 换层不占用回退（历史 ${histFly} → ${await G(() => __history.length)}）`);

ok(errs.length === 0, `无页面错误 ${errs.join(' | ')}`);
console.log(fails ? `\n❌ ${fails} 项失败` : '\n✅ 自动功能 / 传送器检查全部通过');
await browser.close();
process.exit(fails ? 1 : 0);
