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
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => { for (const k of ['autoClear', 'autoPickup', 'autoHidden']) localStorage.setItem('mota-hd-zone1:setting:' + k, '0'); });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(1500);
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

const st = () => G(() => ({ f: __game.floorId, pos: __game.pos, hero: __game.hero, busy: __director.busy, dlg: __dialog.isOpen, log: __game.log.at(-1)?.text }));
const dlgText = () => G(() => document.querySelector('#dialog .dlg-name').textContent + '：' + __dialog.full);
/** 点击对话框直到关闭或出现选项 */
async function advance(max = 30) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    await wait(120);
    const open = await G(() => __dialog.isOpen);
    if (!open) { if (!(await G(() => __director.busy))) break; await wait(200); continue; }
    const hasChoices = await G(() => document.querySelectorAll('#dialog .dlg-choices button').length);
    if (hasChoices) return { seen, choices: true };
    const full = await G(() => __dialog.full);
    const t = (await G(() => document.querySelector('#dialog .dlg-name').textContent)) + '：' + full;
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
const pick = async (i) => { await choices(); await G((i) => document.querySelectorAll('#dialog .dlg-choices button')[i].click(), i); await wait(300); };
const tp = (f, x, y) => G((f, x, y) => { __game.changeFloor(f, { x, y }); }, f, x, y);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await wait(170); } };
const shot = async (name) => { await wait(250); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };

// ---- 1F 起始画面
let s = await st();
ok(s.f === 1 && s.pos.x === 5 && s.pos.y === 10 && s.hero.atk === 100 && s.hero.weapon === '神圣剑', `序章：1F (5,10)，1000/100/100 神圣剑 → ${JSON.stringify(s.hero).slice(0, 80)}`);
await shot('01-floor1-start');

// ---- 1F 魔杖：走到 (1,10) 拾取（先拿钥匙开门）
await tp(1, 3, 9); await key('ArrowLeft');
s = await st();
// (2,9) 是黄钥匙：从 (3,9) 左移拾取；然后 (1,10) 魔杖
await tp(1, 2, 10); await key('ArrowLeft'); await wait(300);
let r = await advance();
s = await st();
ok(s.hero.tools.fly === true, `拾取魔杖：tools.fly=${s.hero.tools.fly}，提示：${r.seen.join(' / ')}`);

// ---- 换层：1F 上楼梯 (0,0)，从 (1,0) 左移
await tp(1, 1, 0); await key('ArrowLeft'); await wait(700);
s = await st();
ok(s.f === 2 && s.pos.x === 0 && s.pos.y === 1, `上楼：到达 2F，落脚点 (0,1) → ${s.f}F (${s.pos.x},${s.pos.y})`);
await shot('02-floor2-arrive');
// 下楼回 1F：落在 1F 上楼梯旁 (1,0)
await key('ArrowUp'); await wait(700);
s = await st();
ok(s.f === 1 && s.pos.x === 1 && s.pos.y === 0, `下楼：回到 1F，落脚点 (1,0) → ${s.f}F (${s.pos.x},${s.pos.y})`);

// ---- 3F 魔王伏击剧情
await tp(3, 4, 9); await key('ArrowUp'); await wait(200);
r = await advance(40);
s = await st();
ok(r.seen.some((t) => t.startsWith('魔王：欢迎来到魔塔')), `魔王对话：${r.seen[0]}`);
ok(r.seen.some((t) => t.includes('什么？')), '勇士："什么？"');
ok(s.f === 2 && s.pos.x === 2 && s.pos.y === 7 && s.hero.hp === 400 && s.hero.atk === 10 && s.hero.def === 10 && s.hero.weapon === null,
  `被关进 2F 监狱 (2,7)，400/10/10，无装备 → ${s.f}F (${s.pos.x},${s.pos.y}) ${s.hero.hp}/${s.hero.atk}/${s.hero.def} ${s.hero.weapon}`);

// ---- 2F 小偷对话 + 越狱暗道
await key('ArrowUp'); await wait(150);
await shot('03-thief-dialog');
r = await advance(20);
await wait(1200);
s = await st();
const wall = await G(() => __game.cell({ x: 1, y: 6 }).terrain);
ok(r.seen.some((t) => t.startsWith('小偷：你清醒了吗')) && wall === 'floor', `小偷对话并打开暗道：${r.seen[0]?.slice(0, 20)}… 牢墙→${wall}`);
const thiefAt = await G(() => __game.cell({ x: 0, y: 8 }).npc);
ok(thiefAt === 'thief', `小偷走到出口 (0,8)：${thiefAt}`);

