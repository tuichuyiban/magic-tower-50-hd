// 用户反馈修复（29F 小偷 / 自动清怪 / 41F 牢墙）与新建议的无头测试
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
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2, hasTouch: true, isLandscape: true });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await page.evaluate(() => { localStorage.clear(); for (const k of ['autoClear', 'autoPickup', 'autoHidden']) localStorage.setItem('mota-hd-zone1:setting:' + k, '0'); });
const G = (fn, ...a) => page.evaluate(fn, ...a);
const st = () => G(() => ({ f: __game.floorId, pos: __game.pos, hero: __game.hero, flags: __game.flags }));
async function advance(max = 40) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    await wait(120);
    const open = await G(() => __dialog.isOpen);
    if (!open) { if (!(await G(() => __director.busy))) break; await wait(200); continue; }
    if (await G(() => document.querySelectorAll('#dialog .dlg-choices button').length)) return { seen, choices: true };
    const t = (await G(() => document.querySelector('#dialog .dlg-name').textContent)) + '：' + (await G(() => __dialog.full));
    if (!seen.includes(t)) seen.push(t);
    await G(() => document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  }
  return { seen, choices: false };
}
async function choices() {
  for (let i = 0; i < 60; i++) {
    const n = await G(() => document.querySelectorAll('#dialog .dlg-choices button').length);
    if (n) return n;
    await G(() => __dialog.isOpen && document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await wait(80);
  }
  return 0;
}
const dlgText = () => G(() => document.querySelector('#dialog .dlg-name').textContent + '：' + __dialog.full);
const pick = async (i) => { await choices(); await G((i) => document.querySelectorAll('#dialog .dlg-choices button')[i].click(), i); await wait(300); };
const tp = (f, x, y) => G((f, x, y) => { __game.changeFloor(f, { x, y }); }, f, x, y);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await wait(170); } };
const shot = async (name) => { await wait(300); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };
const cell = (x, y, f) => G((x, y, f) => __game.cell({ x, y }, f ?? __game.floorId), x, y, f);
const settle = async () => { for (let i = 0; i < 50 && (await G(() => __director.busy || __dialog.isOpen)); i++) await advance(); };
const setHero = (o) => G((o) => { Object.assign(__game.hero, o); __game.touchMap(); }, o);
const tools = (o) => G((o) => { Object.assign(__game.hero.tools, o); __game.touchMap(); }, o);
const tileXY = (x, y) => G((x, y) => { const r = document.getElementById('game').getBoundingClientRect(); const t = __renderer.tileCenterCss({ x, y }); return { x: r.left + t.x, y: r.top + t.y }; }, x, y);
const at = (x, y) => G((x, y) => { __game.pos = { x, y }; __game.touchMap(); }, x, y);
const dmgAt = (x, y) => G((x, y) => __game.mapDamage().damage[y][x], x, y);
const click = async (x, y) => { const p = await tileXY(x, y); await page.mouse.click(p.x, p.y); await wait(200); };
const walkDone = async () => { for (let i = 0; i < 80 && (await G(() => __walker.active)); i++) await wait(100); await wait(200); await settle(); };
const logs = () => G(() => __game.log.map((l) => String(l.text ?? l)));

