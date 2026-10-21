// 第三轮反馈：存档 / 读档分页（第四轮起 4 格 × 100 页）、剧情怪不自动清、48F 白衣武士残影
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
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await wait(800);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = async (name) => { await wait(350); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };
const key = async (k) => { await page.keyboard.press(k); await wait(250); };
const cell = (x, y, f) => G((x, y, f) => ({ ...__game.cell({ x, y }, f) }), x, y, f);
const tp = (f, x, y) => G((f, x, y) => __game.changeFloor(f, { x, y }), f, x, y);
const st = () => G(() => ({ f: __game.floorId, pos: { ...__game.pos }, hero: { ...__game.hero }, flags: { ...__game.flags } }));
async function advance(max = 40) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    await wait(120);
    const open = await G(() => __dialog.isOpen);
    if (!open) { if (!(await G(() => __director.busy))) break; await wait(200); continue; }
    const t = (await G(() => document.querySelector('#dialog .dlg-name').textContent)) + '：' + (await G(() => __dialog.full));
    if (!seen.includes(t)) seen.push(t);
    await G(() => document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  }
  return seen;
}
const settle = async () => { for (let i = 0; i < 50 && (await G(() => __director.busy || __dialog.isOpen)); i++) await advance(); };
const tap = (sel) => G((sel) => { const e = document.querySelector(sel); if (!e) return 'missing'; if (e.disabled) return 'disabled'; e.click(); return 'ok'; }, sel);
const slots = () => G(() => [...document.querySelectorAll('.slots .slot')].map((e) => e.dataset.slot).join(','));
const title = () => G(() => document.querySelector('.modal .modal-title').textContent);
const pageNo = () => G(() => document.querySelector('.page-input')?.value);
const raw = (s) => G((s) => localStorage.getItem('mota-hd-zone1:' + s), s);

// ================================================================ 1. 存档 / 读档
// 旧存档迁移：v2 完整楼层 + PNG 缩略图 → v3 紧凑格式 + WebP
await G(() => {
  const d = __game.serialize();
  d.hero.hp = 4321;
  localStorage.setItem('mota-hd-zone1:1', JSON.stringify(d));
  // 旧版（第一 / 二轮）缩略图：160×160 地图截图（这里用 PNG 模拟更早的格式）
  const src = document.getElementById('game'); const cv = document.createElement('canvas'); cv.width = cv.height = 160; cv.getContext('2d').drawImage(src, 0, 0, src.width, src.height, 0, 0, 160, 160);
  localStorage.setItem('mota-hd-zone1:thumb:1', cv.toDataURL('image/png'));
  localStorage.setItem('mota-hd-zone1:7', JSON.stringify({ ...d, hero: { ...d.hero, hp: 777 } }));
});
const oldLen = (await raw('1')).length;
await page.reload({ waitUntil: 'networkidle0' }); await wait(1200);
const mig = JSON.parse(await raw('1'));
ok(mig.v === 3 && !mig.floors && (await raw('1')).length < oldLen / 4, `旧存档迁移为紧凑格式：v${mig.v}，${(oldLen / 1024).toFixed(0)} KB → ${((await raw('1')).length / 1024).toFixed(1)} KB`);
ok((await raw('thumb:1')).startsWith('data:image/webp'), `旧 PNG 缩略图迁移为 WebP（${((await raw('thumb:1')).length / 1024).toFixed(1)} KB）`);
ok(JSON.parse(await raw('7')).v === 3, '旧存档位编号不变（存档 7 仍在 7 号位）');

