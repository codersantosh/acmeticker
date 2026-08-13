import { cancelFrame, directLiChildren, outerHeight, outerWidth, requestFrame } from '../dom';
import type { TickerHost } from '../types';
import type { TickerEngine } from './index';

const SWING = (progress: number): number => 0.5 - Math.cos(progress * Math.PI) / 2;

type StyleProp = 'marginTop' | 'left';

export class VerticalHorizontalEngine implements TickerEngine {
  private readonly host: TickerHost;
  private readonly horizontal: boolean;
  private intervalID: number | null = null;
  private rafID: number | null = null;
  private stepCount = 0;
  private completedCycles = 0;

  constructor(host: TickerHost) {
    this.host = host;
    this.horizontal = host.options.type === 'horizontal';
  }

  init(): void {
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

  pause(): void {}

  resume(): void {
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
    for (const li of directLiChildren(this.host.element)) {
      li.style.display = '';
      li.style.opacity = '';
      li.style.position = '';
      li.style.marginTop = '';
      li.style.left = '';
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
    for (const li of directLiChildren(ul)) {
      li.style.opacity = '0';
      li.style.display = 'none';
    }
    const first = directLiChildren(ul)[0];
    if (first) {
      const styleProp = this.styleProp();
      first.style.opacity = '1';
      first.style.position = 'absolute';
      first.style.display = 'block';
      first.style[styleProp] = '0px';
    }
  }

  private styleProp(): StyleProp {
    return this.horizontal ? 'left' : 'marginTop';
  }

  private animate(el: HTMLElement): void {
    const styleProp = this.styleProp();
    const negative =
      this.host.options.direction === 'up' || this.host.options.direction === 'right';
    el.style.display = 'block';
    const travel = this.horizontal ? outerWidth(el) : outerHeight(el);
    const current = parseFloat(getComputedStyle(el)[styleProp]) || 0;
    const from = negative ? current - travel : current + travel;

    for (const li of directLiChildren(this.host.element)) {
      li.style.opacity = '0';
      li.style.display = 'none';
    }
    el.style.opacity = '1';
    el.style.position = 'absolute';
    el.style.display = 'block';
    el.style[styleProp] = `${from}px`;

    const duration = this.host.options.speed;
    if (!(duration > 0)) {
      el.style[styleProp] = '0px';
      this.complete();
      return;
    }

    let startTs: number | null = null;
    const frame = (ts: number): void => {
      if (startTs === null) {
        startTs = ts;
      }
      const progress = Math.min(1, (ts - startTs) / duration);
      if (progress >= 1) {
        el.style[styleProp] = '0px';
        this.rafID = null;
        this.complete();
        return;
      }
      el.style[styleProp] = `${from * (1 - SWING(progress))}px`;
      this.rafID = requestFrame(frame);
    };
    this.rafID = requestFrame(frame);
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
