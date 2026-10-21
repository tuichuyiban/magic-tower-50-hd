// 第二区（11F–20F）+ 试玩模式的无头端到端测试
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

// ================================================================ 开始画面：试玩模式入口
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await wait(800);
const startBtns = await G(() => [...document.querySelectorAll('#overlay:not(.hidden) .modal-actions button, #overlay:not(.hidden) button')].map((b) => b.textContent));
ok(startBtns.some((t) => t.includes('试玩模式')), `开始画面提供「试玩模式」：${startBtns.join(' / ')}`);
await shot('20-start-screen-test-mode');
await G(() => [...document.querySelectorAll('#overlay button')].find((b) => b.textContent.includes('试玩模式')).click());
await wait(500);
// 试玩模式先选择起点区域（11F / 21F / 31F / 41F）
await G(() => [...document.querySelectorAll('#overlay button')].find((b) => b.textContent.includes('11F 起')).click());
await wait(300); await G(() => [...document.querySelectorAll('#overlay button')].find((b) => b.textContent.includes('经典版'))?.click()); // 开局选项：经典版
await wait(1000);
let s = await st();
ok(s.f === 11 && s.flags.testMode === true, `点击试玩模式 → ${s.f}F，testMode=${s.flags.testMode}`);

// ================================================================ ?test：试玩模式属性
await page.goto('http://localhost:4173/?test', { waitUntil: 'networkidle0' });
await wait(1000);
s = await st();
const visited = await G(() => [...__game.visited].sort((a, b) => a - b));
ok(s.f === 11 && s.pos.x === 5 && s.pos.y === 9, `?test 直接从 11F 开始（${JSON.stringify(s.pos)}）`);
ok(s.hero.hp === 10000 && s.hero.atk === 129 && s.hero.def === 136, `试玩属性 生命 ${s.hero.hp} 攻击 ${s.hero.atk} 防御 ${s.hero.def}（第一区路线终局 29/36 + 100）`);
ok(s.hero.keys.yellow === 20 && s.hero.keys.blue === 10 && s.hero.keys.red === 5 && s.hero.gold === 5000, `钥匙 ${JSON.stringify(s.hero.keys)} 金币 ${s.hero.gold}`);
ok(s.hero.tools.fly && s.hero.tools.book && !s.hero.tools.cross, '附送魔杖与怪物手册（其他道具正常获得）');
ok(JSON.stringify(visited) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), `1F–11F 已标记到达（可飞行）：${visited.join(',')}`);
await shot('21-test-mode-11f');
// 存档分开保存
await G(() => __game.changeFloor(11, { x: 9, y: 10 }));
await wait(100);
await key('ArrowRight'); await wait(900); // 上楼 → 12F（自动存档）
const keys = await G(() => Object.keys(localStorage).filter((k) => !k.includes('setting:')));
ok(keys.includes('mota-hd-zone1:test:auto') && !keys.includes('mota-hd-zone1:auto'), `试玩模式自动存档单独保存：${keys.join(', ')}`);
// 飞行到第一区
await G(() => __game.changeFloor(12, __game.floor.arriveFromBelow));
await key('KeyG'); await wait(400);
ok(await G(() => !!document.querySelector('#overlay:not(.hidden) .flyer')), '试玩模式：楼梯旁按 G 打开楼层传送器');
await key('Escape');
await G(() => __director.fly(3)); await wait(900);
ok((await st()).f === 3 && (await st()).hero.atk === 129, '飞到 3F：不会触发魔王伏击（序章视为已完成）');