// ================================================================ Bug 3：41F 右上角牢墙（真实操作，不用传送 / 不改 visited）
// 第二轮：正常模式（非试玩）——新游戏，属性 / 钥匙调高后从 40F 上楼到 41F
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(1000);
await G(() => { __game.flags.ambush3 = true; for (let f = 1; f <= 41; f++) __game.visited.add(f); Object.assign(__game.hero.keys, { yellow: 15, blue: 8, red: 5 }); __game.changeFloor(41, 'fromBelow'); });
await wait(400);
await setHero({ hp: 50000, atk: 3000, def: 3000 });
let s = await st();
ok(!s.flags.testMode, '正常模式（非试玩）');
ok(s.f === 41 && !(await G(() => __game.visited.has(42))), `41F 起点 (${s.pos.x},${s.pos.y})，尚未到过 42F`);
// 先走到 (8,1)：开 (8,3) 黄门、打 (8,4) 巫师（点击寻路）
for (const [x, y] of [[6, 5], [8, 4], [8, 3], [8, 1]]) { await click(x, y); await walkDone(); }
s = await st();
ok(s.pos.x === 8 && s.pos.y === 1, `点击寻路到达 (8,1) → (${s.pos.x},${s.pos.y})`);
await click(9, 1); await walkDone();
ok((await cell(9, 1)).terrain === 'sealedWall' && (await logs()).some((t) => t.includes('巫师似乎在守护')), '未击败左上巫师：点击牢墙 → 撞墙并提示');
// 击败左上角高级巫师
for (const [x, y] of [[4, 5], [2, 4], [2, 3], [1, 1]]) { await click(x, y); await walkDone(); }
ok((await st()).flags.wiz41 === 1 && !(await cell(1, 1)).monster, '点击寻路击败左上高级巫师 (1,1)');
await click(9, 1); await walkDone();
ok((await cell(9, 1)).terrain === 'sealedWall' && (await logs()).some((t) => t.includes('42 层')), '未到过 42F：点击牢墙 → 提示先去 42 层');
// 走楼梯上 42F 再下来
for (const [x, y] of [[5, 6], [5, 7], [5, 8], [5, 10]]) { await click(x, y); await walkDone(); }
await wait(1200); await settle();
ok((await st()).f === 42, `走楼梯到达 42F`);
for (let i = 0; i < 8 && (await st()).f === 42; i++) { const d = await G(() => { const fl = __game.floors[42]; for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) if (fl[y][x].terrain === 'stairsDown') return { x, y }; return null; }); await click(d.x, d.y); await walkDone(); await wait(1200); await settle(); }
ok((await st()).f === 41, '走楼梯回到 41F');
await click(9, 1); await walkDone();
ok((await cell(9, 1)).monster === 'redWizard', '回到 41F 点击牢墙 → 自动走到 (8,1) 撞墙 → 隐藏高级巫师现身');
await click(9, 1); await walkDone();
ok((await cell(5, 4)).item === 'downFly', '击败隐藏巫师 → 降临之翼出现');
// 第二轮 Bug 5：原版 MT41 击败隐藏巫师后 openDoor (5,7)/(7,7)（本作 (4,6)/(6,6)）——中央墙打开，去上楼梯的路畅通
ok((await cell(4, 6)).terrain === 'floor' && (await cell(6, 6)).terrain === 'floor', `中央墙 (4,6)/(6,6) 打开 → ${(await cell(4, 6)).terrain} / ${(await cell(6, 6)).terrain}`);
await shot('fix-41f-after-hidden-wall');
// 原版路线：中央两扇蓝门换成墙后，打 (7,6) 的初级巫师进入刚打开的 (6,6)，再开 (5,6)(5,7)(5,8) 三扇黄门到上楼梯 (5,10)
for (const [x, y] of [[7, 6], [6, 6], [5, 6], [5, 7], [5, 8], [5, 9]]) { await click(x, y); await walkDone(); }
s = await st();
ok(s.pos.x === 5 && s.pos.y === 9 && (await cell(6, 6)).terrain === 'floor', `击败隐藏巫师后：经 (6,6) 与三扇黄门走到上楼梯前 (5,9) → (${s.pos.x},${s.pos.y})`);
await shot('fix-41f-route-open');
await click(5, 10); await walkDone(); await wait(1200); await settle();
ok((await st()).f === 42, `点击上楼梯：正常模式走到 42F → ${(await st()).f}F`);

// ================================================================ Bug 1：29F 小偷挖暗道（23F 隐形墙没撞完也能打通，同 h5 默认「额外功能」）
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
await G(() => { __game.flags.ambush3 = true; Object.assign(__game.hero, { hp: 3000, atk: 100, def: 100 }); for (let f = 1; f <= 29; f++) __game.visited.add(f); });
const maze = await G(() => __game.floors[23].flat().filter((c) => c.terrain === 'mazeWall').length);
await tp(29, 4, 1); await wait(400);
ok((await cell(5, 2)).terrain !== 'floor', `29F 小偷下方 (5,2) 仍是墙；23F 还有 ${maze} 块隐形墙没撞出`);
await key('ArrowRight');
const said = await advance(60);
await settle();
ok(said.seen.some((t) => t.includes('开玩笑')) && said.seen.some((t) => t.includes('刚完成暗道')), `小偷对话：玩笑 + 完成暗道（${said.seen.length} 句）`);
const c52 = await cell(5, 2);
ok(c52.terrain === 'floor' && !c52.door && !(await cell(5, 1)).npc, '暗道打通：(5,2) 可通行，小偷离开');
ok((await cell(9, 10, 2)).npc === 'thief', '2F (9,10) 出现小偷');
await key('ArrowRight'); await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown');
await shot('fix-29f-thief-dig');
ok((await st()).pos.y >= 3, `能沿暗道往下走 → (${(await st()).pos.x},${(await st()).pos.y})`);
// 2F 小偷：去 35F 魔龙前打开暗道
await tp(2, 9, 9); await wait(300);
await key('ArrowDown'); await advance(30); await settle();
ok((await st()).flags.thief2b === true && (await cell(3, 8, 35)).terrain === 'floor', '2F 小偷对话 → 35F (3,8) 暗道打开');

