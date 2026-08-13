import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AcmeTicker } from '../src/index';
import type { AcmeTickerOptions } from '../src/index';
import { mockRaf, mockSize, type RafMock } from './helpers';

const LI_WIDTHS = [100, 120, 80, 60];
const WRAP_WIDTH = 300;
const SPEED = 0.5;

let raf: RafMock;

beforeEach(() => {
  raf = mockRaf();
});

afterEach(() => {
  raf.restore();
  document.body.innerHTML = '';
});

function mount(
  options: Partial<AcmeTickerOptions> = {},
  widths: Array<number> = LI_WIDTHS,
): { ticker: AcmeTicker; ul: HTMLElement } {
  document.body.innerHTML = `<ul id="t">${widths.map((_, i) => `<li>item ${i}</li>`).join('')}</ul>`;
  const ul = document.getElementById('t') as HTMLElement;
  Array.from(ul.querySelectorAll(':scope > li')).forEach((li, i) => {
    mockSize(li as HTMLElement, widths[i] ?? 40, 30);
  });
  const ticker = new AcmeTicker(ul, {
    type: 'marquee',
    direction: 'left',
    speed: SPEED,
    ...options,
  });
  mockSize(ticker.wrap, WRAP_WIDTH, 45);
  ticker.update({ type: 'marquee' });
  return { ticker, ul };
}

function copyWidth(ul: HTMLElement): number {
  const lis = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
  return lis
    .slice(0, lis.length / 2)
    .reduce(
      (sum, li) => sum + li.offsetWidth + (parseFloat(getComputedStyle(li).marginRight) || 0) + 5,
      0,
    );
}

function translateX(ul: HTMLElement): number {
  return parseFloat(ul.style.transform.replace('translateX(', ''));
}

describe('marquee engine', () => {
  it('applies the v1 layout contract, measures widths, and duplicates the items', () => {
    const { ul } = mount();

    const lis = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    expect(lis).toHaveLength(8);
    expect(ul.style.position).toBe('absolute');
    expect(raf.pendingFrames()).toBe(1);
    for (const li of lis) {
      expect(li.style.display).toBe('inline-block');
      expect(li.style.marginRight).toBe('10px');
    }
    expect(ul.style.width).toBe(`${2 * copyWidth(ul)}px`);
    expect(ul.style.transform).toBe('translateX(0px)');
  });

  it('direction right mirrors the movement via the transform mapping', () => {
    const { ul } = mount({ direction: 'right' });

    const lw = copyWidth(ul);
    expect(ul.style.transform).toBe(`translateX(${WRAP_WIDTH - 2 * lw}px)`);

    raf.step(0);
    raf.step(100);
    expect(translateX(ul)).toBeCloseTo(WRAP_WIDTH - 2 * lw + 50, 6);
  });

  it('each leg travels one copy width and teleports invisibly at -listWidth', () => {
    const { ul } = mount();

    const lw = copyWidth(ul);
    raf.step(0);
    raf.step(lw / SPEED - 1);
    expect(translateX(ul)).toBeCloseTo(-(lw - SPEED), 6);

    raf.step(1);
    expect(ul.style.transform).toBe('translateX(0px)');

    raf.step(0);
    raf.step(lw / SPEED);
    expect(ul.style.transform).toBe('translateX(0px)');
  });

  it('pause freezes position and resume continues the same leg at the same velocity', () => {
    const { ticker, ul } = mount();

    raf.step(0);
    raf.step(100);
    const pausedAt = translateX(ul);
    expect(pausedAt).toBeCloseTo(-50, 6);

    ticker.pause();
    raf.step(500);
    expect(translateX(ul)).toBe(pausedAt);
    expect(raf.pendingFrames()).toBe(0);

    ticker.play();
    expect(raf.pendingFrames()).toBe(1);
    raf.step(0);
    raf.step(100);
    expect(translateX(ul)).toBeCloseTo(pausedAt - 50, 6);
  });

  it('hover pauses and resumes via engine routing (v1 mPause quirk chain)', () => {
    const { ul } = mount();

    raf.step(0);
    raf.step(100);
    const beforeHover = translateX(ul);

    ul.dispatchEvent(new MouseEvent('mouseenter'));
    expect(raf.pendingFrames()).toBe(0);
    raf.step(1000);
    expect(translateX(ul)).toBe(beforeHover);

    ul.dispatchEvent(new MouseEvent('mouseleave'));
    expect(raf.pendingFrames()).toBe(1);
    raf.step(0);
    raf.step(100);
    expect(translateX(ul)).toBeCloseTo(beforeHover - 50, 6);
  });

  it('hover while toggle-paused still resumes on leave, matching v1', () => {
    const { ticker, ul } = mount();

    raf.step(0);
    raf.step(100);
    const pausedAt = translateX(ul);

    ticker.toggle();
    expect(ticker.paused).toBe(true);
    expect(raf.pendingFrames()).toBe(0);

    ul.dispatchEvent(new MouseEvent('mouseenter'));
    ul.dispatchEvent(new MouseEvent('mouseleave'));

    expect(raf.pendingFrames()).toBe(1);
    raf.step(0);
    raf.step(100);
    expect(translateX(ul)).toBeCloseTo(pausedAt - 50, 6);
    expect(ticker.paused).toBe(true);
  });

  it('focus pauses and resumes like hover', () => {
    const { ul } = mount();

    raf.step(0);
    raf.step(100);
    const beforeFocus = translateX(ul);

    ul.dispatchEvent(new FocusEvent('focusin'));
    expect(raf.pendingFrames()).toBe(0);

    ul.dispatchEvent(new FocusEvent('focusout'));
    expect(raf.pendingFrames()).toBe(1);
    raf.step(0);
    raf.step(100);
    expect(translateX(ul)).toBeCloseTo(beforeFocus - 50, 6);
  });

  it('prev and next are no-ops for marquee', () => {
    const { ticker, ul } = mount();

    ticker.prev();
    ticker.next();
    expect(ul.style.transform).toBe('translateX(0px)');
    expect(raf.pendingFrames()).toBe(1);
  });

  it('destroy removes the duplicated items and restores all marquee DOM mutations', () => {
    const { ticker, ul } = mount();

    raf.step(0);
    raf.step(100);
    ticker.destroy();

    expect(ul.querySelectorAll(':scope > li')).toHaveLength(4);
    expect(ul.style.position).toBe('');
    expect(ul.style.width).toBe('');
    expect(ul.style.transform).toBe('');
    for (const li of Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'))) {
      expect(li.style.display).toBe('');
      expect(li.style.marginRight).toBe('');
    }
    expect(raf.pendingFrames()).toBe(0);
  });

  it('degrades gracefully with an empty list', () => {
    const { ticker, ul } = mount({}, []);

    expect(raf.pendingFrames()).toBe(0);
    expect(ul.style.transform).toBe('');
    ticker.play();
    expect(raf.pendingFrames()).toBe(0);
  });
});

