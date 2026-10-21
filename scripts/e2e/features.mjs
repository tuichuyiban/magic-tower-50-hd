import puppeteer from 'puppeteer-core';
const OUT = '/workspace/magic-tower/shots';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--font-render-hinting=none', '--autoplay-policy=user-gesture-required'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log((c ? '✅ ' : '❌ ') + msg); if (!c) fails++; };
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2, hasTouch: false, isLandscape: true });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => { for (const k of ['autoClear', 'autoPickup', 'autoHidden']) localStorage.setItem('mota-hd-zone1:setting:' + k, '0'); });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(1200);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const flySel = () => page.evaluate(() => Number(document.querySelector('.fly-pic:not(.leaving)')?.dataset.floor ?? 0));
async function flyPick(n) {
  for (let i = 0; i < 12; i++) {
    const cur = await flySel();
    if (cur === n) break;
    await page.keyboard.press(cur < n ? 'ArrowUp' : 'ArrowDown'); await wait(120);
  }
  await page.keyboard.press('Enter');
}

const st = () => G(() => ({ f: __game.floorId, pos: { ...__game.pos }, hero: JSON.parse(JSON.stringify(__game.hero)), busy: __director.busy, dlg: __dialog.isOpen }));
async function advance(max = 40) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    await wait(120);
    const open = await G(() => __dialog.isOpen);
    if (!open) { if (!(await G(() => __director.busy))) break; await wait(200); continue; }
    if (await G(() => document.querySelectorAll('#dialog .dlg-choices button').length)) return { seen, choices: true };
    seen.push(await G(() => __dialog.full));
    await G(() => document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  }
  return { seen, choices: false };
}
const tp = (f, x, y) => G((f, x, y) => { __game.changeFloor(f, { x, y }); }, f, x, y);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await wait(200); } };
const shot = async (name) => { await wait(250); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };
const clickTile = async (x, y) => {
  const c = await G((x, y) => { const r = document.getElementById('game').getBoundingClientRect(); const t = __renderer.tileCenterCss({ x, y }); return { x: r.left + t.x, y: r.top + t.y }; }, x, y);
  await page.mouse.click(c.x, c.y);
};

// ---- 音频：首次手势前未创建，手势后 running
let a = await G(() => __audio.state);
ok(a === 'none', `首次用户手势前不创建 AudioContext → ${a}`);
await clickTile(5, 10); // 点击自身所在格：只作为手势
await wait(400);
a = await G(() => ({ s: __audio.state, e: __audio.errors }));
ok(a.s === 'running' && a.e === 0, `首次手势后 AudioContext 启动 → ${a.s}，错误 ${a.e}`);
const allSfx = ['step', 'hit', 'kill', 'door', 'hidden', 'item', 'key', 'gem', 'potion', 'equip', 'buy', 'stairs', 'blip', 'error', 'undo', 'save', 'heavy'];
await G(async (list) => { for (const s of list) { __audio.play(s, 3); await new Promise((r) => setTimeout(r, 120)); } }, allSfx);
await wait(800);
a = await G(() => ({ e: __audio.errors, t: __audio.track }));
ok(a.e === 0 && a.t === 'tower', `${allSfx.length} 种音效全部播放无错误，背景音乐：${a.t}`);

// ---- 魔杖开局即有
let s = await st();
ok(s.hero.tools.fly === true && !(await G(() => document.getElementById('btn-fly').classList.contains('locked'))), '开局即拥有魔杖（按钮可用）');
await tp(1, 1, 0); await key('ArrowLeft'); await wait(800);
s = await st();
ok(s.f === 2, `上到 2F → ${s.f}F`);
await key('KeyF'); await wait(300);
const fsel = await flySel();
const okTxt = await G(() => document.querySelector('#overlay .modal-actions .primary').textContent);
ok(fsel === 2 && okTxt === '当前楼层', `未拾取 1F 魔杖也能打开传送器（预览 ${fsel}F；刚上楼已在下楼梯旁 → 「${okTxt}」）`);
await flyPick(1); await wait(900);
s = await st();
ok(s.f === 1 && s.pos.x === 1 && s.pos.y === 0, `飞回 1F（落在上楼梯旁 (1,0)）→ ${s.f}F (${s.pos.x},${s.pos.y})`);

