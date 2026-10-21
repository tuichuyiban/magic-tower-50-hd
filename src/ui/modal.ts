export interface ModalButton {
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 简单的 HTML 弹窗（通关提示、怪物手册、重开确认） */
export class Modal {
  private root: HTMLElement;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private actionsEl: HTMLElement;
  private onHide: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.titleEl = root.querySelector('.modal-title')!;
    this.bodyEl = root.querySelector('.modal-body')!;
    this.actionsEl = root.querySelector('.modal-actions')!;
    root.addEventListener('pointerdown', (e) => {
      if (e.target === root) this.hide();
    });
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  show(title: string, body: string | HTMLElement, buttons: ModalButton[], onHide?: () => void): void {
    this.fireHide();
    this.onHide = onHide ?? null;
    this.titleEl.textContent = title;
    this.bodyEl.replaceChildren();
    if (typeof body === 'string') this.bodyEl.innerHTML = body;
    else this.bodyEl.appendChild(body);
    this.actionsEl.replaceChildren(
      ...buttons.map((b) => {
        const el = document.createElement('button');
        el.className = `ui-btn${b.primary ? ' primary' : ''}`;
        el.textContent = b.label;
        el.addEventListener('click', () => {
          this.hide();
          b.onClick?.();
        });
        return el;
      }),
    );
    this.root.classList.remove('hidden');
    (this.actionsEl.querySelector('.primary') as HTMLElement | null)?.focus({ preventScroll: true });
    this.bodyEl.parentElement!.scrollTop = 0;
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.fireHide();
  }

  private fireHide(): void {
    const f = this.onHide;
    this.onHide = null;
    f?.();
  }
}
