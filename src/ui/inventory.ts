/**
 * 背包（道具栏）：通用道具注册表。
 *
 * 每个道具提供图标、名称、说明、数量与（可选的）使用方法；左侧面板的背包网格只显示数量 > 0 的道具。
 * 以后的道具（上下楼器 / 升降之翼、圣水、破墙镐、炸弹、十字架、幸运金币……）只需调用
 * inventory.register({...}) 即可接入：图标格、悬停 / 长按说明、点击使用、分页全部自动生效。
 *
 * 使用确认：会产生效果 / 消耗的道具（破墙镐、圣水、以后的炸弹、升降楼器、冰冻徽章……）在点击或快捷键使用时
 * 先弹出「是否使用「X」？」确认框。默认规则：有 use 且不是 permanent（查看类）的道具需要确认；
 * 可用 confirm: true / false 显式覆盖。怪物手册、备忘录、魔杖（自带传送确认）等打开自己界面的永久道具直接打开。
 */
type C = HTMLCanvasElement;

export interface InventoryItem {
  id: string;
  name: string;
  desc: string;
  /** 32×32 像素图标 */
  icon: () => C;
  /** 拥有数量；永久道具返回 1 / 0。0 表示未拥有（不显示） */
  count: () => number;
  /** 永久道具（不消耗）：格子里不显示数量 */
  permanent?: boolean;
  /** 当前是否可以使用（不可用时格子变暗，点击会给出 reason 提示） */
  usable?: () => boolean;
  /** 使用道具 */
  use?: () => void;
  /** 显示在说明里的快捷键 */
  hotkey?: string;
  /** 使用前是否弹出确认框；缺省 = 非永久（会消耗）的可用道具需要确认 */
  confirm?: boolean;
  /** 确认框里的一句话效果（缺省用 desc） */
  effect?: () => string;
}

/** 确认框的实现由界面层注入（main.ts 用 Modal 实现）；ok() 后才真正使用 */
export type ConfirmFn = (item: InventoryItem, ok: () => void) => void;

export const needsConfirm = (it: InventoryItem) => it.confirm ?? (!!it.use && !it.permanent);

export interface InventorySlot {
  item: InventoryItem;
  count: number;
  usable: boolean;
}

export class Inventory {
  private items: InventoryItem[] = [];
  /** 确认框；未设置时直接使用 */
  confirmer: ConfirmFn | null = null;

  register(item: InventoryItem): void {
    const i = this.items.findIndex((x) => x.id === item.id);
    if (i >= 0) this.items[i] = item;
    else this.items.push(item);
  }

  unregister(id: string): void {
    this.items = this.items.filter((x) => x.id !== id);
  }

  get(id: string): InventoryItem | undefined {
    return this.items.find((x) => x.id === id);
  }

  /** 当前拥有的道具（注册顺序） */
  owned(): InventorySlot[] {
    const out: InventorySlot[] = [];
    for (const item of this.items) {
      const count = item.count();
      if (count > 0) out.push({ item, count, usable: !!item.use && (item.usable?.() ?? true) });
    }
    return out;
  }

  /**
   * 使用道具（背包点击与快捷键共用）。需要确认的道具先弹出确认框；
   * 当前不可用（usable() 为 false）时不弹确认，直接交给 use() 给出原因提示。
   * 返回是否已执行 use 或已弹出确认框。
   */
  use(id: string): boolean {
    const it = this.get(id);
    if (!it?.use || it.count() <= 0) return false;
    const usable = it.usable?.() ?? true;
    if (usable && needsConfirm(it) && this.confirmer) {
      const run = it.use;
      this.confirmer(it, () => { if (it.count() > 0) run(); });
      return true;
    }
    it.use();
    return true;
  }
}
