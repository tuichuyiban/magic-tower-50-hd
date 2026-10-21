/**
 * NPC 对话框：与弹窗同一套金边蓝底风格，带头像（使用游戏内动态精灵的首帧）、打字机效果与选项。
 * 点击 / 空格 / 回车：文字未显示完时立即显示全部，显示完后继续。
 */
export class Dialog {
  private root: HTMLElement;
  private face: HTMLImageElement;
  private nameEl: HTMLElement;
  private textEl: HTMLElement;
  private choicesEl: HTMLElement;
  private moreEl: HTMLElement;
  private typing = 0;
  full = '';
  private onAdvance: (() => void) | null = null;
  /** 打字速度（毫秒 / 字），0 = 立即显示 */
  speed = 22;
  /** 打字时的回调（对话音效） */
  onType: ((i: number) => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.face = root.querySelector('.dlg-face')!;
    this.nameEl = root.querySelector('.dlg-name')!;
    this.textEl = root.querySelector('.dlg-text')!;
    this.choicesEl = root.querySelector('.dlg-choices')!;
    this.moreEl = root.querySelector('.dlg-more')!;
    // 金色高亮（primary）跟随当前选中 / 刚按下的选项：方向键移动、点击、商店连续购买时都不会停在第一个按钮上
    this.choicesEl.addEventListener('focusin', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (!b) return;
      for (const x of this.choicesEl.querySelectorAll('button')) x.classList.toggle('primary', x === b);
    });
    root.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      this.advance();
    });
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (this.choicesEl.childElementCount && this.textDone) {
          (document.activeElement as HTMLElement | null)?.click?.();
        } else this.advance();
        e.preventDefault();
        e.stopPropagation();
      } else if (this.choicesEl.childElementCount && this.textDone && /^(Arrow(Up|Down|Left|Right)|Key[WS])$/.test(e.code)) {
        const btns = [...this.choicesEl.querySelectorAll('button')] as HTMLButtonElement[];
        const i = btns.indexOf(document.activeElement as HTMLButtonElement);
        const d = e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'KeyW' ? -1 : 1;
        btns[(i + d + btns.length) % btns.length]?.focus();
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  private get textDone(): boolean {
    return this.textEl.textContent === this.full;
  }

  private open(name: string, face: string, text: string): void {
    this.root.classList.remove('hidden');
    this.nameEl.textContent = name;
    if (face) {
      this.face.src = face;
      this.face.style.visibility = 'visible';
    } else this.face.style.visibility = 'hidden';
    this.full = text;
    this.choicesEl.replaceChildren();
    this.moreEl.style.visibility = 'hidden';
    window.clearInterval(this.typing);
    if (!this.speed) {
      this.textEl.textContent = text;
      return;
    }
    let i = 0;
    this.textEl.textContent = '';
    this.typing = window.setInterval(() => {
      i += 1;
      this.textEl.textContent = text.slice(0, i);
      this.onType?.(i);
      if (i >= text.length) this.finishTyping();
    }, this.speed);
  }

  private finishTyping(): void {
    window.clearInterval(this.typing);
    this.textEl.textContent = this.full;
    this.onTyped?.();
  }

  private onTyped: (() => void) | null = null;

  private advance(): void {
    if (!this.textDone) return this.finishTyping();
    this.onAdvance?.();
  }

  close(): void {
    window.clearInterval(this.typing);
    this.root.classList.add('hidden');
    this.onAdvance = null;
    this.onTyped = null;
  }

  say(name: string, face: string, text: string): Promise<void> {
    return new Promise((resolve) => {
      this.onTyped = () => (this.moreEl.style.visibility = 'visible');
      this.open(name, face, text);
      if (this.textDone) this.onTyped();
      this.onAdvance = () => {
        this.close();
        resolve();
      };
    });
  }

  /**
   * 常驻商店：点选项后不关闭对话框，立即刷新文字 / 选项，并在按钮上闪一下（成交绿光 / 失败红色抖动），
   * 下方显示一行淡出的反馈文字；焦点留在刚点的按钮上，方便连点 / 连按回车加点。
   */
  shop(
    name: string,
    face: string,
    spec: { text: () => string; options: () => string[]; exit: number; buy: (i: number) => { ok: boolean; msg?: string } | 'close' },
    onResult?: (ok: boolean) => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      let fbTimer = 0;
      const feedback = (ok: boolean, msg?: string) => {
        let fb = this.root.querySelector<HTMLElement>('.dlg-feedback');
        if (!fb) {
          fb = document.createElement('div');
          fb.className = 'dlg-feedback';
          this.choicesEl.after(fb);
        }
        fb.textContent = msg ?? '';
        fb.classList.remove('ok', 'fail', 'show');
        void fb.offsetWidth; // 重新触发动画
        fb.classList.add(ok ? 'ok' : 'fail', 'show');
        window.clearTimeout(fbTimer);
        fbTimer = window.setTimeout(() => fb!.classList.remove('show'), 1400);
      };
      const render = (focus: number) => {
        const opts = spec.options();
        const btns = [...this.choicesEl.querySelectorAll('button')] as HTMLButtonElement[];
        if (btns.length === opts.length) {
          btns.forEach((b, i) => (b.textContent = opts[i]));
        } else {
          this.choicesEl.replaceChildren(
            ...opts.map((label, i) => {
              const b = document.createElement('button');
              b.className = `ui-btn${i === 0 ? ' primary' : ''}`;
              b.textContent = label;
              b.addEventListener('click', (e) => {
                e.stopPropagation();
                pick(i, b);
              });
              return b;
            }),
          );
        }
        (this.choicesEl.children[focus] as HTMLElement | undefined)?.focus({ preventScroll: true });
      };
      const done = () => {
        window.clearTimeout(fbTimer);
        this.root.querySelector('.dlg-feedback')?.remove();
        this.root.classList.remove('shop-mode');
        this.close();
        resolve();
      };
      const pick = (i: number, b: HTMLButtonElement) => {
        if (i === spec.exit) return done();
        const r = spec.buy(i);
        if (r === 'close') return done();
        b.classList.remove('buy-ok', 'buy-fail');
        void b.offsetWidth;
        b.classList.add(r.ok ? 'buy-ok' : 'buy-fail');
        feedback(r.ok, r.msg);
        onResult?.(r.ok);
        // 价格等文字立即刷新（不重新打字）；高亮 / 焦点留在刚按下的按钮
        this.full = spec.text();
        this.textEl.textContent = this.full;
        render(i);
        for (const x of this.choicesEl.querySelectorAll('button')) x.classList.toggle('primary', x === this.choicesEl.children[i]);
      };
      this.onTyped = () => render(0);
      this.open(name, face, spec.text());
      this.root.classList.add('shop-mode');
      if (this.textDone) render(0);
      this.onAdvance = null;
    });
  }

  choose(name: string, face: string, text: string, options: string[]): Promise<number> {
    return new Promise((resolve) => {
      const showChoices = () => {
        this.choicesEl.replaceChildren(
          ...options.map((label, i) => {
            const b = document.createElement('button');
            b.className = `ui-btn${i === 0 ? ' primary' : ''}`;
            b.textContent = label;
            b.addEventListener('click', (e) => {
              e.stopPropagation();
              this.close();
              resolve(i);
            });
            return b;
          }),
        );
        (this.choicesEl.firstElementChild as HTMLElement | null)?.focus({ preventScroll: true });
      };
      this.onTyped = showChoices;
      this.open(name, face, text);
      if (this.textDone) showChoices();
      this.onAdvance = null;
    });
  }
}
