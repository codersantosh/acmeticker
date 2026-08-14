import { directLiChildren } from '../dom.js';
import type { TickerHost } from '../types.js';
import type { TickerEngine } from './index.js';

export class TypewriterEngine implements TickerEngine {
  private readonly host: TickerHost;
  private intervalID: number | null = null;
  private timeoutID: number | null = null;
  private typeEl: HTMLElement | null = null;
  private wrapEl: Element | null = null;
  private allText = '';
  private count = 0;
  private stepCount = 0;
  private completedCycles = 0;

  constructor(host: TickerHost) {
    this.host = host;
  }

  init(): void {
    this.start();
  }

  prev(): void {
    if (this.host.paused) {
      return;
    }
    this.navigate('prev');
  }

  next(): void {
    if (this.host.paused) {
      return;
    }
    this.navigate('next');
  }

  pause(): void {
    this.clearInterval();
    this.clearTimeout();
  }

  resume(): void {
    if (this.intervalID !== null) {
      return;
    }
    if (this.typeEl === null) {
      this.start();
      return;
    }
    this.arm();
  }

  destroy(): void {
    this.clearInterval();
    this.clearTimeout();
    for (const li of directLiChildren(this.host.element)) {
      li.style.display = '';
      li.style.opacity = '';
      const dataText = li.getAttribute('data-text');
      if (dataText) {
        const wrapEl = li.firstElementChild;
        if (wrapEl) {
          wrapEl.textContent = dataText;
        }
      }
      li.removeAttribute('data-text');
    }
  }

  private start(): void {
    if (this.host.paused) {
      return;
    }
    const lis = directLiChildren(this.host.element);
    const typeEl = lis[0];
    if (!typeEl) {
      return;
    }
    const wrapEl = typeEl.firstElementChild;
    const dataText = typeEl.getAttribute('data-text');
    if (dataText && wrapEl) {
      wrapEl.textContent = dataText;
    }
    this.allText = (wrapEl ?? typeEl).textContent ?? '';
    for (const li of lis) {
      li.style.opacity = '0';
      li.style.display = 'none';
    }
    this.typeEl = typeEl;
    this.wrapEl = wrapEl;
    this.count = 0;
    this.arm();
  }

  private navigate(mode: 'prev' | 'next'): void {
    this.clearInterval();
    this.clearTimeout();
    this.stepCount = 0;
    const ul = this.host.element;
    const lis = directLiChildren(ul);
    if (mode === 'prev') {
      const last = lis[lis.length - 1];
      if (last) {
        ul.prepend(last);
      }
    } else {
      const first = lis[0];
      if (first) {
        ul.appendChild(first);
      }
    }
    this.start();
  }

  private arm(): void {
    if (this.intervalID !== null) {
      return;
    }
    const delay = Math.max(1, this.host.options.speed);
    this.intervalID = setInterval(() => this.type(), delay);
  }

  private clearInterval(): void {
    if (this.intervalID !== null) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }

  private clearTimeout(): void {
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }

  private type(): void {
    const typeEl = this.typeEl;
    if (!typeEl) {
      this.clearInterval();
      return;
    }
    this.count++;
    const typeText = this.allText.substring(0, this.count);
    if (!typeEl.getAttribute('data-text')) {
      typeEl.setAttribute('data-text', this.allText);
    }
    if (this.count <= this.allText.length) {
      if (this.wrapEl) {
        this.wrapEl.textContent = typeText;
      }
      typeEl.style.opacity = '1';
      typeEl.style.display = 'block';
    } else {
      this.clearInterval();
      this.timeoutID = setTimeout(
        () => this.tNext(),
        Math.max(1, this.host.options.autoplay),
      );
    }
  }

  private tNext(): void {
    const ul = this.host.element;
    const first = directLiChildren(ul)[0];
    if (first) {
      ul.appendChild(first);
    }
    this.clearTimeout();
    const itemCount = directLiChildren(ul).length;
    if (itemCount > 0) {
      this.stepCount++;
      if (this.stepCount >= itemCount) {
        this.completedCycles++;
        this.stepCount = 0;
        this.host.emitCycle(this.completedCycles);
      }
    }
    this.start();
  }
}