// ================================================================ 楼梯换层 11F → 20F（上楼）与 20F → 11F（下楼）
const stairsOf = (f, t) => G((f, t) => { const g = __game.floors[f]; for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (g[y][x].terrain === t) return { x, y }; return null; }, f, t);
const neighborFloor = (f, p) => G((f, p) => {
  for (const [dx, dy, k] of [[0, 1, 'ArrowUp'], [0, -1, 'ArrowDown'], [1, 0, 'ArrowLeft'], [-1, 0, 'ArrowRight']]) {
    const c = __game.cell({ x: p.x + dx, y: p.y + dy }, f);
    if (c && c.terrain === 'floor') return { x: p.x + dx, y: p.y + dy, k };
  }
  return null;
}, f, p);
let upOk = 0;
for (let f = 11; f <= 19; f++) {
  const sp = await stairsOf(f, 'stairsUp');
  const n = await neighborFloor(f, sp);
  await G((f, n) => { __game.setCell({ x: n.x, y: n.y }, { monster: undefined, item: undefined, door: undefined }, f); __game.changeFloor(f, { x: n.x, y: n.y }); }, f, n);
  await key(n.k); await wait(800);
  const t = await st();
  if (t.f === f + 1) upOk++;
  else console.log('   上楼失败', f, JSON.stringify(t.pos));
}
ok(upOk === 9, `11F → 20F 逐层上楼：${upOk}/9`);
let downOk = 0;
for (let f = 20; f >= 12; f--) {
  const sp = await stairsOf(f, 'stairsDown');
  const n = await neighborFloor(f, sp);
  await G((f, n) => { __game.setCell({ x: n.x, y: n.y }, { monster: undefined, item: undefined, door: undefined }, f); __game.changeFloor(f, { x: n.x, y: n.y }); }, f, n);
  await key(n.k); await wait(800);
  const t = await st();
  if (t.f === f - 1) downOk++;
  else console.log('   下楼失败', f, JSON.stringify(t.pos));
}
ok(downOk === 9, `20F → 11F 逐层下楼：${downOk}/9`);

// ================================================================ 正常模式（从 11F 开始的真实数值检查）
await page.goto('http://localhost:4173/?test', { waitUntil: 'networkidle0' });
await wait(900);
// 11F：两只高级法师 → 机关门 (1,3)
await tp(11, 1, 4);
await key('ArrowLeft'); await key('ArrowRight'); await key('ArrowRight'); await settle();
ok(!(await cell(1, 3)).door, '11F：击败两只高级法师后机关门 (1,3) 打开');
// 银盾
const def0 = (await st()).hero.def;
await tp(11, 1, 2); await key('ArrowUp'); await settle();
s = await st();
ok(s.hero.def === def0 + 20 && s.hero.shield === '银盾', `11F 银盾：防御 ${def0} → ${s.hero.def}`);
await shot('22-floor11-silver-shield');

// 12F：红钥匙商人 800、暗墙特殊商人 1000、祭坛倍率 2
await tp(12, 0, 1);
await G(() => __game.setCell({ x: 0, y: 1 }, { terrain: 'floor' }));
s = await st();
await key('ArrowUp'); await pick(0); await settle();
let s2 = await st();
ok(s2.hero.gold === s.hero.gold - 800 && s2.hero.keys.red === s.hero.keys.red + 1, `12F 商人：800 金币买红钥匙（金币 ${s.hero.gold} → ${s2.hero.gold}）`);
await key('ArrowUp'); let r = await advance();
ok(r.seen.some((t) => t.includes('5,9,14,16,18')), `买过之后的情报：${r.seen[0]}`);
ok(!(await cell(0, 0)).npc, '说完后商人消失');
await tp(12, 10, 1);
await G(() => __game.setCell({ x: 10, y: 1 }, { terrain: 'floor' }));
ok((await cell(10, 0)).terrain === 'hiddenWall2', '12F (10,0) 是带机关的暗墙（fakeWall2）');
await key('ArrowUp'); await settle();
ok((await cell(10, 0)).npc === 'specialTrader', '撞开暗墙 → 出现特殊商人');
s = await st();
await key('ArrowUp'); await pick(0);
await choices();
const txt12 = await dlgText();
await pick(0); await pick(1); await settle();
s2 = await st();
ok(s2.hero.keys.yellow === s.hero.keys.yellow + 2 && s2.hero.gold === s.hero.gold - 2000, `特殊商人「${txt12.slice(0, 22)}…」：买 2 把黄钥匙，金币 ${s.hero.gold} → ${s2.hero.gold}`);
await shot('23-floor12-special-trader');
await tp(12, 5, 9);
s = await st();
await key('ArrowUp'); await choices();
const altarText = await dlgText();
await pick(1); await pick(3); await settle();
s2 = await st();
ok(s2.hero.atk === s.hero.atk + 4 && altarText.includes('20金币'), `12F 祭坛（倍率 2）：攻击 +4（${altarText.slice(0, 26)}…）`);

