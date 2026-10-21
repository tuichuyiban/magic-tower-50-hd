import { FLOORS } from '../game/floors';
import { parseFloor } from '../game/floors/legend';
import type { SaveData } from '../game/state';
import type { Cell } from '../game/types';

const BASE = 'mota-hd-zone1:'; // 沿用第一区的前缀，旧存档继续可用
let ns = '';
/** 存档命名空间：试玩模式使用 'test:'，与正式存档互不覆盖（设置项不受影响） */
export function setSlotNamespace(n: string): void {
  ns = n;
}
const slotKey = (s: string) => BASE + ns + s;
const PREFIX = BASE;
/** 存档页：每页 4 格（2×2），共 100 页 = 400 个手动存档；自动存档单独显示在读档页顶部 */
export const PAGE_SIZE = 4;
export const PAGES = 100;
export type Slot = string;
export const SLOTS: Slot[] = Array.from({ length: PAGE_SIZE * PAGES }, (_, i) => String(i + 1));
export const pageSlots = (page: number): Slot[] => SLOTS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
/** 某个存档位所在的页（0 起） */
export const pageOf = (s: Slot): number => (s === 'auto' ? 0 : Math.floor((Number(s) - 1) / PAGE_SIZE));

export function slotName(s: Slot): string {
  return s === 'auto' ? '自动存档' : `存档 ${s}`;
}

/* ---- 紧凑存储：楼层只保存与初始地图不同的格子（v3），整份存档约 2–6 KB；v2（完整楼层）照常读取并在启动时迁移 ---- */
type Packed = Omit<SaveData, 'floors' | 'v'> & { v: 3; fd: Record<number, [number, Cell][]> };
const initial = new Map<number, string[]>();
function initialCells(id: number): string[] | null {
  if (!FLOORS[id]) return null;
  if (!initial.has(id)) initial.set(id, parseFloor(FLOORS[id]).flat().map((c) => JSON.stringify(c)));
  return initial.get(id)!;
}
export function pack(d: SaveData): Packed {
  const { floors, v: _v, ...rest } = d;
  const fd: Packed['fd'] = {};
  for (const [k, grid] of Object.entries(floors)) {
    const id = Number(k);
    const base = initialCells(id);
    const flat = grid.flat();
    const diff: [number, Cell][] = [];
    flat.forEach((c, i) => { if (!base || JSON.stringify(c) !== base[i]) diff.push([i, c]); });
    if (diff.length || !base) fd[id] = base ? diff : flat.map((c, i) => [i, c] as [number, Cell]);
  }
  return { ...rest, v: 3, fd };
}
export function unpack(p: Packed): SaveData {
  const { fd, v: _v, ...rest } = p;
  const floors: SaveData['floors'] = {};
  for (const id of Object.keys(FLOORS).map(Number)) {
    const grid = parseFloor(FLOORS[id]);
    for (const [i, c] of fd[id] ?? []) grid[Math.floor(i / grid.length)][i % grid.length] = c;
    floors[id] = grid;
  }
  return { ...rest, v: 2, floors } as SaveData;
}
function decode(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as SaveData | Packed;
    if (d?.v === 3) return unpack(d as Packed);
    return d && d.v === 2 ? (d as SaveData) : null;
  } catch {
    return null;
  }
}

export function readSlot(s: Slot): SaveData | null {
  try {
    return decode(localStorage.getItem(slotKey(s)));
  } catch {
    return null;
  }
}

/** 只读存档的概要（页面列表用：不展开楼层） */
export function slotInfo(s: Slot): Pick<SaveData, 'floorId' | 'hero' | 'time'> | null {
  try {
    const raw = localStorage.getItem(slotKey(s));
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData | Packed;
    return d && (d.v === 2 || d.v === 3) ? { floorId: d.floorId, hero: d.hero, time: d.time } : null;
  } catch {
    return null;
  }
}

/** 缩略图单独存放（便于存储空间不足时舍弃缩略图仍保住存档） */
export function readThumb(s: Slot): string | null {
  try {
    return localStorage.getItem(slotKey('thumb:' + s));
  } catch {
    return null;
  }
}

