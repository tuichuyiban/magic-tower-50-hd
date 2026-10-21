// 第五区（41F–50F）+ 0F + 结局的无头端到端测试
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
/** 快捷键使用背包道具：弹出确认框 → Enter */
async function useKey(k) {
  await key(k); await wait(250);
  const shown = await G(() => !!document.querySelector('#overlay:not(.hidden) .use-confirm'));
  if (shown) { await key('Enter'); await wait(400); }
  await settle();
  return shown;
}

// ================================================================ ?test=5：第五区试玩（悬停用 ?hover 模拟）
await page.goto('http://localhost:4173/?test=5&hover', { waitUntil: 'networkidle0' });
await wait(1000);
let s = await st();
ok(s.f === 41 && s.hero.hp === 20000 && s.hero.weapon === '骑士剑' && s.hero.shield === '骑士盾', `第五区试玩：${s.f}F ${s.hero.hp}/${s.hero.atk}/${s.hero.def} ${s.hero.weapon}/${s.hero.shield}`);

// ================================================================ 41F 地图伤害：领域 / 夹击
ok((await dmgAt(2, 5)) === 100 && (await dmgAt(1, 4)) === 100 && (await dmgAt(1, 2)) === 200, `领域：初级巫师十字 100、高级巫师十字 200 → (2,5)=${await dmgAt(2, 5)} (1,2)=${await dmgAt(1, 2)}`);
ok((await dmgAt(5, 3)) === 10000, `夹击：两只魔法警卫中间 = 生命一半 → (5,3)=${await dmgAt(5, 3)}`);
await shot('z5-01-floor41-map-damage');
let t = await tileXY(4, 3); await page.mouse.move(t.x, t.y); await wait(300);
ok(JSON.stringify(await G(() => __renderer.hover)) === '{"x":4,"y":3}', '悬停魔法警卫：情报浮窗（含「夹击」标签）');
await shot('z5-02-hover-whiteking-tags');
t = await tileXY(2, 5); await page.mouse.move(t.x, t.y); await wait(300);
await shot('z5-03-hover-damage-cell');
await page.mouse.move(5, 5);
await setHero({ hp: 1000 }); await at(2, 6); await key('ArrowUp'); await settle();
s = await st();
ok(s.pos.y === 5 && s.hero.hp === 900, `踏入领域格：生命 1000 → ${s.hero.hp}`);
await at(5, 4); await key('ArrowUp'); await settle();
s = await st();
ok(s.pos.y === 3 && s.hero.hp === 450, `踏入夹击格：生命 900 → ${s.hero.hp}`);
await setHero({ hp: 100 }); await at(2, 6); await key('ArrowUp'); await settle();
ok((await st()).pos.y === 6, '伤害 ≥ 当前生命的格子不能进入');
// 自动清怪：不会去打 / 走伤害格
ok(await G(() => { const d = __game.mapDamage(); return d.any; }), '本层存在地图伤害（自动清怪会避开）');

// ================================================================ 41F 隐藏红衣巫师 → 降临之翼
await setHero({ hp: 20000, atk: 2000, def: 2000 });
await at(2, 1); await key('ArrowLeft'); await settle();
ok((await st()).flags.wiz41 === 1, '击败左上的高级巫师');
await G(() => __game.visited.add(42));
await at(8, 1); await key('ArrowRight'); await settle();
ok((await cell(9, 1)).monster === 'redWizard', '到过 42F 后在 (8,1) 向右撞墙 → 对称位置出现隐藏的高级巫师');
await key('ArrowRight'); await settle();
ok((await cell(5, 4)).item === 'downFly' && (await cell(5, 5)).terrain === 'wall', '击败 → 中间出现降临之翼（地形改变）');
await at(5, 3); await key('ArrowDown'); await settle();
ok((await st()).hero.bag.downFly === 1, '获得降临之翼');