// 存档页（P）
await key('KeyP');
ok((await title()) === '存档' && (await slots()) === '1,2,3,4' && (await pageNo()) === '1', `P 打开「存档」页：每页 4 格 2×2（${await slots()}），第 ${await pageNo()} / 100 页`);
const grid = await G(() => { const r = [...document.querySelectorAll('.slots .slot')].map((e) => e.getBoundingClientRect()); return { cols: new Set(r.map((b) => Math.round(b.left))).size, rows: new Set(r.map((b) => Math.round(b.top))).size, bottom: Math.max(...[...document.querySelectorAll('.modal .modal-actions button')].map((b) => b.getBoundingClientRect().bottom)), vh: innerHeight }; });
ok(grid.cols === 2 && grid.rows === 2 && grid.bottom <= grid.vh, `2×2 网格（${grid.cols} 列 × ${grid.rows} 行），关闭按钮在屏幕内（${Math.round(grid.bottom)} ≤ ${grid.vh}）`);
ok(await G(() => document.querySelector('.save-tab[data-tab="save"]').classList.contains('primary') && !document.querySelector('.auto-row .slot')), '存档页：标签高亮「存档」，不显示自动存档');
ok(await G(() => document.querySelector('.slot[data-slot="1"] .s-info').textContent.includes('生命 4321')), '迁移后的存档 1 信息可读（生命 4321）');
// 点击空格中央缩略图：直接存档
await G(() => { __game.hero.hp = 1111; });
ok((await tap('.slot[data-slot="2"] .s-thumb')) === 'ok', '点击存档 2（空）的中央缩略图');
await wait(200);
ok(JSON.parse(await raw('2'))?.hero.hp === 1111 && /^data:image\/webp/.test(await raw('thumb:2')), `存入存档 2（无确认）：生命 1111，缩略图 ${((await raw('thumb:2')).length / 1024).toFixed(1)} KB WebP，存档 ${((await raw('2')).length / 1024).toFixed(1)} KB`);
ok(await G(() => document.querySelector('.save-msg').textContent.includes('已存入存档 2')), '页面提示「已存入存档 2」');
// 非空：直接覆盖（不再确认），卡片闪光 +「已存档」
await tap('.slot[data-slot="1"] .s-thumb'); await wait(120);
ok(!(await G(() => !!document.querySelector('.slot[data-slot="1"] .s-confirm'))) && JSON.parse(await raw('1')).hero.hp === 1111, '点击非空的存档 1：直接覆盖，不弹确认');
ok(await G(() => document.querySelector('.slot[data-slot="1"]').classList.contains('just-saved') && document.querySelector('.slot[data-slot="1"] .s-saved')?.textContent === '已存档'), '存档反馈：卡片闪光 +「已存档」');
await shot('r3-save-flash');
// 存档按钮仍可用
ok(await G(() => !!document.querySelector('.slot[data-slot="2"] button[data-action="save"]')), '卡片下方仍保留「存档」按钮');
await shot('r3-save-page');

// 读档页（L / 标签）
await key('KeyL');
ok((await title()) === '读档' && (await G(() => !!document.querySelector('.auto-row .slot[data-slot="auto"]'))), 'L 切到「读档」页：顶部显示自动存档');
await G(() => document.querySelector('.pager [data-action="next"]').click()); await wait(150);
ok((await slots()) === '5,6,7,8' && (await G(() => document.querySelector('.slot[data-slot="5"] .s-thumb').disabled && document.querySelector('.slot[data-slot="5"] button[data-action="load"]').disabled)), '读档页第 2 页（5–8）：空存档位的缩略图与读档按钮均禁用');
await G(() => document.querySelector('.pager [data-action="prev"]').click()); await wait(150);
await shot('r3-load-page');
// 翻页：±10、页码输入、键盘
await tap('.pager [data-action="next10"]'); await wait(100);
ok((await pageNo()) === '11' && (await slots()) === '41,42,43,44', `«10 / 10»：跳到第 ${await pageNo()} 页（${await slots()}）`);
await tap('.pager [data-action="prev10"]'); await wait(100);
ok((await pageNo()) === '1', '«10 回到第 1 页');
await key('ArrowRight');
ok((await pageNo()) === '2', '→ 键下一页');
await key('PageDown');
ok((await pageNo()) === '3', 'PageDown 下一页');
await key('ArrowLeft'); await key('ArrowLeft');
await G(() => { const i = document.querySelector('.page-input'); i.value = '100'; i.dispatchEvent(new Event('change')); }); await wait(150);
ok((await pageNo()) === '100' && (await slots()) === '397,398,399,400' && (await G(() => document.querySelector('.pager [data-action="next"]').disabled && document.querySelector('.pager [data-action="next10"]').disabled)), `页码输入 100：第 100 页 = 存档 ${await slots()}，下一页禁用`);
// 第 100 页存档 → 读档
await key('KeyP');
ok((await title()) === '存档' && (await pageNo()) === '100', 'P 切回存档页，页码保持 100');
await G(() => { __game.hero.hp = 4000; __game.hero.atk = 400; });
await tap('.slot[data-slot="400"] .s-thumb'); await wait(250);
ok(JSON.parse(await raw('400'))?.hero.atk === 400, '存入第 400 号存档');
await key('KeyL');
await shot('r3-page-100');
await G(() => { __game.hero.hp = 1; __game.hero.atk = 1; });
await tap('.slot[data-slot="400"] .s-thumb'); await wait(500);
let s = await st();
ok(s.hero.atk === 400 && s.hero.hp === 4000 && !(await G(() => __modal.isOpen)), `读档页点击缩略图：读取存档 400（攻击 ${s.hero.atk}）并关闭`);
// 存储空间已满：友好提示，不破坏原存档
await G(() => {
  window.__realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (/zone1:(\d+|thumb:)/.test(k) && v.length > 50) throw new DOMException('quota', 'QuotaExceededError'); return window.__realSet.call(this, k, v); };
});
await key('KeyP');
await G(() => { const i = document.querySelector('.page-input'); i.value = '1'; i.dispatchEvent(new Event('change')); }); await wait(100);
await tap('.slot[data-slot="1"] .s-thumb'); await wait(200);
const fullMsg = await G(() => ({ t: document.querySelector('.save-msg').textContent, bad: document.querySelector('.save-msg').classList.contains('bad') }));
ok(fullMsg.bad && fullMsg.t.includes('空间已满') && JSON.parse(await raw('1')).hero.hp === 1111, `空间已满：${fullMsg.t}（原存档 1 未受影响）`);
await shot('r3-storage-full');
await G(() => { Storage.prototype.setItem = window.__realSet; });
// 缩略图写不下：舍弃最旧缩略图后仍保住存档
await key('Escape');
// 容量估算：后期存档大小
const big = await G(() => { const d = __game.serialize(); for (const f of Object.values(d.floors)) for (const row of f) for (const c of row) if (c.monster) delete c.monster; return JSON.stringify(d).length; });
console.log(`   （参考：未压缩完整存档约 ${(big / 1024).toFixed(0)} KB）`);
// 按钮入口
await tap('#btn-load'); await wait(250);
ok((await title()) === '读档', '侧栏「读档」按钮打开读档页');
await key('Escape');
await tap('#btn-save'); await wait(250);
ok((await title()) === '存档', '侧栏「存档」按钮打开存档页');
await key('Escape');
ok(await G(() => document.querySelector('.hint').textContent.includes('P 存档') && document.querySelector('.hint').textContent.includes('L 读档')), '操作提示：P 存档 · L 读档');

