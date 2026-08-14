import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AcmeTicker } from '../src/index';
import type { AcmeTickerOptions } from '../src/index';
import { mockRaf, mockSize, type RafMock } from './helpers';

const LI_WIDTHS = [100, 120, 80, 60];
const WRAP_WIDTH = 300;
const BOX_WIDTH = 500;
const SPEED = 0.5;

let raf: RafMock;

beforeEach(() => {
  vi.useFakeTimers();
  raf = mockRaf();
});

afterEach(() => {
  raf.restore();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function mount(
  type: 'marquee' | 'vertical' | 'horizontal',
  options: Partial<AcmeTickerOptions> = {},
  attrs = '',
): { ticker: AcmeTicker; ul: HTMLElement } {
  document.body.innerHTML = `<ul id="t" ${attrs}>${LI_WIDTHS.map((_, i) => `<li>item ${i}</li>`).join('')}</ul>`;
  const ul = document.getElementById('t') as HTMLElement;
  Array.from(ul.querySelectorAll(':scope > li')).forEach((li, i) => {
    mockSize(li as HTMLElement, LI_WIDTHS[i] ?? 40, 30);
  });
  const ticker = new AcmeTicker(ul, { type, direction: 'left', speed: SPEED, ...options });
  if (type === 'marquee') {
    mockSize(ticker.wrap, WRAP_WIDTH, 45);
    ticker.update({ type: 'marquee' });
  }
  if (type === 'horizontal') {
    mockSize(ticker.wrap, BOX_WIDTH, 45);
    ticker.update({ type: 'horizontal' });
  }
  return { ticker, ul };
}

function translateX(ul: HTMLElement): number {
  return parseFloat(ul.style.transform.replace('translateX(', ''));
}

function animateOne(
  ticker: AcmeTicker,
  step: (ms: number) => void,
  advance: (ms: number) => void,
): void {
  advance(2000);
  step(0);
}

describe('rtl auto-detection', () => {
  it('defaults to ltr on an ltr element', () => {
    const { ticker } = mount('marquee');
    expect(ticker.rtl).toBe(false);
  });

  it('detects dir="rtl" on the element itself', () => {
    const { ticker } = mount('marquee', {}, 'dir="rtl"');
    expect(ticker.rtl).toBe(true);
  });

  it('detects dir="RTL" case-insensitively', () => {
    const { ticker } = mount('marquee', {}, 'dir="RTL"');
    expect(ticker.rtl).toBe(true);
  });

  it('detects dir="rtl" on an ancestor', () => {
    document.body.innerHTML = '<div dir="rtl"><ul id="t"><li>a</li></ul></div>';
    const ul = document.getElementById('t') as HTMLElement;
    const ticker = new AcmeTicker(ul, { type: 'marquee', speed: 0.5 });
    expect(ticker.rtl).toBe(true);
  });

  it('detects dir="rtl" on the document root', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    try {
      const { ticker } = mount('marquee');
      expect(ticker.rtl).toBe(true);
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });

  it('falls through dir="auto" to the computed style', () => {
    const { ticker } = mount('marquee', {}, 'dir="auto" style="direction: rtl"');
    expect(ticker.rtl).toBe(true);
  });

  it('honours an explicit rtl: false override on an rtl element', () => {
    const { ticker } = mount('marquee', { rtl: false }, 'dir="rtl"');
    expect(ticker.rtl).toBe(false);
  });

  it('honours an explicit rtl: true override on an ltr element', () => {
    const { ticker } = mount('marquee', { rtl: true });
    expect(ticker.rtl).toBe(true);
  });

  it('re-resolves after update() merges a new rtl setting', () => {
    const { ticker } = mount('marquee', { rtl: false }, 'dir="rtl"');
    expect(ticker.rtl).toBe(false);
    ticker.update({ rtl: 'auto' });
    expect(ticker.rtl).toBe(true);
  });
});

describe('marquee rtl mirroring', () => {
  it('rtl + direction left starts right-aligned and moves like ltr + direction right', () => {
    const ltr = mount('marquee', { direction: 'right' });
    const ltrTxs: Array<number> = [];
    raf.step(0);
    ltrTxs.push(translateX(ltr.ul));
    raf.step(100);
    ltrTxs.push(translateX(ltr.ul));
    raf.step(100);
    ltrTxs.push(translateX(ltr.ul));
    ltr.ticker.destroy();

    const rtl = mount('marquee', { direction: 'left' }, 'dir="rtl"');
    expect(translateX(rtl.ul)).toBe(0);
    const rtlTxs: Array<number> = [];
    raf.step(0);
    rtlTxs.push(translateX(rtl.ul));
    raf.step(100);
    rtlTxs.push(translateX(rtl.ul));
    raf.step(100);
    rtlTxs.push(translateX(rtl.ul));

    expect(ltrTxs[2]! > ltrTxs[1]! && ltrTxs[1]! > ltrTxs[0]!).toBe(true);
    expect(rtlTxs[2]! > rtlTxs[1]! && rtlTxs[1]! > rtlTxs[0]!).toBe(true);
  });

  it('rtl + direction right moves like ltr + direction left', () => {
    const ltr = mount('marquee', { direction: 'left' });
    const ltrTxs: Array<number> = [];
    raf.step(0);
    ltrTxs.push(translateX(ltr.ul));
    raf.step(100);
    ltrTxs.push(translateX(ltr.ul));
    raf.step(100);
    ltrTxs.push(translateX(ltr.ul));
    ltr.ticker.destroy();

    const rtl = mount('marquee', { direction: 'right' }, 'dir="rtl"');
    const rtlTxs: Array<number> = [];
    raf.step(0);
    rtlTxs.push(translateX(rtl.ul));
    raf.step(100);
    rtlTxs.push(translateX(rtl.ul));
    raf.step(100);
    rtlTxs.push(translateX(rtl.ul));

    expect(ltrTxs[2]! < ltrTxs[1]! && ltrTxs[1]! < ltrTxs[0]!).toBe(true);
    expect(rtlTxs[2]! < rtlTxs[1]! && rtlTxs[1]! < rtlTxs[0]!).toBe(true);
  });

  it('default direction (no direction option) scrolls rightward in rtl (F-04)', () => {
    document.body.innerHTML = `<ul id="t" dir="rtl">${LI_WIDTHS.map((_, i) => `<li>item ${i}</li>`).join('')}</ul>`;
    const ul = document.getElementById('t') as HTMLElement;
    Array.from(ul.querySelectorAll(':scope > li')).forEach((li, i) => {
      mockSize(li as HTMLElement, LI_WIDTHS[i] ?? 40, 30);
    });
    const ticker = new AcmeTicker(ul, { type: 'marquee', speed: SPEED });
    mockSize(ticker.wrap, WRAP_WIDTH, 45);
    ticker.update({ type: 'marquee' });

    const txs: Array<number> = [];
    raf.step(0);
    txs.push(translateX(ul));
    raf.step(100);
    txs.push(translateX(ul));
    raf.step(100);
    txs.push(translateX(ul));

    expect(txs[1]! > txs[0]!).toBe(true);
    expect(txs[2]! > txs[1]!).toBe(true);
    ticker.destroy();
  });

  it('default direction still scrolls leftward in ltr (F-04)', () => {
    document.body.innerHTML = `<ul id="t">${LI_WIDTHS.map((_, i) => `<li>item ${i}</li>`).join('')}</ul>`;
    const ul = document.getElementById('t') as HTMLElement;
    Array.from(ul.querySelectorAll(':scope > li')).forEach((li, i) => {
      mockSize(li as HTMLElement, LI_WIDTHS[i] ?? 40, 30);
    });
    const ticker = new AcmeTicker(ul, { type: 'marquee', speed: SPEED });
    mockSize(ticker.wrap, WRAP_WIDTH, 45);
    ticker.update({ type: 'marquee' });

    raf.step(0);
    raf.step(100);
    const t1 = translateX(ul);
    raf.step(100);
    const t2 = translateX(ul);

    expect(t2).toBeLessThan(t1);
    ticker.destroy();
  });

  it('rtl: false override keeps ltr motion on an rtl element', () => {
    const plain = mount('marquee', { direction: 'left' });
    animateOne(plain.ticker, raf.step, vi.advanceTimersByTime);
    raf.step(100);
    const plainX = translateX(plain.ul);
    plain.ticker.destroy();

    const overridden = mount('marquee', { direction: 'left', rtl: false }, 'dir="rtl"');
    animateOne(overridden.ticker, raf.step, vi.advanceTimersByTime);
    raf.step(100);
    expect(translateX(overridden.ul)).toBe(plainX);
  });
});

describe('horizontal rtl mirroring', () => {
  it('rtl + direction left starts inset and slides rightward to flush right', () => {
    const rtl = mount('horizontal', { direction: 'left', autoplay: 1000, speed: 600 }, 'dir="rtl"');
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = rtl.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.right)).toBe(120);

    raf.step(600);
    expect(first.style.right).toBe('0px');
  });

  it('rtl + direction right enters off-screen right and rests flush right', () => {
    const rtl = mount('horizontal', { direction: 'right', autoplay: 1000, speed: 600 }, 'dir="rtl"');
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = rtl.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.right)).toBe(-120);

    raf.step(600);
    expect(first.style.right).toBe('0px');
  });

  it('rtl horizontal settles the first item flush right on init', () => {
    const rtl = mount('horizontal', { autoplay: 1000, speed: 600 }, 'dir="rtl"');
    const first = rtl.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(first.style.right).toBe('0px');
    expect(first.style.left).toBe('');
  });

  it('measures the first-cycle item as absolute, not stretched in-flow', () => {
    document.body.innerHTML = '<ul id="t" dir="rtl"><li>A</li><li>B</li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    for (const li of Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'))) {
      Object.defineProperty(li, 'offsetWidth', {
        configurable: true,
        get() {
          return getComputedStyle(li).position === 'absolute' ? 120 : 1002;
        },
      });
    }
    const ticker = new AcmeTicker(ul, {
      type: 'horizontal',
      direction: 'right',
      autoplay: 1000,
      speed: 600,
    });
    mockSize(ticker.wrap, BOX_WIDTH, 45);
    ticker.update({ type: 'horizontal' });

    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.right)).toBe(-120);

    raf.step(600);
    expect(first.style.right).toBe('0px');
  });

  it('destroy clears the right offset', () => {
    const rtl = mount('horizontal', { direction: 'right', autoplay: 1000, speed: 600 }, 'dir="rtl"');
    vi.advanceTimersByTime(1000);
    raf.step(0);
    rtl.ticker.destroy();
    for (const li of Array.from(rtl.ul.querySelectorAll<HTMLElement>(':scope > li'))) {
      expect(li.style.right).toBe('');
      expect(li.style.left).toBe('');
    }
  });

  it('ltr horizontal motion is unchanged', () => {
    const right = mount('horizontal', { direction: 'right', autoplay: 1000, speed: 600 });
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = right.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.left)).toBe(-120);

    raf.step(600);
    expect(parseFloat(first.style.left)).toBe(0);
  });
});

describe('vertical rtl neutrality', () => {
  it('direction up is unchanged on an rtl element', () => {
    const rtl = mount('vertical', { direction: 'up', autoplay: 1000, speed: 600 }, 'dir="rtl"');
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = rtl.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.marginTop)).toBe(-30);
  });

  it('direction down is unchanged on an rtl element', () => {
    const rtl = mount('vertical', { direction: 'down', autoplay: 1000, speed: 600 }, 'dir="rtl"');
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = rtl.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.marginTop)).toBe(30);
  });
});