// ================================================================ 第二轮 2：自动设置精简（三个开关），自动清怪不再「留怪等金币」
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
const toggle = (k, v) => G((k, v) => { const i = document.querySelector(`[data-toggle="${k}"]`); i.checked = v; i.dispatchEvent(new Event('change')); }, k, v);
await key('KeyO'); await wait(300);
const au = await G(() => {
  const ts = [...document.querySelectorAll('[data-toggle]')].filter((i) => i.dataset.toggle.startsWith('auto'));
  return { keys: ts.map((i) => i.dataset.toggle), checked: ts.map((i) => i.checked), labels: ts.map((i) => i.parentElement.textContent.trim()), text: ts[0]?.closest('.settings-group, fieldset, div')?.textContent ?? '' };
});
ok(au.keys.join(',') === 'autoClear,autoPickup,autoPotions,autoHidden', `自动开关：${au.keys.join(' / ')}`);
ok(au.labels.join('|') === '自动清怪|自动拾取|含血瓶|自动开暗墙', `开关文字：${au.labels.join(' / ')}`);
ok(au.checked.every((c) => !c), '默认全部关闭');
ok(!(await G(() => !!document.querySelector('[data-toggle="autoWaitCoin"]'))) && !(await G(() => document.getElementById('overlay').textContent.includes('幸运金币'))), '没有「留怪等幸运金币」开关与长说明');
await G(() => document.querySelector('[data-toggle="autoClear"]').scrollIntoView({ block: 'center' }));
await shot('fix-auto-settings-simple');
await toggle('autoClear', true);
await key('Escape'); await wait(300);
// 布置：在本层找一只初始地图上的普通怪物（非剧情怪），勇士站在它旁边，向反方向走一步后应自动清掉
// （第三轮起：剧情生成 / 摆放的怪物都算剧情怪，所以这里用楼层原有的怪物）
async function arena(f, flags = {}) {
  const r = await G((f, flags) => {
    Object.assign(__game.flags, { ambush3: true }, flags);
    Object.assign(__game.hero, { hp: 999999, atk: 99999, def: 99999 });
    __game.changeFloor(f, { x: 5, y: 5 });
    const fl = __game.floors[f];
    const n = fl.length;
    const inb = (x, y) => x >= 0 && y >= 0 && x < n && y < n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!fl[y][x].monster || __storyMonster({ x, y }, f)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const hx = x + dx, hy = y + dy, wx = x + 2 * dx, wy = y + 2 * dy;
        if (!inb(wx, wy)) continue;
        for (const [cx, cy] of [[hx, hy], [wx, wy]]) Object.assign(fl[cy][cx], { terrain: 'floor', door: undefined, item: undefined, npc: undefined, monster: undefined });
        __game.pos = { x: hx, y: hy };
        __game.touchMap();
        const k = (d) => (d > 0 ? 'Right' : 'Left');
        return { m: [x, y], away: dx ? 'Arrow' + k(dx) : dy > 0 ? 'ArrowDown' : 'ArrowUp', back: dx ? 'Arrow' + k(-dx) : dy > 0 ? 'ArrowUp' : 'ArrowDown' };
      }
    }
    return null;
  }, f, flags);
  if (!r) return false;
  await wait(300);
  await key(r.away); await wait(400);
  return !(await cell(r.m[0], r.m[1])).monster;
}
ok(await arena(5), '第一区 5F：走一步后自动击败 0 伤害的绿史莱姆');
ok(await arena(12), '第二区 12F（没有幸运金币）：同样自动清怪');
ok(await arena(37), '第四区 37F：自动清怪（第三区 21–30F 没有非剧情的普通怪）');
ok(await arena(33, { trap33: true, trap33Open: true }), '第四区 33F（机关触发之后）：自动清怪');
ok(!(await logs()).some((t) => t.includes('等拿到幸运金币')), '不再出现「留怪等金币」提示');
// 自动开暗墙：35F 小偷挖开 (3,8) 之后，走一步 → 一次打开本层所有可直接到达的暗墙
await key('KeyO'); await wait(300); await toggle('autoClear', false); await toggle('autoHidden', true); await key('Escape'); await wait(300);
await G(() => { __game.flags.thief2b = true; __game.changeFloor(35, { x: 5, y: 8 }); __game.floors[35][8][3].terrain = 'floor'; __game.touchMap(); });
await wait(300);
const hid35 = () => G(() => __game.floors[35].flat().filter((c) => c.terrain === 'hiddenWall').length);
const h35a = await hid35();
await key('ArrowLeft'); await wait(600); await settle();
const h35b = await hid35();
ok(h35a >= 20 && h35b === 0, `35F：小偷的暗道 ${h35a} 块暗墙，走一步后全部打开（剩 ${h35b}）`);
ok((await logs()).some((t) => String(t).includes('自动打开暗墙')), '消息记录：自动打开暗墙');
await shot('fix-35f-auto-hidden-all');
await key('KeyZ'); await wait(300);
ok((await hid35()) === h35a, `一次回退：整批暗墙恢复（${await hid35()}）`);
await key('KeyO'); await wait(300); await toggle('autoHidden', false); await key('Escape'); await wait(300);

