import { cancelFrame, directLiChildren, outerHeight, outerWidth, requestFrame } from '../dom.js';
import type { TickerHost } from '../types.js';
import type { TickerEngine } from './index.js';

const SWING = (progress: number): number => 0.5 - Math.cos(progress * Math.PI) / 2;

type StyleProp = 'marginTop' | 'left' | 'right';

export class VerticalHorizontalEngine implements TickerEngine {
  private readonly host: TickerHost;
  private readonly horizontal: boolean;
  private intervalID: number | null = null;
  private rafID: number | null = null;
  private stepCount = 0;
  private completedCycles = 0;
  private animEl: HTMLElement | null = null;
  private animFrom = 0;
  private animRest = 0;
  private animDuration = 0;
  private animElapsed = 0;
  private animStartTs: number | null = null;
  private animLastProgress = 0;

  constructor(host: TickerHost) {
    this.host = host;
    this.horizontal = host.options.type === 'horizontal';
  }

  init(): void {
    this.settle();
    if (!this.host.paused) {
      this.arm();
    }
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
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
      this.animElapsed = this.animLastProgress * this.animDuration;
    }
    this.clearInterval();
  }

  resume(): void {
    if (this.rafID !== null) {
      return;
    }
    if (this.animEl !== null && this.animElapsed < this.animDuration) {
      this.animStartTs = null;
      this.rafID = requestFrame(this.frame);
      return;
    }
    if (this.intervalID === null) {
      this.arm();
    }
  }

  destroy(): void {
    this.clearInterval();
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    this.clearAnimState();
    for (const li of directLiChildren(this.host.element)) {
      li.style.display = '';
      li.style.opacity = '';
      li.style.position = '';
      li.style.marginTop = '';
      li.style.left = '';
      li.style.right = '';
      li.style.whiteSpace = '';
      li.style.maxWidth = '';
    }
  }

  private arm(): void {
    if (this.intervalID !== null) {
      return;
    }
    const delay = Math.max(1, this.host.options.autoplay);
    this.intervalID = setInterval(() => this.tick(), delay);
  }

  private clearInterval(): void {
    if (this.intervalID !== null) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }

  private tick(): void {
    if (this.host.paused) {
      this.clearInterval();
      return;
    }
    if (this.rafID !== null) {
      return;
    }
    const lis = directLiChildren(this.host.element);
    const first = lis[0];
    if (!first) {
      return;
    }
    this.rotate('next');
    const animated = directLiChildren(this.host.element)[0];
    if (!animated) {
      return;
    }
    this.animate(animated);
  }

  private navigate(mode: 'prev' | 'next'): void {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    this.clearAnimState();
    this.stepCount = 0;
    this.rotate(mode);
    this.settle();
    this.clearInterval();
    this.arm();
  }

  private rotate(mode: 'prev' | 'next'): void {
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
  }

  private settle(): void {
    const ul = this.host.element;
    const styleProp = this.styleProp();
    for (const li of directLiChildren(ul)) {
      li.style.opacity = '0';
      li.style.display = 'none';
      li.style.marginTop = '';
      li.style.left = '';
      li.style.right = '';
      this.applySingleLine(li);
    }
    const first = directLiChildren(ul)[0];
    if (first) {
      first.style.opacity = '1';
      first.style.position = 'absolute';
      first.style.display = 'block';
      first.style[styleProp] = '0px';
    }
  }

  private applySingleLine(li: HTMLElement): void {
    if (!this.horizontal) {
      li.style.whiteSpace = '';
      li.style.maxWidth = '';
      return;
    }
    li.style.whiteSpace = 'nowrap';
    li.style.maxWidth = 'none';
  }

  private styleProp(): StyleProp {
    if (this.horizontal) {
      return this.host.rtl ? 'right' : 'left';
    }
    return 'marginTop';
  }

  private visibleHeight(): number {
    const box = this.host.wrap.parentElement;
    if (!box) return 0;
    const cs = getComputedStyle(box);
    return box.clientHeight - (Number.parseFloat(cs.paddingTop) || 0) - (Number.parseFloat(cs.paddingBottom) || 0);
  }

  private visibleWidth(): number {
    const box = this.host.wrap.parentElement;
    if (!box) return 0;
    const cs = getComputedStyle(box);
    return box.clientWidth - (Number.parseFloat(cs.paddingLeft) || 0) - (Number.parseFloat(cs.paddingRight) || 0);
  }

  private animate(el: HTMLElement): void {
    const styleProp = this.styleProp();
    const negative =
      this.host.options.direction === 'up' || this.host.options.direction === 'right';
    el.style.display = 'block';
    el.style.position = 'absolute';
    const travel = this.horizontal
      ? negative
        ? outerWidth(el)
        : Math.max(outerWidth(el), this.visibleWidth())
      : Math.max(outerHeight(el), this.visibleHeight());
    const from = negative ? -travel : travel;
    const rest = 0;

    for (const li of directLiChildren(this.host.element)) {
      li.style.opacity = '0';
      li.style.display = 'none';
      li.style.marginTop = '';
      li.style.left = '';
      li.style.right = '';
      this.applySingleLine(li);
    }
    el.style.opacity = '1';
    el.style.position = 'absolute';
    el.style.display = 'block';
    el.style[styleProp] = `${from}px`;

    const duration = this.host.options.speed;
    if (!(duration > 0)) {
      el.style[styleProp] = `${rest}px`;
      this.complete();
      return;
    }

    this.animEl = el;
    this.animFrom = from;
    this.animRest = rest;
    this.animDuration = duration;
    this.animElapsed = 0;
    this.animLastProgress = 0;
    this.animStartTs = null;
    this.rafID = requestFrame(this.frame);
  }

  private readonly frame = (ts: number): void => {
    const el = this.animEl;
    if (el === null) {
      this.rafID = null;
      return;
    }
    if (this.animStartTs === null) {
      this.animStartTs = ts;
    }
    const total = this.animElapsed + (ts - this.animStartTs);
    const progress = Math.min(1, total / this.animDuration);
    if (progress >= 1) {
      el.style[this.styleProp()] = `${this.animRest}px`;
      this.rafID = null;
      this.clearAnimState();
      this.complete();
      return;
    }
    el.style[this.styleProp()] =
      `${this.animRest + (this.animFrom - this.animRest) * (1 - SWING(progress))}px`;
    this.animLastProgress = progress;
    this.rafID = requestFrame(this.frame);
  };

  private clearAnimState(): void {
    this.animEl = null;
    this.animFrom = 0;
    this.animRest = 0;
    this.animDuration = 0;
    this.animElapsed = 0;
    this.animStartTs = null;
    this.animLastProgress = 0;
  }

  private complete(): void {
    const itemCount = directLiChildren(this.host.element).length;
    if (itemCount > 0) {
      this.stepCount++;
      if (this.stepCount >= itemCount) {
        this.completedCycles++;
        this.stepCount = 0;
        this.host.emitCycle(this.completedCycles);
      }
    }
    this.clearInterval();
    this.arm();
  }
}
