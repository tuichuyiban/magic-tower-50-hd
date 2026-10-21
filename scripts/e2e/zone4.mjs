// 第四区（31F–40F）的无头端到端测试
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
async function advance(max = 40, onLine = null) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    await wait(120);
    const open = await G(() => __dialog.isOpen);
    if (!open) { if (!(await G(() => __director.busy))) break; await wait(200); continue; }
    if (await G(() => document.querySelectorAll('#dialog .dlg-choices button').length)) return { seen, choices: true };
    const t = (await G(() => document.querySelector('#dialog .dlg-name').textContent)) + '：' + (await G(() => __dialog.full));
    if (!seen.includes(t)) seen.push(t);
    await G(() => document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    if (onLine) await onLine(t);
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
const killAt = async (f, x, y, dir) => { // 站到怪物旁边并攻击
  const d = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[dir];
  await tp(f, x + d[0], y + d[1]); await key({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir]); await settle();
};

// ================================================================ ?test=4：第四区试玩
await page.goto('http://localhost:4173/?test=4', { waitUntil: 'networkidle0' });
await wait(1000);
let s = await st();
ok(s.f === 31 && s.hero.hp === 15000 && s.hero.atk === 183 && s.hero.def === 185, `第四区试玩：${s.f}F ${s.hero.hp}/${s.hero.atk}/${s.hero.def}`);
await shot('z4-01-test-mode-31f');

// ================================================================ 31F 商人
await tp(31, 1, 10); await key('ArrowLeft'); await choices(); await pick(0); await settle();
s = await st();
ok(s.hero.keys.yellow === 24 && s.hero.keys.blue === 11 && s.hero.gold === 4000, `31F 商人：1000 金币 → 黄 ${s.hero.keys.yellow} 蓝 ${s.hero.keys.blue} 金 ${s.hero.gold}`);

// ================================================================ 32F 骑士队长伏击 + 阵亡弹窗
await G(() => __game.serialize()).then((snap) => G((snap) => { window.__snap32 = snap; }, snap));
await setHero({ hp: 50, atk: 60, def: 0 });
await tp(32, 4, 9); await key('ArrowRight'); await wait(400);
let r = await advance(60); await wait(1500);
const over = await G(() => document.querySelector('#overlay:not(.hidden)')?.textContent ?? '');
ok((await G(() => __game.dead)) && over.includes('勇士倒下了'), `打不过骑士队长（强制战斗）→ 阵亡弹窗：${over.slice(0, 20)}`);
await shot('z4-02-game-over');
await G(() => { __modal.hide(); __game.deserialize(window.__snap32); });
await wait(300);
await tp(32, 4, 9); await key('ArrowRight'); r = await advance(60); await settle();
s = await st();
ok(s.flags.knight32 && !s.flags.knight32Active && r.seen.some((t) => t.includes('亲手杀死你')) && r.seen.some((t) => t.includes('40楼与我再打一次')), `32F 骑士队长伏击 → 战斗 → 逃走（${r.seen.length} 句）`);
ok((await cell(5, 8)).terrain === 'floor' && !(await cell(5, 8)).npc, '32F 空气墙移除，骑士队长离开');
// 32F 祭坛（倍率 4）
await tp(32, 9, 10); await key('ArrowUp'); await choices();
const altarOpts = await G(() => [...document.querySelectorAll('#dialog .dlg-choices button')].map((b) => b.textContent));
ok(altarOpts.some((t) => t.includes('攻击+8')) && altarOpts.some((t) => t.includes('防御+16')), `32F 祭坛：${altarOpts.join(' / ')}`);
await pick(3); await settle();

// ================================================================ 33F 机关
await tp(33, 9, 3); await key('ArrowDown'); await settle();
ok((await cell(9, 3)).door === 'special' && (await cell(9, 7)).door === 'special' && (await cell(10, 3)).terrain === 'wall', '33F 踏入机关：上下两扇机关门关闭');
await shot('z4-03-floor33-trap');
await setHero({ atk: 600, def: 600 });
for (const [x, y, d] of [[8, 4, 'left'], [10, 4, 'right']]) { await G(() => { __game.pos = { x: 9, y: 4 }; }); await key(d === 'left' ? 'ArrowLeft' : 'ArrowRight'); await settle(); }
for (const [x, d] of [[8, 'left'], [10, 'right']]) { await G(() => { __game.pos = { x: 9, y: 6 }; }); await key(d === 'left' ? 'ArrowLeft' : 'ArrowRight'); await settle(); }
ok(!(await cell(9, 3)).door && !(await cell(9, 7)).door, '33F 消灭 4 只怪 → 机关门重新打开');

// ================================================================ 34F 第二把隐藏红钥匙
await tp(34, 5, 5);
for (const [x, y] of [[4, 3], [6, 3], [8, 3], [10, 3], [4, 7], [6, 7], [8, 7], [10, 7]]) {
  await G(([x, y]) => { __game.cell({ x, y: y === 3 ? 4 : 6 }).door = undefined; __game.pos = { x, y: y === 3 ? 4 : 6 }; }, [x, y]);
  await key(y === 3 ? 'ArrowUp' : 'ArrowDown'); await settle();
}
ok((await cell(1, 5)).item === 'redKey' && (await cell(0, 4)).item === 'yellowKey', '34F 消灭 8 只怪 → (1,5) 出现隐藏红钥匙 + 4 把黄钥匙');
await shot('z4-04-floor34-hidden-red-key');

// ================================================================ 35F 魔龙
await tp(35, 5, 8); await wait(300);
await shot('z4-05-floor35-dragon');
const dInfo = await G(() => __game.monsterInfoAt({ x: 5, y: 6 }));
ok(dInfo.def.name === '魔龙' && dInfo.def.hp === 1500, `35F 魔龙 ${dInfo.def.hp}/${dInfo.def.atk}/${dInfo.def.def}`);
await setHero({ atk: 1000, def: 700 });
await G(() => { __game.pos = { x: 5, y: 7 }; }); await key('ArrowUp'); await settle();
ok(!(await cell(5, 2)).door && (await cell(5, 5)).item === 'snow' && (await cell(4, 4)).item === 'bluePotion', '击败魔龙 → 机关门打开，出现冰魔法与蓝血瓶');
await G(() => { __game.pos = { x: 5, y: 6 }; }); await key('ArrowUp'); await settle();
ok((await st()).hero.tools.snow === true, '获得冰魔法');

// ================================================================ 39F 3 点谜题
await tp(39, 3, 0); await key('ArrowDown'); await settle(); // 开 (3,1)
await G(() => { __game.pos = { x: 6, y: 3 }; }); await key('ArrowLeft'); await settle(); // 开 (5,3)
ok((await cell(3, 3)).item === 'centerFly', '39F 只开 (3,1)(5,3) 两扇门 → 中间出现瞬移');
await shot('z4-06-floor39-puzzle');
await G(() => { __game.cell({ x: 3, y: 2 }).door = undefined; __game.pos = { x: 3, y: 2 }; }); await key('ArrowDown');
await advance(10); await settle();
ok((await st()).hero.bag.centerFly === 3, `拾取瞬移 ×${(await st()).hero.bag.centerFly}`);

// ================================================================ 40F 骑士队长的车轮战
await setHero({ hp: 50000, atk: 300, def: 300 });
await tp(40, 5, 7); await key('ArrowUp'); await wait(1200);
const trackK = await G(() => window.__musicTrack());
await shot('z4-07-floor40-knight-battle');
await G(() => { window.__fought40 = []; __game.on((e) => { if (e.type === 'battle') window.__fought40.push(e.monster + '@' + e.at.x + ',' + e.at.y); }); });
let shotCaptain = false;
r = await advance(200, async (t) => {
  if (!shotCaptain && t.includes('失去了理智')) {
    shotCaptain = true;
    // 等队长从 (5,0) 冲下来（行走中的 actor），在他贴近勇士时截图
    for (let k = 0; k < 60; k++) {
      const a = await G(() => __game.actors.find((x) => x.monster === 'yellowKnight'));
      if (a && a.pos.y >= 3) break;
      if (await G(() => __dialog.isOpen)) await G(() => document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
      await wait(40);
    }
    await page.screenshot({ path: `${OUT}/z4-07b-floor40-captain-charges.png` });
  }
}); await settle();
s = await st();
const fought40 = await G(() => window.__fought40);
ok(fought40[fought40.length - 1] === 'yellowKnight@5,5' && fought40.length === 13, `原版 MT40：队长先亲自与勇士战斗一次再逃走（共 ${fought40.length} 战，最后一战 ${fought40[fought40.length - 1]}）`);
ok(r.seen.findIndex((t) => t.includes('失去了理智')) < r.seen.findIndex((t) => t.includes('骑士队长逃走了')), '台词顺序：失去理智 → 战斗 → 逃走');
ok(trackK === 'knight', `车轮战时播放 Knight 曲：${trackK}`);
ok(s.flags.knight40 && (await cell(5, 0)).terrain === 'stairsUp', '40F 车轮战结束，骑士队长逃走，出现上楼梯');
ok(r.seen.some((t) => t.includes('鬼战士给我上')) && r.seen.some((t) => t.includes('骑士队长逃走了')), `车轮战台词 ${r.seen.length} 句`);
ok((await cell(1, 1)).item === 'yellowKey' && (await cell(7, 1)).item === 'redGem' && (await cell(2, 3)).item === 'bluePotion' && (await cell(6, 3)).item === 'blueGem', '奖励：3 黄钥匙 / 3 红宝石 / 3 蓝血瓶 / 3 蓝宝石');
ok(!s.flags['first:soldier'] && !s.flags['first:swordsman'], '先攻效果已撤销');
await tp(40, 5, 1); await key('ArrowUp'); await wait(900); await settle();
ok((await st()).f === 41, `40F 上楼 → ${(await st()).f}F`);

ok(!errs.length, `无页面错误${errs.length ? '：' + errs.join(' | ') : ''}`);
console.log(fails ? `❌ ${fails} 项失败` : '✅ 全部通过');
await browser.close();
process.exitCode = fails ? 1 : 0;