// ================================================================ 建议 1：楼传——点击中间预览传送；选当前楼层 = 回到本层下楼梯旁（第二轮反馈）
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
await G(() => { __game.flags.ambush3 = true; for (let f = 1; f <= 6; f++) __game.visited.add(f); });
await G(() => __game.changeFloor(5, 'fromAbove')); await wait(400);
const home5 = await G(() => __game.flyHomeSpot());
const below5 = await G(() => __values?.FLOORS?.[5]?.arriveFromBelow ?? null);
let p0 = (await st()).pos;
ok((p0.x !== home5.x || p0.y !== home5.y) && (!below5 || (below5.x === home5.x && below5.y === home5.y)), `5F 上楼梯旁 (${p0.x},${p0.y})，本层落点 = 下楼梯旁 (${home5.x},${home5.y})`);
await key('KeyG'); await wait(300);
const btnTxt = () => G(() => document.querySelector('#overlay .modal-actions .ui-btn.primary')?.textContent);
ok((await btnTxt()) === '回到本层下楼梯旁', `选中当前楼层：按钮「${await btnTxt()}」`);
await shot('fix-fly-ui-current-floor');
await key('Enter'); await wait(900); await settle();
s = await st();
ok(s.f === 5 && s.pos.x === home5.x && s.pos.y === home5.y, `传送到本层下楼梯旁 → ${s.f}F (${s.pos.x},${s.pos.y})`);
const near = await G(() => { const fl = __game.floors[5]; const p = __game.pos; return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => fl[p.y + dy]?.[p.x + dx]?.terrain === 'stairsDown'); });
ok(near, '落点紧挨下楼梯');
// 已在下楼梯旁：当前楼层不可传送；点预览无效
await key('KeyG'); await wait(300);
ok((await btnTxt()) === '当前楼层' && (await G(() => document.querySelector('#overlay .modal-actions .ui-btn.primary').disabled)), '已在下楼梯旁：「当前楼层」按钮禁用');
const clickPic = async () => { const r = await G(() => { const b = document.querySelector('.fly-pic:not(.leaving)').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await page.mouse.click(r.x, r.y); await wait(900); await settle(); };
await clickPic();
ok((await st()).f === 5 && (await G(() => __modal.isOpen)), '点击当前楼层预览（已在楼梯旁）：不传送，传送器保持打开');
await key('ArrowDown'); await key('ArrowDown'); await wait(300);
await shot('fix-fly-ui-tap-preview');
await clickPic();
s = await st();
ok(s.f === 3 && !(await G(() => __modal.isOpen)), `点击中间的 3F 预览 → 传送到 ${s.f}F (${s.pos.x},${s.pos.y})`);
// 飞往更低层落在其上楼梯旁 → 再点当前楼层预览：到 3F 下楼梯旁
await key('KeyG'); await wait(300); await clickPic();
s = await st(); const home3 = await G(() => __game.flyHomeSpot());
ok(s.f === 3 && s.pos.x === home3.x && s.pos.y === home3.y, `点击当前楼层预览 → 本层下楼梯旁 (${s.pos.x},${s.pos.y})`);

// ================================================================ 建议 2：商店 / 祭坛连续购买不重新弹出
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
await G(() => { __game.flags.ambush3 = true; Object.assign(__game.hero, { hp: 400, atk: 10, def: 10, gold: 300 }); __game.visited.add(4); });
await tp(4, 5, 1); await wait(400);
await key('ArrowUp'); await choices();
const btns = () => G(() => [...document.querySelectorAll('#dialog .dlg-choices button')].map((b) => b.textContent));
ok((await btns()).length === 4, `4F 祭坛：${(await btns()).join(' / ')}`);
const clickChoice = async (i) => { await G((i) => document.querySelectorAll('#dialog .dlg-choices button')[i].click(), i); await wait(120); };
await G(() => { window.__btn0 = document.querySelector('#dialog .dlg-choices button'); return true; });
await clickChoice(2); await clickChoice(2);
let h4 = await G(() => ({ def: __game.hero.def, gold: __game.hero.gold, t: __game.flags.altarTimes, open: __dialog.isOpen, same: window.__btn0 === document.querySelector('#dialog .dlg-choices button'), fb: document.querySelector('#dialog .dlg-feedback')?.textContent, text: __dialog.full }));
ok(h4.open && h4.same && h4.def === 18 && h4.gold === 300 - 20 - 40 && h4.t === 2, `连点两次「防御+4」：对话框不关闭、按钮不重建 → 防 ${h4.def} 金 ${h4.gold}`);
const prim = () => G(() => [...document.querySelectorAll('#dialog .dlg-choices button')].map((b) => b.classList.contains('primary') ? 1 : 0).join(''));
ok((await prim()) === '0010', `高亮跟随按下的按钮：「防御」高亮（${await prim()}）`);
await shot('fix-altar-highlight-def');
ok(/防御 \+4/.test(h4.fb ?? '') && h4.text.includes('80'), `轻量反馈「${h4.fb}」，价格刷新为 80：${h4.text}`);
await shot('fix-shop-feedback');
await G(() => { __game.hero.gold = 50; });
await clickChoice(2);
h4 = await G(() => ({ def: __game.hero.def, gold: __game.hero.gold, open: __dialog.isOpen, fail: document.querySelectorAll('#dialog .buy-fail').length, fb: document.querySelector('#dialog .dlg-feedback')?.textContent }));
ok(h4.open && h4.fail === 1 && h4.def === 18 && /不足/.test(h4.fb ?? ''), `金币不足：按钮抖动 + 「${h4.fb}」，对话框仍开着`);
// 键盘：回车连买（焦点停在刚才的按钮上）
await G(() => { __game.hero.gold = 1000; });
await key('Enter'); await key('Enter');
h4 = await G(() => ({ def: __game.hero.def, t: __game.flags.altarTimes }));
ok(h4.def === 26 && h4.t === 4, `回车连按两次：焦点留在「防御」→ 防 ${h4.def}，已供奉 ${h4.t} 次`);
await G(() => document.querySelectorAll('#dialog .dlg-choices button')[1].focus()); await wait(100);
ok((await prim()) === '0100', `键盘焦点移到「攻击」：高亮随之移动（${await prim()}）`);
await key('Enter');
ok((await G(() => __game.hero.atk)) === 12 && (await prim()) === '0100', `回车购买「攻击」：攻 ${await G(() => __game.hero.atk)}，高亮仍在「攻击」`);
await clickChoice(3); await wait(200);
ok(!(await G(() => __dialog.isOpen)) && !(await G(() => __director.busy)), '「离开」关闭商店');

// ================================================================ 第二轮 4：瞬移（对称飞）两段式——第一次预览落点（绿 / 红），第二次才飞；其他输入取消
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
await G(() => { __game.flags.ambush3 = true; __game.hero.bag.centerFly = 3; __game.changeFloor(39, { x: 0, y: 0 }); });
await wait(300);
// 找一个「对称位置是空地」的格子和一个「对称位置被阻挡」的格子
const spots = await G(() => {
  const fl = __game.floors[39]; const n = fl.length; let green = null, red = null;
  const empty = (c) => c && (c.terrain === 'floor') && !c.door && !c.item && !c.monster && !c.npc;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!empty(fl[y][x]) || (x === n - 1 - x && y === n - 1 - y)) continue;
    const m = fl[n - 1 - y][n - 1 - x];
    if (!green && empty(m)) green = { x, y };
    if (!red && !empty(m)) red = { x, y, what: m.monster ?? m.item ?? m.door ?? m.terrain };
  }
  return { green, red };
});
const prev = () => G(() => __renderer.centerPreview && { ...__renderer.centerPreview });
await at(spots.green.x, spots.green.y); await wait(200);
await key('Digit3'); await wait(300);
let pv = await prev();
s = await st();
ok(pv && pv.ok === true && pv.x === 10 - spots.green.x && pv.y === 10 - spots.green.y && !(await G(() => __modal.isOpen)) && s.pos.x === spots.green.x && s.hero.bag.centerFly === 3, `第一次按 3：不弹确认框，落点 (${pv?.x},${pv?.y}) 绿色预览，未消耗`);
await shot('fix-centerfly-preview-green');
await key('Digit3'); await wait(400); await settle();
s = await st();
ok(s.pos.x === 10 - spots.green.x && s.pos.y === 10 - spots.green.y && s.hero.bag.centerFly === 2 && !(await prev()), `第二次按 3：瞬移到 (${s.pos.x},${s.pos.y})，剩 ${s.hero.bag.centerFly} 次`);
// 取消：预览后按其他键
await at(spots.green.x, spots.green.y); await wait(200);
await key('Digit3'); await wait(200);
ok(!!(await prev()), '再次预览');
await key('Escape'); await wait(300);
s = await st();
ok(!(await prev()) && s.pos.x === spots.green.x && s.hero.bag.centerFly === 2, 'Esc（任何其他输入）取消预览，不瞬移、不消耗');
await key('Digit3'); await wait(200);
await page.mouse.click(30, 30); await wait(300);
ok(!(await prev()) && (await st()).hero.bag.centerFly === 2, '预览中点击别处：同样取消');
// 红色：对称位置被阻挡
await at(spots.red.x, spots.red.y); await wait(200);
await key('Digit3'); await wait(300);
pv = await prev();
ok(pv && pv.ok === false && pv.x === 10 - spots.red.x, `对称位置是 ${spots.red.what}：红色预览 (${pv?.x},${pv?.y})`);
await shot('fix-centerfly-preview-red');
await key('Digit3'); await wait(300);
s = await st();
ok(s.pos.x === spots.red.x && s.pos.y === spots.red.y && s.hero.bag.centerFly === 2 && !(await prev()), '红色时再按 3：不能瞬移，提示且不消耗');