// 13F 岩浆：不可通行
await G(() => __game.setCell({ x: 5, y: 9 }, { door: undefined }, 13));
await tp(13, 5, 9);
await key('ArrowUp');
ok((await st()).pos.y === 9 && (await cell(5, 8)).terrain === 'lava', '13F：岩浆不可通行');
ok((await cell(5, 4, 13)).item === 'holySword', '13F 神圣剑被岩浆包围（第二区无法取得）');

// 14F 隐藏红钥匙：(0,0)(2,0)(1,1) 三只兽人武士
await tp(14, 1, 0);
await key('ArrowLeft'); await key('ArrowRight'); await key('ArrowDown'); await settle();
ok((await cell(0, 2)).item === 'redKey' && (await cell(0, 2)).terrain === 'floor', '14F：消灭三只兽人武士后牢墙打开，出现隐藏的红钥匙 (0,2)');
await shot('24-floor14-hidden-red-key');

// 15F 小偷 + 大乌贼 + 镐
await tp(15, 9, 0);
await key('ArrowLeft'); r = await advance(); await settle();
ok(r.seen.some((t) => t.includes('大章鱼')) && (await cell(7, 0)).terrain === 'floor' && !(await cell(8, 0)).npc, `15F 小偷：${(r.seen[0] ?? '').slice(0, 30)}… → 打开暗道后离开`);
await tp(15, 5, 6);
await shot('25-floor15-octopus');
s = await st();
await key('ArrowUp'); await settle();
s2 = await st();
ok(!(await cell(5, 5)).monster && (await cell(4, 3)).terrain === 'floor' && !(await cell(5, 2)).door, `击败大乌贼（-${s.hero.hp - s2.hero.hp}）：空气墙移除、机关门 (5,2) 打开`);
await key('ArrowUp'); await key('ArrowUp'); await settle();
ok((await G(() => __game.hero.bag.pickaxe)) === 1, '拾取大乌贼身下的「镐」');
ok(await G(() => __inventory.owned().some((x) => x.item.id === 'pickaxe')), '「镐」出现在背包');
// 使用镐（快捷键 1）
await tp(15, 2, 7);
const NB = [[1, 7], [3, 7], [2, 6], [2, 8]];
const before = await G((NB) => NB.map(([x, y]) => __game.cell({ x, y }).terrain), NB);
// 使用确认框：快捷键 1 → 弹出「是否使用「镐」？」，Esc 取消不产生任何效果
await key('Digit1'); await wait(250);
const cf = await G(() => ({ open: !!document.querySelector('#overlay:not(.hidden) .use-confirm'), text: document.querySelector('#overlay .modal-body')?.innerText ?? '', btns: [...document.querySelectorAll('#overlay .modal-actions button')].map((b) => b.textContent) }));
ok(cf.open && cf.text.includes('是否使用「镐」？') && cf.text.includes('破坏周围') && cf.btns.join('/') === '取消/使用', `确认框：${cf.text.replace(/\n/g, ' ').slice(0, 40)} [${cf.btns.join('/')}]`);
await shot('30-use-confirm-pickaxe');
await key('Escape'); await wait(200);
const mid = await G((NB) => NB.map(([x, y]) => __game.cell({ x, y }).terrain), NB);
ok(!(await G(() => __modal.isOpen)) && JSON.stringify(mid) === JSON.stringify(before) && (await G(() => __game.hero.bag.pickaxe)) === 1, 'Esc 取消：墙未被破坏，镐未消耗');
await key('Digit1'); await wait(250);
await G(() => [...document.querySelectorAll('#overlay .modal-actions button')].find((b) => b.textContent === '取消').click()); await wait(200);
ok((await G(() => __game.hero.bag.pickaxe)) === 1, '点「取消」：镐未消耗');
await key('Digit1'); await wait(250);
await key('Enter'); await wait(300);
const after = await G((NB) => NB.map(([x, y]) => __game.cell({ x, y }).terrain), NB);
ok(before.filter((t) => t === 'wall').length > 0 && after.every((t) => t !== 'wall') && (await G(() => __game.hero.bag.pickaxe)) === 0, `快捷键 1 + Enter 确认使用镐：${before.join('/')} → ${after.join('/')}，镐已消耗`);
await key('KeyZ'); await wait(300);
ok((await G(() => __game.hero.bag.pickaxe)) === 1 && JSON.stringify(await G((NB) => NB.map(([x, y]) => __game.cell({ x, y }).terrain), NB)) === JSON.stringify(before), '回退（Z）：墙与镐都恢复');
await key('Digit1'); await wait(250); await key('Space'); await wait(300);
ok((await G(() => __game.hero.bag.pickaxe)) === 0, '空格确认同样生效');
await shot('26-pickaxe-used');
await G(() => { __game.hero.bag.pickaxe = 1; });
await tp(13, 5, 10);
await key('Digit1'); await wait(200);
ok((await G(() => __game.hero.bag.pickaxe)) === 1 && !(await G(() => __modal.isOpen)), '周围没有可破坏的墙：不弹确认框，直接提示且不消耗（文档化的偏差）');
await G(() => { __game.hero.bag.pickaxe = 0; });
// 15F 蓝钥匙商人
await tp(15, 9, 10);
s = await st();
await key('ArrowRight'); await pick(0); await settle();
s2 = await st();
ok(s2.hero.keys.blue === s.hero.keys.blue + 1 && s2.hero.gold === s.hero.gold - 200, '15F 商人：200 金币买蓝钥匙');
await key('ArrowRight'); r = await advance();
ok(r.seen.some((t) => t.includes('十字架被藏在高于15楼的墙内')), '15F 商人情报：十字架藏在 15 楼以上的墙内');