// ---- 回退：拾取 / 开门 / 战斗
await tp(1, 5, 10); await wait(100);
const hist0 = await G(() => __history.length);
await key('ArrowUp'); await key('ArrowLeft'); // (4,9) 黄钥匙
s = await st();
ok(s.hero.keys.yellow === 1, `拾取黄钥匙 → ${s.hero.keys.yellow}`);
await key('ArrowRight'); await key('ArrowUp'); // 开 (5,8) 黄门
const door = await G(() => __game.cell({ x: 5, y: 8 }).door);
ok(!door && (await st()).hero.keys.yellow === 0, '开门：(5,8) 黄门打开，钥匙 0');
await tp(1, 8, 9); await key('ArrowDown'); await wait(300); // 打 (8,10) 绿色史莱姆
s = await st();
const goldAfter = s.hero.gold;
ok(!(await G(() => __game.cell({ x: 8, y: 10 }).monster)) && goldAfter === 1, `战斗：击败绿色史莱姆，金币 ${goldAfter}`);
const hist1 = await G(() => __history.length);
ok(hist1 - hist0 === 3, `历史栈记录了 3 个事件（走路不占用）：${hist0} → ${hist1}`);
await key('KeyZ'); await wait(200);
s = await st();
ok((await G(() => __game.cell({ x: 8, y: 10 }).monster)) === 'greenSlime' && s.hero.gold === 0 && s.pos.x === 8 && s.pos.y === 9, `回退战斗：史莱姆复活、金币 ${s.hero.gold}、位置 (${s.pos.x},${s.pos.y})`);
await G(() => document.getElementById('btn-undo').click()); await wait(200);
ok((await G(() => __game.cell({ x: 5, y: 8 }).door)) === 'yellow' && (await st()).hero.keys.yellow === 1, '回退开门（按钮）：黄门恢复、钥匙 1');
await key('KeyZ'); await wait(200);
s = await st();
ok(s.hero.keys.yellow === 0 && (await G(() => __game.cell({ x: 4, y: 9 }).item)) === 'yellowKey', '回退拾取：钥匙回到地上');
// 第二轮反馈：走路与上下楼都不算操作——一次回退越过它们，回到最近一次战斗之前
await tp(1, 8, 9); await key('ArrowDown'); await wait(300); // 再打 (8,10) 史莱姆
const histB = await G(() => __history.length);
await key('ArrowUp'); await key('ArrowLeft'); await wait(200); // 走两步
await G(() => { __game.beforeAction(); __game.changeFloor(2, 'fromBelow'); }); await wait(400); // 上楼（与踩楼梯同一路径）
await key('ArrowRight'); await key('ArrowLeft'); await wait(300); // 2F 走几步
ok((await G(() => __history.length)) === histB, `走路 / 上楼不占用历史（${histB} → ${await G(() => __history.length)}）`);
await key('KeyZ'); await wait(300);
s = await st();
ok(s.f === 1 && s.pos.x === 8 && s.pos.y === 9 && (await G(() => __game.cell({ x: 8, y: 10 }).monster)) === 'greenSlime', `一次回退越过走路与换层：回到 ${s.f}F (${s.pos.x},${s.pos.y})，史莱姆复活`);

// ---- 回退剧情：3F 魔王伏击 → 2F 监狱
await tp(3, 4, 9); await wait(100);
await key('ArrowUp'); await wait(500);
await advance();
await wait(1500); await advance();
s = await st();
ok(s.f === 2 && s.hero.hp === 400 && s.hero.atk === 10, `3F 伏击后在 2F 监狱：${s.f}F ${s.hero.hp}/${s.hero.atk}/${s.hero.def}`);
await wait(300);
await key('KeyZ'); await wait(300);
s = await st();
const fl = await G(() => ({ a: !!__game.flags.ambush3, g: __game.cell({ x: 4, y: 7 }, 3).npc ?? '-' }));
ok(s.f === 3 && s.pos.x === 4 && s.pos.y === 9 && s.hero.hp === 1000 && s.hero.weapon === '神圣剑' && !fl.a && fl.g === '-', `回退伏击剧情：回到 3F (4,9)，1000/100/100 神圣剑，剧情标志已清除`);

// ---- 设置面板：步长
await key('KeyO'); await wait(300);
ok(await G(() => !!document.querySelector('.settings [data-speed="instant"]')), '设置面板打开（O 键）');
await shot('12-settings-panel');
await G(() => document.querySelector('[data-speed="instant"]').click());
await G(() => document.querySelector('.modal-actions button').click()); await wait(200);
ok((await G(() => localStorage.getItem('mota-hd-zone1:setting:speed'))) === 'instant', '步长设置已保存到 localStorage');
await tp(1, 5, 10); await wait(100);
await G(() => { __game.cell({ x: 5, y: 8 }, 1).door = undefined; delete __game.cell({ x: 5, y: 8 }, 1).door; });
await clickTile(5, 7); await wait(60);
s = await st();
ok(s.pos.x === 5 && s.pos.y === 7, `瞬移：点击 (5,7) 后立即到达 → (${s.pos.x},${s.pos.y})`);
await key('KeyO'); await wait(200);
await G(() => document.querySelector('[data-speed="slow"]').click());
await G(() => document.querySelector('.modal-actions button').click()); await wait(200);
await clickTile(5, 10);
const t0 = Date.now();
for (let i = 0; i < 40; i++) { if ((await st()).pos.y === 10) break; await wait(25); }
const slowMs = Date.now() - t0;
ok(slowMs >= 350, `慢速：走 3 格用时 ${slowMs}ms（标准约 260ms，慢速约 400ms）`);
await G(() => { __motion; }); 
await key('KeyO'); await wait(200);
await G(() => document.querySelector('[data-speed="normal"]').click());
await G(() => document.querySelector('.modal-actions button').click()); await wait(200);

