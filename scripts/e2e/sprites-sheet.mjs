// 生成法师 / 巫师 / 老人精灵对照图 shots/fix-wizard-sprites.png（4 帧待机动画逐帧排开）
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR ' + e.message));
await page.setViewport({ width: 1100, height: 640 });
await page.goto('http://localhost:4173/?new', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const S = __renderer.sprites;
  const cv = document.createElement('canvas'); cv.width = 1100; cv.height = 640;
  Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, zIndex: 9999, background: '#f6eedd' });
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#f6eedd'; ctx.fillRect(0, 0, 1100, 640);
  const list = [['老人（NPC）', S.npc.oldman], ['初级法师 · 1–10F（新）', S.monster.bluePriest], ['高级法师 · 11–20F（新）', S.monster.redPriest], ['大法师 · 25F（新）', S.monster.blackMagician], ['初级巫师 · 41F+', S.monster.brownWizard], ['高级巫师 · 41F+', S.monster.redWizard]];
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#2a1b3d';
  list.forEach(([n, a], i) => { a.frames.forEach((f, k) => ctx.drawImage(f, 20 + k * 130, 20 + i * 100, 96, 96)); });
  list.forEach(([n], i) => ctx.fillText(n, 560, 75 + i * 100));
  document.body.appendChild(cv);
});
await page.screenshot({ path: '/workspace/magic-tower/shots/fix-wizard-sprites.png' });
await browser.close();
