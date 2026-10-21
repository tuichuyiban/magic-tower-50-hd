// 本轮：道具使用确认（查看类直接打开）、分区背景音乐 + 紧张曲覆盖 + 试听、地图道具数值标签
import puppeteer from 'puppeteer-core';
const OUT = '/workspace/magic-tower/shots';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, msg) => { console.log((c ? '✅ ' : '❌ ') + msg); if (!c) fails++; };
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = async (name) => { await wait(250); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('   📸', `${OUT}/${name}.png`); };
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
await page.goto('http://localhost:4173/?new&hover', { waitUntil: 'networkidle0' });
await page.evaluate(() => { localStorage.clear(); for (const k of ['autoClear', 'autoPickup', 'autoHidden']) localStorage.setItem('mota-hd-zone1:setting:' + k, '0'); });
await page.reload({ waitUntil: 'networkidle0' });
await wait(500);
const tileXY = (x, y) => G((x, y) => { const r = document.getElementById('game').getBoundingClientRect(); const t = __renderer.tileCenterCss({ x, y }); return { x: r.left + t.x, y: r.top + t.y }; }, x, y);
// 手势解锁音频
let p = await tileXY(5, 10); await page.mouse.click(p.x, p.y); await wait(300);
await G(() => __dialog.isOpen && document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
for (let i = 0; i < 30 && (await G(() => __dialog.isOpen || __director.busy)); i++) { await G(() => __dialog.isOpen && document.querySelector('#dialog .dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(150); }

/* ---------- 1. 查看类道具直接打开、消耗型道具弹确认 ---------- */
await G(() => { __game.hero.tools.book = true; __game.hero.tools.notebook = true; });
await G(() => __inventory.use('book')); await wait(250);
let m = await G(() => ({ open: __modal.isOpen, confirm: !!document.querySelector('#overlay .use-confirm'), title: document.querySelector('#overlay .modal-title').textContent }));
ok(m.open && !m.confirm && m.title.includes('怪物手册'), `怪物手册：直接打开「${m.title}」，无确认框`);
await page.keyboard.press('Escape'); await wait(200);
await G(() => __inventory.use('notebook')); await wait(250);
m = await G(() => ({ open: __modal.isOpen, confirm: !!document.querySelector('#overlay .use-confirm'), title: document.querySelector('#overlay .modal-title').textContent }));
ok(m.open && !m.confirm && m.title.includes('备忘录'), `备忘录：直接打开「${m.title}」，无确认框`);
await page.keyboard.press('Escape'); await wait(200);
await G(() => { __game.hero.tools.fly = true; __game.changeFloor(1, { x: 1, y: 0 }); });
await G(() => __inventory.use('fly')); await wait(250);
m = await G(() => ({ open: __modal.isOpen, confirm: !!document.querySelector('#overlay .use-confirm'), fly: !!document.querySelector('#overlay .flyer') }));
ok(m.open && !m.confirm && m.fly, '魔杖：直接打开楼层传送器（其自身有「传送」确认），无额外确认框');
await page.keyboard.press('Escape'); await wait(200);
const flags = await G(() => ['fly', 'book', 'notebook', 'pickaxe', 'superPotion', 'cross'].map((id) => { const it = __inventory.get(id); return `${id}:${(it.confirm ?? (!!it.use && !it.permanent)) ? '确认' : '直接'}`; }));
ok(flags.join(' ') === 'fly:直接 book:直接 notebook:直接 pickaxe:确认 superPotion:确认 cross:直接', `注册表默认规则：${flags.join(' ')}`);
// 圣水：Esc 取消 → 无变化；Enter 确认 → 生效；回退恢复
await G(() => { __game.hero.bag.superPotion = 1; });
let hp0 = await G(() => __game.hero.hp);
await G(() => __inventory.use('superPotion')); await wait(250);
ok(await G(() => !!document.querySelector('#overlay:not(.hidden) .use-confirm canvas.use-icon')), '确认框带道具图标');
await page.keyboard.press('Escape'); await wait(200);
ok((await G(() => __game.hero.hp)) === hp0 && (await G(() => __game.hero.bag.superPotion)) === 1, 'Esc 取消：生命不变、圣水仍在');
await G(() => __inventory.use('superPotion')); await wait(250);
await page.keyboard.press('Enter'); await wait(300);
const heal = await G(() => Math.round(0.74 * (__game.hero.atk + __game.hero.def)) * 10);
ok((await G(() => __game.hero.hp)) === hp0 + heal && (await G(() => __game.hero.bag.superPotion)) === 0, `Enter 确认：生命 +${heal}，圣水消耗`);
await page.keyboard.press('KeyZ'); await wait(300);
ok((await G(() => __game.hero.hp)) === hp0 && (await G(() => __game.hero.bag.superPotion)) === 1, '回退：生命与圣水恢复');
await G(() => { __game.hero.bag.superPotion = 0; });

/* ---------- 2. 分区音乐 ---------- */
const au = () => G(() => ({ t: __audio.track, w: __audio.wanted, v: __audio.voices, e: __audio.errors, s: __audio.state }));
let a = await au();
ok(a.s === 'running' && a.t === 'tower', `第一区：${a.t}（AudioContext ${a.s}）`);
const map = await G(() => [1, 10, 11, 20, 21, 30, 31, 40, 41, 50].map((f) => `${f}F→${__values.trackForFloor(f)}`).join(' '));
ok(map === '1F→tower 10F→tower 11F→mystery 20F→mystery 21F→gloom 30F→gloom 31F→march 40F→march 41F→still 50F→still', `楼层→曲目：${map}`);
await G(() => __game.changeFloor(11, 'fromBelow')); await wait(200);
a = await au();
ok(a.t === 'mystery' && a.v === 2, `换到 11F：${a.t}，交叉淡变中同时 ${a.v} 首`);
await wait(3500);
a = await au();
ok(a.t === 'mystery' && a.v === 1, `淡变结束：只剩 ${a.t}（${a.v} 首）`);
// 头目战覆盖
await G(() => { __game.changeFloor(20, 'fromBelow'); __game.flags.vampire20 = true; }); await wait(400);
a = await au();
ok(a.t === 'tension', `20F 吸血鬼战：紧张曲覆盖（${a.t}）`);
await G(() => { __game.flags.vampireDefeated = true; }); await wait(400);
a = await au();
ok(a.t === 'mystery', `战斗结束：淡回区域曲（${a.t}）`);
await G(() => { __game.flags.vampire20 = false; __game.flags.vampireDefeated = false; __game.changeFloor(1, { x: 1, y: 0 }); }); await wait(300);
ok((await au()).t === 'tower', '回到 1F：塔中主题');
// 试听（设置）
await page.keyboard.press('KeyO'); await wait(300);
const opts = await G(() => [...document.querySelectorAll('#bgm-preview option')].map((o) => o.value).join(','));
ok(opts === ',tower,mystery,gloom,march,still,tension,princess,knight,zeno,lastfight,void,cellar,ending', `设置 · 试听选项：${opts}`);
for (const v of ['march', 'still', 'gloom']) {
  await page.select('#bgm-preview', v); await wait(700);
  a = await au();
  ok(a.t === v && a.w === 'tower', `试听 ${v}：正在播放 ${a.t}（游戏曲目仍为 ${a.w}）`);
}
await shot('32-settings-bgm-preview');
await page.keyboard.press('Escape'); await wait(400);
ok((await au()).t === 'tower', '关闭设置：恢复当前楼层曲目');
a = await au();
ok(a.e === 0, `音频错误 ${a.e}`);

/* ---------- 3. 道具数值标签 ---------- */
const vals = await G(() => { const V = __values; const r = []; for (const f of [1, 11, 21, 31, 41]) { const k = V.ratioForFloor(f); r.push(`${f}F×${k}: 红宝石+${V.itemValue('redGem', k).v} 蓝宝石+${V.itemValue('blueGem', k).v} 红血瓶+${V.itemValue('redPotion', k).v} 蓝血瓶+${V.itemValue('bluePotion', k).v}`); } return r; });
console.log('   ' + vals.join('\n   '));
ok(vals[0].includes('红宝石+1 蓝宝石+1 红血瓶+50 蓝血瓶+200') && vals[1].includes('红宝石+2 蓝宝石+2 红血瓶+100 蓝血瓶+400') && vals[2].includes('红宝石+3 蓝宝石+3 红血瓶+150 蓝血瓶+600'), '各区数值 = 基础值 × ratio（1 / 2 / 3 / 4 / 5）');
ok((await G(() => __values.itemValue('ironSword', 1).v === 10 && __values.itemValue('silverShield', 2).v === 20)), '装备为固定值：铁剑 +10、银盾 +20');
// 在 1F 放几个道具并比较标签像素
await G(() => { __game.changeFloor(1, { x: 1, y: 0 }); for (const [x, y, item] of [[3, 0, 'redGem'], [4, 0, 'blueGem'], [5, 0, 'redPotion'], [6, 0, 'bluePotion'], [7, 0, 'ironSword']]) __game.setCell({ x, y }, { terrain: 'floor', item, monster: undefined, door: undefined, npc: undefined }); });
await wait(300);
const colorCount = (x, y, rgb) => G((x, y, rgb) => {
  const c = document.getElementById('game'); const ctx = c.getContext('2d'); const T = __renderer.T; const X = __renderer.mapX + x * T; const Y = __renderer.mapY + y * T;
  const d = ctx.getImageData(Math.round(X), Math.round(Y + T * 0.7), Math.round(T * 0.6), Math.round(T * 0.3)).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - rgb[0]) < 30 && Math.abs(d[i + 1] - rgb[1]) < 30 && Math.abs(d[i + 2] - rgb[2]) < 30) n++;
  return n;
}, x, y, rgb);
const RED = [0xff, 0x6f, 0x7d], BLUE = [0x6c, 0xc0, 0xff], GREEN = [0x7d, 0xff, 0xa6];
const on = { r: await colorCount(3, 0, RED), b: await colorCount(4, 0, BLUE), h: await colorCount(5, 0, GREEN), H: await colorCount(6, 0, GREEN), s: await colorCount(7, 0, RED) };
ok(on.r > 20 && on.b > 20 && on.h > 20 && on.H > 20 && on.s > 20, `标签着色像素：攻击红 ${on.r} / 防御蓝 ${on.b} / 生命绿 ${on.h}、${on.H} / 铁剑红 ${on.s}`);
await page.mouse.move(5, 5);
p = await tileXY(5, 0); await page.mouse.move(p.x, p.y); await wait(300);
await shot('33-item-value-labels');
ok(await G(() => __renderer.hover?.x === 5 && __renderer.hover?.y === 0), '鼠标悬停道具：显示名称与效果浮窗（截图）');
// 关闭设置项
await page.keyboard.press('KeyO'); await wait(300);
await G(() => { const i = document.querySelector('[data-toggle="itemValues"]'); i.click(); });
await page.keyboard.press('Escape'); await wait(300);
const off = { r: await colorCount(3, 0, RED), b: await colorCount(4, 0, BLUE), h: await colorCount(5, 0, GREEN) };
ok(off.r < on.r / 4 && off.b < on.b / 4 && off.h < on.h / 4 && (await G(() => localStorage.getItem('mota-hd-zone1:setting:itemValues'))) === '0', `关闭「显示道具数值」：标签消失（${off.r}/${off.b}/${off.h}），设置已保存`);
await page.keyboard.press('KeyO'); await wait(300);
await G(() => document.querySelector('[data-toggle="itemValues"]').click());
await page.keyboard.press('Escape'); await wait(200);
// 拾取提示用同一套数值：11F 的红宝石 +2
await G(() => { __game.changeFloor(11, { x: 5, y: 9 }); __game.setCell({ x: 6, y: 9 }, { terrain: 'floor', item: 'redGem', monster: undefined, door: undefined }); });
const atk0 = await G(() => __game.hero.atk);
await page.keyboard.press('ArrowRight'); await wait(400);
const log = await G(() => __game.log.slice(-3).map((l) => l.text).join(' | '));
ok((await G(() => __game.hero.atk)) === atk0 + 2 && log.includes('攻击 +2'), `11F 拾取红宝石：攻击 +2（${log.slice(-30)}）`);
ok(errs.length === 0, `页面无报错 ${errs.join(' ; ').slice(0, 200)}`);
await browser.close();
console.log(fails ? `\n❌ ${fails} 项失败` : '\n✅ 本轮检查全部通过');
process.exit(fails ? 1 : 0);
