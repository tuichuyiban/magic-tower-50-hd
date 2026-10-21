// 第三区（21F–30F）+ 试玩模式选区 的无头端到端测试
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
// ================================================================ 开始画面：试玩模式选区
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await wait(800);
await G(() => [...document.querySelectorAll('#overlay button')].find((b) => b.textContent.includes('试玩模式')).click());
await wait(500);
const zoneBtns = await G(() => [...document.querySelectorAll('#overlay button')].map((b) => b.textContent));
ok(['11F', '21F', '31F', '41F'].every((f) => zoneBtns.some((t) => t.includes(f + ' 起'))), `试玩模式选区：${zoneBtns.join(' / ')}`);
await shot('z3-01-test-mode-zone-select');
await G(() => [...document.querySelectorAll('#overlay button')].find((b) => b.textContent.includes('21F 起')).click());
await wait(300); await G(() => [...document.querySelectorAll('#overlay button')].find((b) => b.textContent.includes('经典版'))?.click()); // 开局选项：经典版
await wait(1000);
let s = await st();
ok(s.f === 21 && s.flags.testMode && s.flags.testZone === 3, `21F 起 → ${s.f}F testZone=${s.flags.testZone}`);
ok(s.hero.hp === 10000 && s.hero.atk === 177 && s.hero.def === 179 && s.hero.tools.cross, `第三区试玩属性 ${s.hero.hp}/${s.hero.atk}/${s.hero.def}（第二区路线终局 77/79 + 100，十字架）`);
const vis = await G(() => [...__game.visited].sort((a, b) => a - b));
ok(vis.length === 21 && vis[0] === 1 && vis[20] === 21, `1F–21F 已到达：${vis.join(',')}`);
await shot('z3-02-test-mode-21f');

// ================================================================ 21F 老人
await tp(21, 5, 6); await key('ArrowUp'); let r = await advance();
ok(r.seen.some((t) => t.includes('大法师住在25楼')), `21F 老人：${(r.seen[0] ?? '').slice(0, 30)}…`);

// ================================================================ 23F 隐形迷宫 + 29F 小偷
await tp(23, 0, 1); await wait(200);
const mazeN = await G(() => __game.floors[23].flat().filter((c) => c.terrain === 'mazeWall').length);
ok(mazeN === 43, `23F 隐形墙 ${mazeN} 堵`);
await shot('z3-03-floor23-invisible-maze');
await key('ArrowRight'); // (1,1) 是隐形墙
ok((await cell(1, 1)).terrain === 'wall' && (await st()).pos.x === 0, '撞到隐形墙 → 显形为墙，勇士不动');
// 迷宫没撞完时：按 h5 默认「额外功能」，小偷开个玩笑后照样打通（详见 fixes.mjs）
await G(() => { for (const row of __game.floors[23]) for (const c of row) if (c.terrain === 'mazeWall') c.terrain = 'wall'; });
await tp(29, 5, 0); await key('ArrowDown'); r = await advance(); await settle();
ok(!r.seen.some((t) => t.includes('开玩笑')), `迷宫撞完时 29F 小偷不开玩笑：${(r.seen[0] ?? '').slice(0, 16)}…`);
ok(r.seen.some((t) => t.includes('我刚完成暗道')) && !(await cell(5, 2)).terrain.includes('sealed'), `迷宫撞完后：${(r.seen[0] ?? '').slice(0, 20)}… 暗道 (5,2) 打开`);
ok((await cell(9, 10, 2)).npc === 'thief', '2F (9,10) 出现小偷');
await tp(2, 9, 9); await key('ArrowDown'); r = await advance(); await settle();
ok(r.seen.some((t) => t.includes('魔龙前打开一条暗道')) && (await cell(3, 8, 35)).terrain === 'floor' && (await cell(4, 9, 35)).npc === 'thief', '2F 小偷：35F 暗道 (3,8) 打通，小偷去 35F');