// ================================================================ 2. 剧情怪不自动清
await G(() => { Object.assign(__game.hero, { hp: 999999, atk: 99999, def: 99999 }); __game.flags.ambush3 = true; Object.assign(__autoOpts, { clear: true, pickup: false, hidden: false }); });
const runAuto = async () => { await G(() => __runAutoNow()); await wait(300); await settle(); };
const alive = (f, cells) => G((f, cells) => cells.every(([x, y]) => !!__game.cell({ x, y }, f).monster), f, cells);
const story = (f, cells) => G((f, cells) => cells.every(([x, y]) => __storyMonster({ x, y }, f)), f, cells);
const clearAt = (f, cells) => G((f, cells) => { for (const [x, y] of cells) Object.assign(__game.cell({ x, y }, f), { terrain: 'floor', door: undefined, item: undefined, monster: undefined, npc: undefined }); __game.touchMap(); }, f, cells);
async function guard(name, f, hero, cells, prep) {
  await tp(f, hero[0], hero[1]); await wait(200);
  if (prep) await G(prep);
  await G(() => __game.touchMap());
  const pre = await alive(f, cells);
  const marked = await story(f, cells);
  await runAuto();
  ok(pre && marked && (await alive(f, cells)), `${name}：${cells.length} 只剧情怪（${cells.map((c) => c.join(',')).join(' ')}）全部标记为剧情怪，自动清怪后仍在`);
}
// 控制组：普通怪仍会被自动清（1F 绿史莱姆）
await tp(1, 6, 0); await wait(200);
await runAuto();
ok(!(await cell(4, 0, 1)).monster, '对照：1F 普通的 0 伤害绿史莱姆照常被自动清掉');
// 14F：三只兽人武士（击败后出现隐藏红钥匙）
await clearAt(14, [[1, 0]]);
await guard('14F 隐藏红钥匙', 14, [1, 0], [[0, 0], [2, 0], [1, 1]]);
// 34F：两排 8 只（第二把隐藏红钥匙）——打开牢门让自动搜索能碰到它们
await clearAt(34, [[4, 4], [6, 4], [8, 4], [10, 4], [4, 6], [6, 6], [8, 6], [10, 6]]);
await guard('34F 隐藏红钥匙', 34, [5, 5], [[4, 3], [6, 3], [8, 3], [10, 3], [4, 7], [6, 7], [8, 7], [10, 7]]);
// 40F：骑士队长 + 小队（剧情登场前 / 登场后）
const squad40 = [[5, 0], [1, 1], [2, 1], [3, 1], [7, 1], [8, 1], [9, 1], [2, 3], [3, 3], [4, 3], [6, 3], [7, 3], [8, 3]];
await guard('40F 骑士队长剧情前', 40, [5, 4], squad40);
await guard('40F 骑士队长剧情已触发', 40, [5, 4], squad40, () => { __game.flags.knight40 = true; });
// 50F：魔王
await guard('50F 魔王', 50, [5, 5], [[5, 4]], () => { __game.flags.talked50 = true; Object.assign(__game.cell({ x: 5, y: 4 }, 50), { npc: undefined, monster: 'redKing' }); });
// 49F：魔王的白衣武士 / 魔法警卫（整层封印剧情）
await guard('49F 守卫与封印剧情', 49, [5, 7], [[4, 7], [6, 7]], () => { __game.flags.zeno49 = true; });
// 33F 机关、30F 史莱姆机关门、2F 守卫门、17F 守卫
await guard('33F 机关怪', 33, [9, 5], [[8, 4], [10, 4], [8, 6], [10, 6]], () => { __game.flags.trap33 = true; });
await guard('30F 机关门史莱姆', 30, [5, 4], [[2, 4], [3, 4], [4, 4], [6, 4], [7, 4], [8, 4]]);
await clearAt(2, [[6, 1]]);
await guard('2F 守卫门', 2, [6, 1], [[5, 1], [7, 1]]);
// 程序生成的排除表覆盖所有 h5 楼层事件怪
const table = await G(() => window.__h5EventMonsters);
{
  const miss = await G((t) => Object.entries(t).flatMap(([f, ks]) => ks.filter((k) => { const [x, y] = k.split(',').map(Number); return __game.cell({ x, y }, +f)?.monster && !__storyMonster({ x, y }, +f); }).map((k) => `${f}F ${k}`)), table);
  ok(!miss.length, `h5 事件怪表（${Object.values(table).flat().length} 格）全部被排除 ${miss.join(' ')}`);
}