// ================================================================ 建议 4：开局选项（36F 暗道 / 48F 隐藏白衣武士）
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await wait(800);
const modalBtn = (label) => G((label) => { const b = [...document.querySelectorAll('#overlay .modal-actions button')].find((x) => x.textContent.includes(label)); b?.click(); return !!b; }, label);
ok(await modalBtn('开始冒险'), '开始画面：点击「开始冒险」');
await wait(300);
ok(await G(() => !!document.querySelector('[data-variant="secret36"]') && !!document.querySelector('[data-variant="hidden48"]')), '弹出开局选项：36 层暗道 / 48 层隐藏白衣武士');
ok(await G(() => document.querySelector('.variant-box').textContent.includes('略微降低难度')), '标注「开启后可略微降低难度」');
await G(() => document.querySelectorAll('.variant-box input').forEach((i) => (i.checked = true)));
await shot('fix-start-options');
await modalBtn('开始冒险'); await wait(1200); await settle();
s = await st();
ok(s.flags.variant36 === true && s.flags.variant48 === true && s.f === 1, `两项开启：flags 已写入（${s.f}F）`);
ok(await G(() => [1, 2, 3, 7, 8, 9].every((x) => __game.floors[36][3][x].terrain === 'hiddenWall' && __game.floors[36][7][x].terrain === 'hiddenWall') && [1, 2, 8, 9].every((y) => __game.floors[36][y][3].terrain === 'hiddenWall' && __game.floors[36][y][7].terrain === 'hiddenWall')), '36F 四块角落墙体中各有一条 L 形暗道（暗墙，原版 TSW 1.2 位置）');
ok((await cell(0, 0, 48)).terrain === 'airwall' && !(await cell(0, 0, 48)).monster, '48F 左上角 (0,0) 白衣武士隐形');
// 存读档后保留
await G(() => __game.deserialize(JSON.parse(JSON.stringify(__game.serialize()))));
ok(await G(() => __game.flags.variant36 === true && __game.floors[36][3][9].terrain === 'hiddenWall'), '存读档后选项与地图保留');
// 36F（原版 TSW 1.2 数据）：右上 L 形暗道 (9,3)(8,3)(7,3)(7,2)(7,1)，每格各自撞开
await setHero({ hp: 50000, atk: 3000, def: 3000 }); await G(() => { __game.flags.ambush3 = true; });
ok(await G(() => [[1,3],[2,3],[3,3],[3,2],[3,1],[9,3],[8,3],[7,3],[7,2],[7,1],[1,7],[2,7],[3,7],[3,8],[3,9],[9,7],[8,7],[7,7],[7,8],[7,9]].every(([x, y]) => __game.floors[36][y][x].terrain === 'hiddenWall')), '36F 四条暗道共 20 格暗墙（与原版 tile 9 位置一致）');
await tp(36, 10, 3); await wait(300);
await key('ArrowLeft'); await settle();
ok(await G(() => __game.floors[36][3][9].terrain === 'floor' && __game.floors[36][3][8].terrain === 'hiddenWall'), '36F 撞开 (9,3)：只开这一格（原版每格单独撞开）');
for (const d of ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp']) { await key(d); await settle(); }
s = await st();
ok(s.pos.x === 7 && s.pos.y === 0, `沿右上暗道从右侧走廊走到上方一行 (7,0) → (${s.pos.x},${s.pos.y})`);
await tp(36, 10, 7); await wait(300);
for (const d of ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft']) { await key(d); await settle(); }
for (const d of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown']) { await key(d); await settle(); }
s = await st();
ok(s.pos.x === 7 && s.pos.y === 9, `右下暗道：(10,7) → (7,9)（下一步即下方一行 (7,10)，绕开 (8,10) 双手剑士） → (${s.pos.x},${s.pos.y})`);
await tp(36, 9, 3); await wait(500);
await shot('fix-36f-secret-passage');
// 老人提示变为「4条密道」
await tp(36, 1, 0); await wait(300); await key('ArrowLeft');
const t36 = await dlgText(); await advance(); await settle();
ok(t36.includes('4条密道'), `36F 老人：${t36}`);
// 48F（原版 TSW 1.2：左上角 (0,0) 是 SpecialRoad）：从 (0,1) 向上撞 → 白衣武士现身 → 击败 → 圣剑房门打开
await tp(48, 0, 1); await wait(300);
ok((await cell(7, 7)).door === 'special', '48F 圣剑房机关门 (7,7) 关闭');
await key('ArrowUp'); await settle();
ok((await cell(0, 0)).monster === 'whiteKing', '撞向左上角 (0,0) → 隐藏的白衣武士（魔法警卫）现身');
await shot('fix-48f-hidden-guard');
await key('ArrowUp'); await settle();
ok(!(await cell(0, 0)).monster && !(await cell(7, 7)).door, '击败白衣武士 → 圣剑房间的门打开');
// 经典版：都不开启
await key('KeyR'); await wait(300); await modalBtn('重新开始'); await wait(300);
await modalBtn('经典版'); await wait(1200); await settle();
ok(await G(() => !__game.flags.variant36 && __game.floors[36][3][9].terrain === 'wall' && __game.floors[48][0][0].terrain === 'floor'), '重新开始选「经典版」：36F / 48F 与 h5 51 号塔一致');

console.log(errs.length ? errs : "no page errors"); await browser.close(); console.log(fails ? `❌ ${fails} failed` : "ALL PASS"); process.exit(fails ? 1 : 0);