// ---- 暗墙：外观略暗；点击暗墙自动走到旁边并撞开；点击普通墙无反应
await tp(5, 7, 9); await wait(300);
await shot('13-hidden-wall');
await clickTile(6, 10); await wait(300);
s = await st();
ok(s.pos.x === 7 && s.pos.y === 9 && (await G(() => __walker.dest)) === null, '点击普通墙：没有任何反应');
await clickTile(8, 10); await wait(700);
s = await st();
const hw = await G(() => __game.cell({ x: 8, y: 10 }).terrain);
ok(hw === 'floor' && s.pos.x === 7 && s.pos.y === 10, `点击暗墙：走到 (7,10) 后撞开 → 地形 ${hw}`);

// ---- 存档：缩略图
await key('KeyP'); await wait(300);
await G(() => document.querySelector('.slot[data-slot="1"] button[data-action="save"]').click()); await wait(300);
const th = await G(() => localStorage.getItem('mota-hd-zone1:thumb:1') ?? '');
ok(/^data:image\/(webp|jpeg)/.test(th) && th.length < 30000, `存档 1 带缩略图：${th.slice(5, 15)}，${(th.length / 1024).toFixed(1)} KB`);
ok(await G(() => !!document.querySelector('.slot[data-slot="1"] .s-thumb img')), '存档格显示缩略图、楼层、属性、时间');
const info = await G(() => document.querySelector('.slot[data-slot="1"] .s-info').innerText.replace(/\n/g, ' '));
console.log('   ', info);
await G(() => document.querySelector('.slot[data-slot="2"] button[data-action="save"]').click()); await wait(200);
await shot('14-save-screen');
await G(() => document.querySelector('.pager [data-action="next"]').click()); await wait(200);
const p2 = await G(() => [...document.querySelectorAll('.slot')].map((e) => e.dataset.slot).join(','));
ok(p2 === '5,6,7,8', `翻页：第 2 页存档 ${p2}`);
await G(() => document.querySelector('.pager [data-action="prev"]').click()); await wait(100);
await G(() => document.querySelector('.modal-actions button').click()); await wait(200);
await tp(5, 9, 10); await G(() => { __game.hero.hp = 1; }); await wait(100);
await key('KeyL'); await wait(300);
await G(() => document.querySelector('.slot[data-slot="1"] button[data-action="load"]').click()); await wait(900);
s = await st();
ok(s.f === 5 && s.pos.x === 7 && s.pos.y === 10 && s.hero.hp === 1000, `读档 1：5F (7,10) 生命 ${s.hero.hp}`);

// ---- 对话头像
await tp(3, 10, 4); await key('ArrowUp'); await wait(900);
const face = await G(() => { const i = document.querySelector('#dialog .dlg-face'); return { src: i.src.slice(0, 22), w: i.naturalWidth, name: document.querySelector('#dialog .dlg-name').textContent }; });
ok(face.src.startsWith('data:image/png') && face.w === 256, `对话框显示高清头像：${face.name} ${face.w}px`);
await shot('15-dialog-portrait');
const faces = await G(() => Object.keys(__portraits));
ok(faces.length === 15, `头像共 ${faces.length} 个：${faces.join(', ')}`);
await advance();
await G(() => document.querySelector('#dialog .dlg-choices button')?.click()); await wait(400); await advance();

// ---- 第 10 层伏击：紧张音乐
await G(() => { __game.hero.atk = 60; __game.hero.def = 60; __game.hero.hp = 5000; });
await tp(10, 5, 5); await key('ArrowUp'); await wait(300); await advance(); await wait(2500);
ok((await G(() => __audio.track)) === 'tension', `10F 伏击时切换为紧张曲：${await G(() => __audio.track)}`);

ok((await G(() => __audio.errors)) === 0, '音频无错误');
ok(errs.length === 0, `无页面错误 ${errs.join(' | ')}`);
console.log(fails ? `❌ ${fails} 项失败` : '✅ 新功能检查全部通过');
await browser.close();
process.exit(fails ? 1 : 0);