// ================================================================ 3. 48F 白衣武士残影
await G(() => { __game.flags.variant48 = true; __game.flags.guard48 = undefined; Object.assign(__game.cell({ x: 0, y: 0 }, 48), { terrain: 'airwall', monster: undefined }); __game.cell({ x: 7, y: 7 }, 48).door = 'special'; });
await tp(48, 1, 1); await wait(300);
// 残影：(0,0) 不是空地、也不是普通怪物
const px = await G(() => { const t = __renderer.tileCenterCss({ x: 0, y: 0 }); const cv = document.getElementById('game'); const k = cv.width / cv.getBoundingClientRect().width; const d = cv.getContext('2d').getImageData(Math.round(t.x * k) - 20, Math.round(t.y * k) - 20, 40, 40).data; let blue = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > d[i] + 10) blue++; return blue; });
ok(px > 30 && !(await cell(0, 0)).monster && (await cell(0, 0)).terrain === 'airwall', `48F (0,0) 渲染为半透明残影（冷色像素 ${px}），不是普通怪物、不显示伤害`);
await G(() => { const c = document.getElementById('game'); c.style.transformOrigin = '0 0'; });
await shot('r3-48f-ghost');
await G(() => __runAutoNow()); await wait(300);
ok((await cell(0, 0)).terrain === 'airwall', '残影不会被自动功能触发');
await tp(48, 0, 1); await wait(300);
await key('ArrowUp'); await wait(600);
const dl = await G(() => ({ open: __dialog.isOpen, name: document.querySelector('#dialog .dlg-name').textContent, text: __dialog.full }));
ok(dl.open && dl.text.includes('你竟然能找到我') && (await cell(0, 0)).monster === 'whiteKing', `撞上残影：白衣武士现身并说「${dl.text}」`);
await wait(900);
await shot('r3-48f-ghost-dialog');
await settle();
ok(await G(() => __storyMonster({ x: 0, y: 0 }, 48)), '现身后的白衣武士被标记为剧情怪');
await G(() => __runAutoNow()); await wait(300); await settle();
ok((await cell(0, 0)).monster === 'whiteKing', '自动清怪不会打它（0 伤害也不打）');
await key('ArrowUp'); await settle();
ok(!(await cell(0, 0)).monster && !(await cell(7, 7)).door, '手动击败 → 圣剑房门打开（之后是普通可战斗怪物）');

console.log(errs.length ? errs : 'no page errors'); await browser.close(); console.log(fails ? `❌ ${fails} failed` : 'ALL PASS'); process.exit(fails ? 1 : 0);