// 16F 隐藏老人 → 圣水
await tp(16, 1, 10);
await key('ArrowLeft'); r = await advance();
ok(r.seen.some((t) => t.includes('2把隐藏的红钥匙')), `16F 老人：${(r.seen[0] ?? '').slice(0, 24)}`);
await tp(16, 10, 9);
await G(() => { __game.setCell({ x: 10, y: 9 }, { terrain: 'floor' }); __game.changeFloor(16, { x: 10, y: 9 }); });
await key('ArrowDown'); await settle();
ok((await cell(10, 10)).npc === 'oldman', '16F (10,10) 暗墙后出现老人');
await key('ArrowDown'); await choices();
const potText = await dlgText();
await pick(0); await settle();
ok((await G(() => __game.hero.bag.superPotion)) === 1 && !(await cell(10, 10)).npc, `获得圣水（${potText.slice(0, 20)}…）`);
s = await st();
const heal = Math.round(0.74 * (s.hero.atk + s.hero.def)) * 10;
await G(() => __inventory.use('superPotion')); await wait(250);
const hc = await G(() => document.querySelector('#overlay:not(.hidden) .use-confirm')?.innerText ?? '');
ok(hc.includes('是否使用「圣水」？') && hc.includes(`生命 +${heal}`), `圣水确认框显示当前效果：${hc.replace(/\n/g, ' ').slice(0, 40)}`);
await shot('31-use-confirm-holy-water');
await G(() => [...document.querySelectorAll('#overlay .modal-actions button')].find((b) => b.textContent === '使用').click()); await wait(300);
s2 = await st();
ok(s2.hero.hp === s.hero.hp + heal && (await G(() => __game.hero.bag.superPotion)) === 0, `使用圣水：生命 +${s2.hero.hp - s.hero.hp}（round(0.74×(${s.hero.atk}+${s.hero.def}))×10 = ${heal}）`);
await shot('27-holy-water-used');

// 17F 银剑 + 守卫机关
await tp(17, 1, 4); await key('ArrowLeft'); await key('ArrowRight'); await key('ArrowRight'); await settle();
ok(!(await cell(1, 3)).door, '17F：(0,4)(2,4) 初级卫兵 → 机关门 (1,3) 打开');
const atk0 = (await st()).hero.atk;
await tp(17, 1, 2); await key('ArrowUp'); await settle();
ok((await st()).hero.atk === atk0 + 20 && (await st()).hero.weapon === '银剑', '17F 银剑：攻击 +20');