// ================================================================ 1F → 降临之翼 → 0F 幸运金币
await tp(1, 6, 0); await wait(300);
ok(await useKey('5'), '降临之翼（快捷键 5）弹出确认框');
s = await st();
ok(s.f === 0 && s.pos.x === 6 && s.pos.y === 0, `1F (6,0) 使用降临之翼 → ${s.f}F (${s.pos.x},${s.pos.y})`);
const track0 = await G(() => window.__musicTrack());
await at(5, 4); await key('ArrowDown'); await settle();
ok((await st()).hero.tools.coin === true && track0 === 'cellar', `0F 拾取幸运金币（0F 曲 ${track0}）`);
await shot('z5-04-floor0-lucky-coin');
await tp(1, 1, 0); await setHero({ atk: 500, def: 500 });
const g0 = (await st()).hero.gold; await key('ArrowRight'); await settle();
ok((await st()).hero.gold - g0 === 2, `幸运金币：1F 绿史莱姆金币 1 → ×2 = ${(await st()).hero.gold - g0}`);

// ================================================================ 42F 剧情
await setHero({ atk: 2000, def: 2000 });
await tp(42, 4, 10); await key('ArrowUp'); await wait(300);
let r = await advance(60); await settle();
ok((await st()).flags.scene42 && r.seen.some((t) => t.includes('临阵脱逃')) && r.seen.some((t) => t.includes('期待着与你决斗')), `42F 骑士队长被魔王处决（${r.seen.length} 句）`);

// ================================================================ 43F 陷阱 + 升华之翼 → 44F
await tp(43, 7, 1); await G(() => { __game.cell({ x: 7, y: 0 }).door = undefined; }); await key('ArrowUp'); await settle();
ok((await cell(6, 0)).terrain === 'wall' && (await cell(9, 0)).terrain === 'wall', '43F 黄门后陷阱：通路被墙封住');
await G(() => __game.hero.bag = { ...__game.hero.bag, upFly: 1 });
await tp(43, 5, 1); await wait(200);
await useKey('4');
s = await st();
ok(s.f === 44, `43F 使用升华之翼 → ${s.f}F（44F 只能这样到达）`);
// 44F：炸弹炸掉两只红卫兵 → 机关门打开 → 神圣盾
await G(() => __game.hero.bag = { ...__game.hero.bag, bomb: 1 });
await at(5, 8);
ok(await useKey('2'), '炸弹（快捷键 2）弹出确认框');
ok(!(await cell(4, 8)).monster && !(await cell(6, 8)).monster && !(await cell(5, 7)).door, '炸弹炸死相邻两只红卫兵（生命 < 500）→ 机关门打开');
for (let i = 0; i < 3; i++) { await key('ArrowUp'); await settle(); }
s = await st();
ok(s.hero.tools.magicImmune === true, '获得神圣盾（魔法免疫）');
await shot('z5-05-floor44-divine-shield');
await tp(41, 5, 4); await wait(200);
ok((await dmgAt(5, 3)) === 0 && !(await G(() => __game.mapDamage().any)), '有神圣盾后 41F 的地图伤害全部为 0');
await tools({ magicImmune: false });

// ================================================================ 瞬移 / 冰魔法 / 地震卷轴 / 大钥匙
await G(() => __game.hero.bag = { ...__game.hero.bag, centerFly: 3, earthquake: 1, bigKey: 1, snow: 0 });
await tp(41, 2, 5); await wait(200);
// 第二轮：瞬移不弹确认框——第一次按 3 预览落点（绿），第二次按 3 才瞬移
await key('3'); await wait(250);
ok(!(await G(() => !!document.querySelector('#overlay:not(.hidden) .use-confirm'))) && (await G(() => __renderer.centerPreview?.ok === true)), '瞬移第一次按 3：无确认框，落点绿色预览');
await key('3'); await wait(400); await settle();
s = await st();
ok(s.pos.x === 8 && s.pos.y === 5 && s.hero.bag.centerFly === 2, `瞬移：(2,5) → (${s.pos.x},${s.pos.y})，剩 ${s.hero.bag.centerFly} 次`);
await useKey('8');
ok(!(await cell(0, 1)).door && !(await cell(10, 9)).door && !(await cell(4, 5)).door?.startsWith?.('yellow'), '大钥匙：本层所有黄门打开');
await tp(37, 0, 1); await wait(200);
await useKey('7');
ok((await cell(2, 1)).terrain === 'floor' && (await cell(1, 3)).terrain === 'floor', '37F 使用地震卷轴：所有墙被摧毁');
await shot('z5-06-floor37-earthquake');