describe('marquee seamless loop (issue #18)', () => {
  it('the window never goes blank across the seam', () => {
    const { ul } = mount();

    const lw = copyWidth(ul);
    raf.step(0);
    raf.step(lw / SPEED - 1);

    const windowLeft = -translateX(ul);
    const windowRight = windowLeft + WRAP_WIDTH;
    expect(windowLeft).toBeGreaterThanOrEqual(0);
    expect(windowRight).toBeLessThanOrEqual(2 * lw);

    raf.step(1);
    expect(translateX(ul)).toBe(0);
  });

  it('the seam is content-stream continuous (no jump in content)', () => {
    const { ul } = mount();

    const lw = copyWidth(ul);
    raf.step(0);
    raf.step(lw / SPEED - 1);

    const contentAtPageZero = -translateX(ul);
    expect(contentAtPageZero).toBeCloseTo(lw - SPEED, 6);

    raf.step(1);
    expect(translateX(ul)).toBe(0);

    const nextContentAtPageZero = -translateX(ul);
    expect((contentAtPageZero + SPEED) % lw).toBeCloseTo(nextContentAtPageZero, 6);
  });
});

describe('marquee teleport continuity (D7 property test)', () => {
  const samples = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99];

  it('position is exactly linear within each leg (no stutter or skipped pixels)', () => {
    const { ul } = mount();

    const lw = copyWidth(ul);
    const legDuration = lw / SPEED;

    raf.step(0);
    let elapsed = 0;
    for (const p of samples) {
      raf.step(p * legDuration - elapsed);
      elapsed = p * legDuration;
      expect(translateX(ul)).toBeCloseTo(-SPEED * elapsed, 6);
    }

    raf.step(legDuration - elapsed);
    raf.step(0);
    elapsed = 0;
    for (const p of samples) {
      raf.step(p * legDuration - elapsed);
      elapsed = p * legDuration;
      expect(translateX(ul)).toBeCloseTo(-SPEED * elapsed, 6);
    }
  });

  it('teleports exactly at position -listWidth to 0, never overshooting', () => {
    const { ul } = mount();

    const lw = copyWidth(ul);
    const legDuration = lw / SPEED;

    raf.step(0);
    raf.step(legDuration - 1);
    const justBefore = translateX(ul);
    expect(justBefore).toBeGreaterThan(-lw);
    expect(justBefore).toBeCloseTo(-(legDuration - 1) * SPEED, 6);

    raf.step(1);
    expect(translateX(ul)).toBe(0);
    expect(raf.pendingFrames()).toBe(1);
  });

  it('cycles repeat indefinitely with identical phase behavior', () => {
    const { ul } = mount();

    const lw = copyWidth(ul);
    const legDuration = lw / SPEED;

    raf.step(0);
    raf.step(legDuration / 2);
    const cycle1Mid = translateX(ul);
    raf.step(legDuration / 2);
    raf.step(0);
    raf.step(legDuration / 2);

    expect(translateX(ul)).toBeCloseTo(cycle1Mid, 6);
    expect(raf.pendingFrames()).toBe(1);
  });
});

describe('acmeTickerCycle event', () => {
  type CycleEvent = { ticker: HTMLElement; count: number };

  function collectCycles(): { events: Array<CycleEvent>; stop: () => void } {
    const events: Array<CycleEvent> = [];
    const listener = (e: Event): void => {
      events.push((e as CustomEvent).detail as CycleEvent);
    };
    document.addEventListener('acmeTickerCycle', listener);
    return {
      events,
      stop: () => document.removeEventListener('acmeTickerCycle', listener),
    };
  }

  it('emits once per full list pass with a cumulative count', () => {
    const { ul } = mount();
    const { events, stop } = collectCycles();

    const lw = copyWidth(ul);
    const legDuration = lw / SPEED;

    raf.step(0);
    raf.step(legDuration);
    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);
    expect(events[0]?.ticker).toBe(ul);

    raf.step(0);
    raf.step(legDuration);
    expect(events).toHaveLength(2);
    expect(events[1]?.count).toBe(2);

    stop();
  });

  it('emits nothing for an empty list', () => {
    mount({}, []);
    const { events, stop } = collectCycles();

    raf.step(0);
    raf.step(10000);
    expect(events).toHaveLength(0);

    stop();
  });
});