// 18F 老人
await tp(18, 2, 0); await key('ArrowDown'); r = await advance();
ok(r.seen.some((t) => t.includes('石头人')), `18F 老人：${(r.seen[0] ?? '').slice(0, 26)}`);

// 19F 十字架
await tp(19, 5, 3);
await G(() => __game.setCell({ x: 5, y: 3 }, { terrain: 'floor' }));
await key('ArrowUp'); await settle();
ok((await cell(5, 2)).item === 'cross', '19F 暗墙 (5,2) 后出现十字架');
const dmgNo = await G(() => __game.monsterInfo('zombie').forecast.heroHit);
await key('ArrowUp'); await settle();
const dmgYes = await G(() => __game.monsterInfo('zombie').forecast.heroHit);
ok((await st()).hero.tools.cross && dmgYes === (dmgNo + 5) * 2 - 5, `拾取十字架：对兽人每回合伤害 ${dmgNo} → ${dmgYes}（攻击加倍）`);

// 20F 吸血鬼
await tp(20, 5, 9);
await key('ArrowUp'); await wait(300); // 打开红门
await key('ArrowUp'); await wait(300); // 走进门口 (5,8)
await key('ArrowUp'); await wait(700); // 踏上 (5,7)：触发
await shot('28a-floor20-bats-converge');
for (let i = 0; i < 40 && !(await G(() => __dialog.isOpen)); i++) await wait(100);
await wait(600);
const trackDuring = await G(() => __audio.wanted);
const vText = await G(() => __dialog.isOpen ? __dialog.full : '');
await shot('28-floor20-vampire-appears');
r = await advance();
ok((await cell(5, 5)).monster === 'vampire' && (await cell(5, 8)).door === 'special', `20F：吸血鬼现身（${(vText || r.seen[0] || '').slice(0, 20)}…），退路被机关门封住`);
ok(RING_EMPTY(await G(() => [[4, 4], [5, 4], [6, 4], [4, 5], [6, 5], [4, 6], [5, 6], [6, 6]].map(([x, y]) => __game.cell({ x, y }).monster ?? ''))), '8 只大蝙蝠合体为吸血鬼');
ok(String(trackDuring).includes('tension') || (await G(() => window.__musicTrack?.())) === 'tension', `头目战音乐：${trackDuring}`);
await key('ArrowUp'); await wait(300); await key('ArrowUp'); r = await advance(); await settle();
ok(r.seen.some((t) => t.includes('上帝阿')), `击败吸血鬼：${(r.seen[0] ?? '').slice(0, 24)}…`);
ok((await cell(4, 3)).item === 'yellowKey' && (await cell(3, 4)).item === 'redGem' && (await cell(7, 4)).item === 'blueGem' && (await cell(4, 7)).item === 'bluePotion', '奖励：3 黄钥匙、3 红宝石、3 蓝宝石、3 蓝血瓶');
ok(!(await cell(5, 2)).door && !(await cell(5, 8)).door, '机关门 (5,2)(5,8) 打开');
await shot('29-floor20-boss-cleared');
// 上楼：第三区已开放
await tp(20, 5, 1); await key('ArrowUp'); await wait(900); await settle();
ok((await st()).f === 21, `20F 上楼梯 → ${(await st()).f}F（第三区已开放）`);

// ================================================================ 正常模式保持原样
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
s = await st();
ok(s.f === 1 && s.hero.hp === 1000 && s.hero.atk === 100 && !s.flags.testMode, '正常模式：1F 起步、1000/100/100、无试玩标记');

function RING_EMPTY(a) { return a.every((m) => m === ''); }
console.log(errs.length ? errs.join('\n') : '无页面错误');
ok(errs.length === 0, '页面无报错');
await browser.close();
console.log(fails ? `\n❌ ${fails} 项失败` : '\n✅ 全部通过');
process.exit(fails ? 1 : 0);
