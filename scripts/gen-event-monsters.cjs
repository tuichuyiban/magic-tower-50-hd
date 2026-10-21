// 从 h5 51 号塔原始楼层数据（docs/h5-51-source/floors/MT*.js）生成「带事件的怪物格」表：
// events / afterBattle / beforeBattle 的键，以及所有事件（含 function 代码）里引用的坐标上的初始怪物。
// 输出 src/game/h5EventMonsters.ts（坐标已换成本作 11×11 内部坐标）。用法：node scripts/gen-event-monsters.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'docs/h5-51-source/floors/');
const maps = fs.readFileSync(path.join(root, 'docs/h5-51-source/maps.js'), 'utf8');
const enemy = {};
for (const m of maps.matchAll(/"(\d+)":\s*\{"cls":"enemys","id":"(\w+)"/g)) enemy[m[1]] = m[2];
const main = { floors: {} };
for (const f of fs.readdirSync(dir)) {
  if (!/^MT\d+\.js$/.test(f)) continue;
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(dir + f, 'utf8'));
}
const out = {};
for (const [id, fl] of Object.entries(main.floors)) {
  const n = Number(id.slice(2));
  const keys = (o) => Object.keys(o || {}).filter((k) => JSON.stringify(o[k]) !== '[]');
  const tagged = new Set([...keys(fl.events), ...keys(fl.afterBattle), ...keys(fl.beforeBattle)]);
  const all = JSON.stringify([fl.events, fl.afterBattle, fl.beforeBattle, fl.firstArrive, fl.eachArrive, fl.autoEvent, fl.afterOpenDoor, fl.afterGetItem, fl.parallelDo]);
  for (const m of all.matchAll(/\[\s*(\d+)\s*,\s*(\d+)\s*\]/g)) tagged.add(`${m[1]},${m[2]}`);
  const cells = [];
  fl.map.forEach((row, y) => row.forEach((v, x) => {
    if (enemy[v] && tagged.has(`${x},${y}`)) cells.push(`${x - 1},${y - 1}`);
  }));
  if (cells.length) out[n] = cells;
}
const body = Object.entries(out).map(([n, c]) => `  ${n}: [${c.map((k) => `'${k}'`).join(', ')}],`).join('\n');
fs.writeFileSync(path.join(root, 'src/game/h5EventMonsters.ts'),
`// 由 scripts/gen-event-monsters.cjs 从 h5 51 号塔 floors/MT*.js 自动生成，请勿手改。
// 每层「带事件的怪物格」（本作坐标 x,y）：events / afterBattle / beforeBattle 的键，以及事件代码里引用到的初始怪物格。
export const H5_EVENT_MONSTERS: Record<number, string[]> = {
${body}
};
`);
console.log('floors', Object.keys(out).length, 'cells', Object.values(out).flat().length);