// ================================================================ 25F 大法师
await tp(25, 5, 9); await key('ArrowUp'); r = await advance();
ok(r.seen.some((t) => t.includes('杀-死-入-侵-者')), `25F 大法师：${r.seen[0]}`);
await shot('z3-04-floor25-magician');
await G(() => { __game.hero.atk = 2000; __game.hero.def = 2000; });
await tp(25, 5, 6); await key('ArrowUp'); await settle();
const rk = await G(() => [3, 4, 6, 7].map((x) => __game.cell({ x, y: 7 }).item));
ok(rk.every((i) => i === 'redKey'), `击败大法师 → 4 把红钥匙：${rk.join(',')}`);

// ================================================================ 26F 公主（洋娃娃）+ 24F 通往 50F 的暗道
await tp(26, 5, 4); await G(() => { __game.cell({ x: 5, y: 4 }).terrain = 'floor'; }); await key('ArrowDown');
await wait(400);
const dl = await dlgText();
await shot('z3-05-floor26-princess');
r = await advance();
ok([dl, ...r.seen].some((t) => t.includes('你已被命运选中')) && [dl, ...r.seen].some((t) => t.includes('这只是个洋娃娃')), '26F 洋娃娃对话');
s = await st();
ok(s.flags.princess === true && (await G(() => window.__musicTrack())) === 'princess', `救出后 flag 营救公主，音乐 ${await G(() => window.__musicTrack())}`);
ok((await cell(5, 1, 24)).terrain === 'floor' && (await cell(5, 0, 24)).terrain === 'airwall', '24F 中央暗道出现');
await tp(24, 5, 2); await key('ArrowUp'); await wait(2500); await settle();
s = await st();
ok(s.f === 50 && s.pos.x === 5 && s.pos.y === 6, `24F 暗道 → 时空穿越到 ${s.f}F (${s.pos.x},${s.pos.y})`);
await shot('z3-06-floor50-arrival');

// ================================================================ 28F 回收黄钥匙
await tp(28, 7, 4); await G(() => { __game.hero.keys.yellow = 3; });
const g0 = (await st()).hero.gold;
await key('ArrowUp'); await choices();
await shot('z3-07-floor28-key-buyer');
await pick(0); await choices(); await pick(1); await settle();
s = await st();
ok(s.hero.keys.yellow === 2 && s.hero.gold === g0 + 100, `28F 商人：卖 1 把黄钥匙 → 黄 ${s.hero.keys.yellow}，金币 +${s.hero.gold - g0}`);

// ================================================================ 30F 六只史莱姆
await tp(30, 5, 5);
for (const [x, y] of [[2, 4], [3, 4], [4, 4], [6, 4], [7, 4], [8, 4]]) {
  await G(([x, y]) => { __game.pos = { x, y: y + 1 }; }, [x, y]);
  await key('ArrowUp'); await settle();
}
ok(!(await cell(5, 3)).door, '30F：6 只史莱姆全部消灭 → 机关门 (5,3) 打开');
await tp(30, 5, 1); await key('ArrowUp'); await wait(900); await settle();
ok((await st()).f === 31, `30F 上楼 → ${(await st()).f}F`);

// ================================================================ 怪物手册（第三区怪物）
await tp(25, 5, 9); await G(() => { __game.cell({ x: 5, y: 5 }).monster = 'blackMagician'; });
await key('KeyM'); await wait(500);
const man = await G(() => document.querySelector('#overlay:not(.hidden)')?.textContent ?? '');
ok(man.includes('大法师'), '怪物手册列出大法师');
await shot('z3-08-manual-zone3');
await key('Escape');

ok(!errs.length, `无页面错误${errs.length ? '：' + errs.join(' | ') : ''}`);
console.log(fails ? `❌ ${fails} 项失败` : '✅ 全部通过');
await browser.close();
process.exitCode = fails ? 1 : 0;