// ---- 3F 老人送怪物手册
await tp(3, 9, 3); await key('ArrowRight'); await wait(150);
r = await advance();
ok(r.choices, '老人对话出现选项「谢谢」');
await pick(0);
s = await st();
ok(s.hero.tools.book === true, `获得怪物手册：book=${s.hero.tools.book}`);

// ---- 4F 祭坛商店：供奉 20 金币 → 攻击 +2
await G(() => { __game.hero.gold = 100; });
await tp(4, 5, 1); await key('ArrowUp'); await wait(200);
r = await advance();
const shopText = await dlgText();
ok(r.choices && shopText.includes('如果供奉20金币'), `祭坛：${shopText}`);
await shot('04-floor4-altar-shop');
const labels = await G(() => [...document.querySelectorAll('#dialog .dlg-choices button')].map((b) => b.textContent));
ok(labels.join('|') === '生命+100|攻击+2|防御+4|离开', `祭坛选项：${labels.join(' / ')}`);
await pick(1); await choices();
s = await st();
const price2 = await dlgText();
ok(s.hero.atk === 12 && s.hero.gold === 80 && price2.includes('如果供奉40金币'), `购买攻击 +2：攻击 ${s.hero.atk} 金币 ${s.hero.gold}；下次价格：${price2.slice(0, 20)}`);
await pick(3);
ok(!(await G(() => __dialog.isOpen)), '离开祭坛');

// ---- 6F 商人：50 金币买蓝钥匙
await tp(6, 7, 4); await key('ArrowUp'); await wait(150);
r = await advance();
await pick(0);
s = await st();
ok(s.hero.keys.blue === 1 && s.hero.gold === 30, `6F 商人：蓝钥匙 ${s.hero.keys.blue}，金币 ${s.hero.gold}`);

// ---- 5F 暗墙与铁剑
await tp(5, 7, 10); await key('ArrowRight'); await wait(400);
const hw = await G(() => __game.cell({ x: 8, y: 10 }).terrain);
ok(hw === 'floor', `5F (8,10) 暗墙被撞开 → ${hw}`);
await key('ArrowRight', 3); await wait(300);
s = await st();
ok(s.hero.atk === 22 && s.hero.weapon === '铁剑', `拾取铁剑：攻击 ${s.hero.atk} 装备 ${s.hero.weapon}`);
await shot('05-floor5-hidden-sword');

// ---- 存档 / 读档
await page.keyboard.press('KeyP'); await wait(300);
await page.click('.slot[data-slot="1"] button[data-action="save"]'); await wait(200);
const saved = await G(() => JSON.parse(localStorage.getItem('mota-hd-zone1:1')));
ok(saved && saved.floorId === 5 && saved.hero.atk === 22, `存入存档 1：${saved?.floorId}F 攻击 ${saved?.hero.atk}`);
await page.keyboard.press('Escape'); await wait(200);
await G(() => { __game.hero.atk = 1; __game.hero.hp = 1; __game.changeFloor(9, { x: 5, y: 1 }); });
await page.keyboard.press('KeyL'); await wait(300);
await shot('06-save-load');
await page.click('.slot[data-slot="1"] button[data-action="load"]'); await wait(900);
s = await st();
ok(s.f === 5 && s.hero.atk === 22 && s.hero.hp !== 1 && s.pos.x === 10 && s.pos.y === 10, `读取存档 1：${s.f}F (${s.pos.x},${s.pos.y}) 攻击 ${s.hero.atk} 生命 ${s.hero.hp}`);
const auto = await G(() => JSON.parse(localStorage.getItem('mota-hd-zone1:auto'))?.floorId);
ok(auto !== undefined, `换层后自动存档存在：${auto}F`);

// ---- 魔杖：需要站在楼梯旁
await page.keyboard.press('KeyF'); await wait(250);
ok(!(await G(() => document.querySelector('#overlay').classList.contains('hidden') === false)), '不在楼梯旁时魔杖无法使用');
await tp(5, 0, 9); await page.keyboard.press('KeyF'); await wait(300);
const flyNow = await flySel();
ok(flyNow === 5, `楼层传送器打开，预览当前楼层：${flyNow}F`);
await shot('07-fly-menu');
await flyPick(2); await wait(900);
s = await st();
ok(s.f === 2 && s.pos.x === 0 && s.pos.y === 9, `飞往 2F（向下 → 落在 2F 上楼梯旁 (0,9)）→ ${s.f}F (${s.pos.x},${s.pos.y})`);