function trySet(k: string, v: string): boolean {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}

/** 空间不足时腾地方：从最旧的存档开始舍弃缩略图（存档本身绝不删除） */
function dropOldestThumb(except: Slot): boolean {
  const pre = slotKey('thumb:');
  let best: { k: string; t: number } | null = null;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (!k.startsWith(pre)) continue;
    const s = k.slice(pre.length);
    if (s === except) continue;
    const t = slotInfo(s)?.time ?? 0;
    if (!best || t < best.t) best = { k, t };
  }
  if (!best) return false;
  localStorage.removeItem(best.k);
  return true;
}

/** 写入存档；返回 'ok' | 'nothumb'（空间不足，缩略图被舍弃）| 'fail'（空间已满，未写入，原存档不受影响） */
export function writeSlot(s: Slot, d: SaveData, thumb?: string): 'ok' | 'nothumb' | 'fail' {
  const data = JSON.stringify(pack(d));
  // 先去掉本格旧缩略图，再写存档；不够就依次舍弃最旧存档的缩略图
  const oldThumb = readThumb(s);
  localStorage.removeItem(slotKey('thumb:' + s));
  let saved = trySet(slotKey(s), data);
  for (let n = 0; !saved && n < 40 && dropOldestThumb(s); n++) saved = trySet(slotKey(s), data);
  if (!saved) {
    if (oldThumb) trySet(slotKey('thumb:' + s), oldThumb);
    return 'fail';
  }
  if (thumb === undefined) return 'ok';
  if (trySet(slotKey('thumb:' + s), thumb)) return 'ok';
  return 'nothumb';
}

export function deleteSlot(s: Slot): void {
  localStorage.removeItem(slotKey(s));
  localStorage.removeItem(slotKey('thumb:' + s));
}

/**
 * 旧存档迁移（启动时执行一次，正式 / 试玩两个命名空间都处理）：
 * 完整楼层（v2）→ 紧凑格式（v3）；PNG / JPEG 缩略图 → 小尺寸 WebP。存档位编号不变（旧的 1–23 号位仍是 1–23 号位）。
 */
export function migrateSaves(): number {
  let n = 0;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)!);
  for (const k of keys) {
    if (!k.startsWith(BASE) || k.includes('setting:')) continue;
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    if (k.includes('thumb:')) {
      if (!raw.startsWith('data:image/webp')) reencodeThumb(k, raw);
      continue;
    }
    try {
      const d = JSON.parse(raw) as SaveData;
      if (d?.v !== 2) continue;
      if (trySet(k, JSON.stringify(pack(d)))) n++;
    } catch {
      /* 损坏的存档保持原样 */
    }
  }
  return n;
}
export const THUMB_SIZE = 128;
function reencodeThumb(k: string, url: string): void {
  if (typeof Image === 'undefined') return;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = THUMB_SIZE;
    const c = cv.getContext('2d')!;
    c.imageSmoothingQuality = 'high';
    c.drawImage(img, 0, 0, THUMB_SIZE, THUMB_SIZE);
    const w = cv.toDataURL('image/webp', 0.6);
    if (w.startsWith('data:image/webp') && w.length < url.length) trySet(k, w);
  };
  img.src = url;
}

export function loadSetting(key: string, def: boolean): boolean {
  const v = localStorage.getItem(PREFIX + 'setting:' + key);
  return v === null ? def : v === '1';
}

export function saveSetting(key: string, v: boolean): void {
  localStorage.setItem(PREFIX + 'setting:' + key, v ? '1' : '0');
}

export function loadValue(key: string, def: string): string {
  return localStorage.getItem(PREFIX + 'setting:' + key) ?? def;
}

export function saveValue(key: string, v: string): void {
  localStorage.setItem(PREFIX + 'setting:' + key, v);
}

/** 本作在 localStorage 中占用的大致字节数（UTF-16 → 每字符 2 字节） */
export function storageUsage(): number {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(PREFIX)) n += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
  }
  return n;
}
