import { cancelFrame, directLiChildren, outerWidth, requestFrame } from '../dom';
import type { TickerHost } from '../types';
import type { TickerEngine } from './index';

const LEGACY_WIDTH_FUDGE = 5;

export class MarqueeEngine implements TickerEngine {
  private readonly host: TickerHost;
  private readonly directionRight: boolean;
  private readonly speed: number;
  private rafID: number | null = null;
  private position = 0;
  private listWidth = 0;
  private wrapWidth = 0;
  private originalCount = 0;
  private legFrom = 0;
  private legTo = 0;
  private legDuration = 0;
  private startTs: number | null = null;
  private completedCycles = 0;

  constructor(host: TickerHost) {
    this.host = host;
    this.directionRight = host.options.direction === 'right';
    this.speed = host.options.speed;
  }

  init(): void {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    const ul = this.host.element;
    ul.style.position = 'absolute';
    const originals = directLiChildren(ul);
    for (const li of originals) {
      li.style.display = 'inline-block';
      li.style.marginRight = '10px';
    }
    this.wrapWidth = outerWidth(this.host.wrap);
    ul.style.width = '10000px';
    let listWidth = 0;
    for (const li of originals) {
      listWidth += outerWidth(li) + LEGACY_WIDTH_FUDGE;
    }
    this.listWidth = listWidth;
    this.originalCount = originals.length;
    for (const li of originals) {
      ul.appendChild(li.cloneNode(true) as HTMLElement);
    }
    ul.style.width = `${listWidth * 2}px`;

    this.position = 0;
    if (listWidth <= 0 || !(this.speed > 0)) {
      return;
    }
    this.applyTransform();
    if (this.host.paused) {
      return;
    }
    this.startLeg(0, -listWidth, listWidth / this.speed);
  }

  prev(): void {}

  next(): void {}

  pause(): void {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
  }

  resume(): void {
    if (this.rafID !== null) {
      return;
    }
    if (this.listWidth <= 0 || !(this.speed > 0)) {
      return;
    }
    this.startLeg(this.position, -this.listWidth, (this.position + this.listWidth) / this.speed);
  }

  destroy(): void {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    const ul = this.host.element;
    const lis = directLiChildren(ul);
    while (lis.length > this.originalCount) {
      const last = lis.pop();
      if (last) {
        last.remove();
      }
    }
    ul.style.position = '';
    ul.style.width = '';
    ul.style.transform = '';
    for (const li of directLiChildren(ul)) {
      li.style.display = '';
      li.style.marginRight = '';
    }
  }

  private startLeg(from: number, to: number, duration: number): void {
    if (!(duration > 0)) {
      this.position = to;
      this.applyTransform();
      this.legComplete();
      return;
    }
    this.legFrom = from;
    this.legTo = to;
    this.legDuration = duration;
    this.startTs = null;
    this.rafID = requestFrame(this.frame);
  }

  private readonly frame = (ts: number): void => {
    if (this.startTs === null) {
      this.startTs = ts;
    }
    const elapsed = ts - this.startTs;
    const progress = Math.min(1, elapsed / this.legDuration);
    this.position = this.legFrom + (this.legTo - this.legFrom) * progress;
    this.applyTransform();
    if (progress >= 1) {
      this.rafID = null;
      this.legComplete();
      return;
    }
    this.rafID = requestFrame(this.frame);
  };

  private legComplete(): void {
    this.completedCycles++;
    this.host.emitCycle(this.completedCycles);
    this.position = 0;
    this.applyTransform();
    this.startLeg(0, -this.listWidth, this.listWidth / this.speed);
  }

  private applyTransform(): void {
    const x = this.directionRight
      ? this.wrapWidth - this.listWidth * 2 - this.position
      : this.position;
    this.host.element.style.transform = `translateX(${x}px)`;
  }
}