// ---- 8F 守卫机关门
await G(() => { __game.hero.atk = 100; __game.hero.def = 100; });
await tp(8, 8, 5); await key('ArrowUp'); await wait(150);
await tp(8, 10, 5); await key('ArrowUp'); await wait(400);
const sd = await G(() => __game.cell({ x: 9, y: 3 }).door);
ok(sd === undefined, `8F 两名初级卫兵被击败后机关门 (9,3) 打开 → ${sd ?? '已打开'}`);

// ---- 10F 伏击与头目
await G(() => { __game.hero.atk = 40; __game.hero.def = 40; __game.hero.hp = 3000; __game.hero.tools.book = true; });
await tp(10, 5, 5); await shot('08-floor10-boss-before');
await key('ArrowUp'); await wait(200);
r = await advance(10);
await wait(2600);
s = await st();
const ring = await G(() => [[4,3],[5,3],[6,3],[4,4],[6,4],[4,5],[5,5],[6,5]].map(([x,y]) => __game.cell({x,y}).monster?.slice(0,8) ?? '-'));
ok(r.seen.some((t) => t.includes('你中埋伏了')) && ring.every((m) => m !== '-'), `10F 伏击：${ring.join(',')}`);
await shot('09-floor10-ambush');
// 杀出重围：依次攻击包围圈
const order = [['ArrowLeft'], ['ArrowRight'], ['ArrowDown']];
for (const [k] of order) await key(k);
await G(async () => {
  const g = __game;
  for (const [x, y] of [[4,3],[6,3],[4,5],[6,5],[5,3]]) {
    // 依次走到相邻格攻击（测试用直接定位）
    g.pos = x === 5 ? { x: 5, y: 4 } : { x: x === 4 ? 4 : 6, y: 4 };
    if (y === 4) continue;
    g.tryMove(y < 4 ? 'up' : 'down');
    await __director.settle();
  }
});
await wait(400);
const left = await G(() => [[4,3],[5,3],[6,3],[4,4],[6,4],[4,5],[5,5],[6,5]].filter(([x,y]) => __game.cell({x,y}).monster).length);
ok(left === 0, `包围圈清空：剩余 ${left}`);
const door52 = await G(() => __game.cell({ x: 5, y: 2 }).door);
ok(door52 === undefined, `北侧机关门 (5,2) 自动打开 → ${door52 ?? '已打开'}`);
await tp(10, 5, 2); await key('ArrowUp'); await wait(200);
r = await advance();
ok(r.seen.some((t) => t.includes('我要与你决斗')), `骷髅队长宣战：${r.seen[0]?.slice(0, 24)}`);
await key('ArrowUp'); await wait(300);
r = await advance();
s = await st();
const up = await G(() => __game.cell({ x: 5, y: 10 }).terrain);
ok(r.seen.some((t) => t.includes('你怎会打败我')) && up === 'stairsUp', `击败骷髅队长：${r.seen[0]?.slice(0, 20)}… 上楼梯 ${up}`);
await tp(10, 5, 7); await key('ArrowDown'); await wait(300);
r = await advance(20);
ok(r.seen.some((t) => t.includes('银盾在11楼')), `小偷道别：${r.seen.at(-1)?.slice(0, 30)}`);
await wait(600);
await tp(10, 5, 9); await shot('10-floor10-cleared');
await key('ArrowDown'); await wait(1000);
ok((await st()).f === 11 && (await st()).pos.x === 5 && (await st()).pos.y === 9, `10F 上楼梯 → 进入第二区 11F（落脚点 ${JSON.stringify((await st()).pos)}）`);
await tp(10, 5, 9);

// ---- 怪物手册
await tp(9, 5, 1); await page.keyboard.press('KeyM'); await wait(300);
await shot('11-monster-manual');
await page.keyboard.press('Escape');

// ---- 备忘录
await G(() => { __game.hero.tools.notebook = true; });
await page.keyboard.press('KeyN'); await wait(300);
const notes = await G(() => document.querySelectorAll('.note').length);
ok(notes >= 1, `备忘录记录：${notes} 条`);
await page.keyboard.press('Escape');

ok(errs.length === 0, `无页面错误 ${errs.join(' | ')}`);
console.log(fails ? `❌ ${fails} 项失败` : '✅ 浏览器流程全部通过');
await browser.close();
process.exit(fails ? 1 : 0);