// ================================================================ 45F 商人 / 46F 祭坛（倍率 5）
await tp(45, 8, 3); await setHero({ gold: 5000, hp: 20000 }); await key('ArrowUp'); await choices(); await pick(0); await settle();
ok((await st()).hero.hp === 22000, `45F 商人：1000 金币 → 生命 +2000 = ${(await st()).hero.hp}`);
await tp(46, 5, 1); await key('ArrowUp'); await choices();
const opts = await G(() => [...document.querySelectorAll('#dialog .dlg-choices button')].map((b) => b.textContent));
ok(opts.some((t) => t.includes('攻击+10')) && opts.some((t) => t.includes('防御+20')), `46F 祭坛：${opts.join(' / ')}`);
await pick(opts.length - 1); await settle();

// ================================================================ 50F 先和小偷对话（TE 条件）
await setHero({ hp: 100000, atk: 3000, def: 2000 });
await tp(50, 5, 5); await key('ArrowUp'); r = await advance(80); await settle();
s = await st();
ok(s.flags.talked50 && (await cell(5, 4)).monster === 'redKing' && r.seen.some((t) => t.includes('你就是魔王')), `50F 小偷原来是魔王（${r.seen.length} 句）`);
ok((await G(() => window.__musicTrack())) === 'lastfight', '50F 对话后播放 LastFight 曲');
ok((await G(() => __game.monsterDef('redKing').hp)) === 5000, `真魔王 ${await G(() => { const d = __game.monsterDef('redKing'); return d.hp + '/' + d.atk + '/' + d.def; })}`);

// ================================================================ 49F 魔王与封印（骰子 5）
await tp(49, 5, 6); await G(() => { __game.cell({ x: 5, y: 6 }).door = undefined; });
await key('ArrowUp'); r = await advance(30); await settle();
const trackZ = await G(() => window.__musicTrack());
ok((await st()).flags.zeno49 && (await cell(5, 2)).monster === 'redKing' && (await cell(4, 1)).monster === 'whiteKing', '49F：魔王与 8 名魔法警卫出现');
ok(trackZ === 'zeno', `49F 播放 Zeno 曲：${trackZ}`);
await shot('z5-07-floor49-zeno');
for (const [x, y, k, hx, hy] of [[5, 3, 'ArrowUp', 5, 4], [4, 2, 'ArrowRight', 3, 2], [6, 2, 'ArrowLeft', 7, 2], [5, 1, 'ArrowDown', 5, 0]]) {
  await at(hx, hy); await key(k); await settle();
}
s = await st();
ok(s.flags.sealed49 && s.flags.TE, `只消灭十字的 4 名警卫 → 封印（TE 条件成立）`);
ok((await G(() => __game.monsterDef('redKing').hp)) === 500, `封印后魔王只剩一成：${await G(() => { const d = __game.monsterDef('redKing'); return d.hp + '/' + d.atk + '/' + d.def; })}`);
await at(5, 3); await key('ArrowUp'); r = await advance(20); await settle();
ok((await st()).flags.fakeKing49 && (await cell(4, 1)).item === 'redKey', '击败 49F 假魔王 → 奖励出现');

// ================================================================ 50F 决战 → 结局
await tp(50, 5, 5); await key('ArrowUp'); r = await advance(20); await wait(2500);
const end = await G(() => document.querySelector('#overlay:not(.hidden)')?.textContent ?? '');
ok(end.includes('真结局') && end.includes('击败'), `结局画面：${end.replace(/\s+/g, ' ').slice(0, 60)}`);
ok((await G(() => window.__musicTrack())) === 'ending', '结局曲');
await shot('z5-09-ending-te');
await G(() => { __modal.hide(); __showEnding('NE'); }); await wait(500);
ok((await G(() => document.querySelector('#overlay:not(.hidden)')?.textContent ?? '')).includes('普通结局'), 'NE 结局画面');
await shot('z5-10-ending-ne');

ok(!errs.length, `无页面错误${errs.length ? '：' + errs.join(' | ') : ''}`);
console.log(fails ? `❌ ${fails} 项失败` : '✅ 全部通过');
await browser.close();
process.exitCode = fails ? 1 : 0;
