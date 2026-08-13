import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AcmeTicker } from '../src/index';
import type { AcmeTickerOptions } from '../src/index';
import { mockRaf, mockSize, type RafMock } from './helpers';

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
  options: Partial<AcmeTickerOptions>,
  heights: Array<number> = [40, 50, 60],
): { ticker: AcmeTicker; ul: HTMLElement } {
  document.body.innerHTML = `<ul id="t">${heights.map((_, i) => `<li>item ${i}</li>`).join('')}</ul>`;
  const ul = document.getElementById('t') as HTMLElement;
  Array.from(ul.querySelectorAll(':scope > li')).forEach((li, i) => {
    mockSize(li as HTMLElement, 120, heights[i] ?? 40);
  });
  const ticker = new AcmeTicker(ul, { autoplay: 1000, speed: 600, direction: 'up', ...options });
  return { ticker, ul };
}

function order(ul: HTMLElement): Array<string | null> {
  return Array.from(ul.querySelectorAll(':scope > li')).map((li) => li.textContent);
}

function hiddenExcept(ul: HTMLElement, visible: HTMLElement): void {
  for (const li of Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'))) {
    if (li === visible) {
      expect(li.style.display).toBe('block');
      expect(li.style.opacity).toBe('1');
      expect(li.style.position).toBe('absolute');
    } else {
      expect(li.style.display).toBe('none');
      expect(li.style.opacity).toBe('0');
    }
  }
}

describe('vertical/horizontal engine', () => {
  it('rotates first li to the end and reveals the new first on each tick', () => {
    const { ul } = mount({ type: 'vertical', direction: 'up' });

    vi.advanceTimersByTime(1000);
    raf.step(0);

    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);
    const visible = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    hiddenExcept(ul, visible);
  });

  it('measures the animated element, not the one rotated away (D3)', () => {
    const { ul } = mount({ type: 'vertical', direction: 'up' }, [40, 50, 60]);

    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.marginTop)).toBe(-50);

    raf.step(600);
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const second = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(second.style.marginTop)).toBe(-60);
  });

  it('measures a newly current item even when it starts hidden', () => {
    document.body.innerHTML = '<ul id="t"><li>A</li><li>B</li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    const items = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    for (const li of items) {
      Object.defineProperty(li, 'offsetHeight', {
        configurable: true,
        get: () => (li.style.display === 'none' ? 0 : 40),
      });
      Object.defineProperty(li, 'offsetWidth', {
        configurable: true,
        get: () => (li.style.display === 'none' ? 0 : 80),
      });
    }
    new AcmeTicker(ul, { type: 'vertical', autoplay: 1000, speed: 600 });

    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child');
    expect(first?.style.marginTop).toBe('-40px');
  });

  it('measures hidden horizontal items before animating left', () => {
    document.body.innerHTML = '<ul id="t"><li>A</li><li>B</li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    const items = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    for (const li of items) {
      Object.defineProperty(li, 'offsetHeight', {
        configurable: true,
        get: () => (li.style.display === 'none' ? 0 : 40),
      });
      Object.defineProperty(li, 'offsetWidth', {
        configurable: true,
        get: () => (li.style.display === 'none' ? 0 : 80),
      });
    }
    new AcmeTicker(ul, { type: 'horizontal', direction: 'right', autoplay: 1000, speed: 600 });

    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child');
    expect(first?.style.left).toBe('-80px');
  });

  it('direction up animates from a negative offset (v1 parity)', () => {
    const { ul } = mount({ type: 'vertical', direction: 'up' });
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.marginTop)).toBe(-50);
  });

  it('direction down animates from a positive offset (v1 parity)', () => {
    const { ul } = mount({ type: 'vertical', direction: 'down' });
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.marginTop)).toBe(50);
  });

  it('horizontal uses the left property; right is negative, left is positive', () => {
    const right = mount({ type: 'horizontal', direction: 'right' });
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const first = right.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(first.style.left)).toBe(-120);

    const left = mount({ type: 'horizontal', direction: 'left' });
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const firstLeft = left.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(parseFloat(firstLeft.style.left)).toBe(120);
  });

  it('waits autoplay after each animation completes (period = autoplay + speed)', () => {
    const { ul } = mount({ type: 'vertical', autoplay: 1000, speed: 600 });

    vi.advanceTimersByTime(1000);
    raf.step(0);
    raf.step(600);
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);

    vi.advanceTimersByTime(999);
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);

    vi.advanceTimersByTime(1);
    raf.step(0);
    expect(order(ul)).toEqual(['item 2', 'item 0', 'item 1']);
  });

  it('manual next/prev rotate instantly, settle at offset 0, and re-arm autoplay', () => {
    const { ticker, ul } = mount({ type: 'vertical' });

    ticker.next();
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);
    const first = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(first.style.marginTop).toBe('0px');
    expect(first.style.display).toBe('block');

    ticker.prev();
    expect(order(ul)).toEqual(['item 0', 'item 1', 'item 2']);

    vi.advanceTimersByTime(1000);
    raf.step(0);
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);
  });

  it('prev/next while paused are no-ops, matching v1', () => {
    const { ticker, ul } = mount({ type: 'vertical' });

    ticker.pause();
    ticker.next();
    expect(order(ul)).toEqual(['item 0', 'item 1', 'item 2']);
    ticker.prev();
    expect(order(ul)).toEqual(['item 0', 'item 1', 'item 2']);
    expect(ticker.paused).toBe(true);

    vi.advanceTimersByTime(10000);
    expect(order(ul)).toEqual(['item 0', 'item 1', 'item 2']);

    ticker.play();
    ticker.next();
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);
  });

  it('pause during an animation lets it finish, then stops', () => {
    const { ticker, ul } = mount({ type: 'vertical', direction: 'up' });

    vi.advanceTimersByTime(1000);
    raf.step(0);
    raf.step(300);
    ticker.pause();
    raf.step(300);
    expect(raf.pendingFrames()).toBe(0);

    const first = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(first.style.marginTop).toBe('0px');

    const afterPause = order(ul);
    vi.advanceTimersByTime(10000);
    expect(order(ul)).toEqual(afterPause);
  });

  it('resume re-arms autoplay after a pause stopped the interval', () => {
    const { ticker, ul } = mount({ type: 'vertical' });

    ticker.pause();
    vi.advanceTimersByTime(5000);
    const before = order(ul);

    ticker.play();
    vi.advanceTimersByTime(999);
    expect(order(ul)).toEqual(before);
    vi.advanceTimersByTime(1);
    expect(order(ul)).not.toEqual(before);
  });

  it('pause before the first tick prevents any rotation', () => {
    const { ticker, ul } = mount({ type: 'vertical' });

    ticker.pause();
    vi.advanceTimersByTime(10000);
    expect(order(ul)).toEqual(['item 0', 'item 1', 'item 2']);
  });

  it('destroy restores DOM state and clears all timers and frames', () => {
    const { ticker, ul } = mount({ type: 'vertical', direction: 'up' });

    vi.advanceTimersByTime(1000);
    raf.step(300);
    ticker.destroy();

    for (const li of Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'))) {
      expect(li.style.display).toBe('');
      expect(li.style.opacity).toBe('');
      expect(li.style.position).toBe('');
      expect(li.style.marginTop).toBe('');
      expect(li.style.left).toBe('');
    }
    expect(raf.pendingFrames()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);
  });

  it('degrades gracefully with 0 or 1 items', () => {
    const empty = mount({ type: 'vertical' }, []);
    vi.advanceTimersByTime(10000);
    expect(order(empty.ul)).toEqual([]);
    empty.ticker.next();
    empty.ticker.prev();
    expect(order(empty.ul)).toEqual([]);

    const single = mount({ type: 'vertical' }, [40]);
    vi.advanceTimersByTime(1000);
    raf.step(0);
    raf.step(600);
    const li = single.ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    expect(li.style.display).toBe('block');
    expect(li.style.marginTop).toBe('0px');
  });

  it('controls drive the engine: next/prev clicks rotate instantly', () => {
    document.body.innerHTML = `
      <ul id="t"><li>a</li><li>b</li><li>c</li></ul>
      <button id="next">n</button><button id="prev">p</button>`;
    const ul = document.getElementById('t') as HTMLElement;
    Array.from(ul.querySelectorAll<HTMLElement>(':scope > li')).forEach((li) => {
      mockSize(li, 120, 40);
    });
    new AcmeTicker(ul, {
      type: 'vertical',
      controls: { next: '#next', prev: '#prev' },
      autoplay: 1000,
      speed: 600,
    });

    (document.getElementById('next') as HTMLButtonElement).click();
    expect(order(ul)).toEqual(['b', 'c', 'a']);

    (document.getElementById('prev') as HTMLButtonElement).click();
    expect(order(ul)).toEqual(['a', 'b', 'c']);
  });

  it('update() to marquee hands off cleanly and the marquee takes over', () => {
    const { ticker, ul } = mount({ type: 'vertical', direction: 'up' });
    mockSize(ticker.wrap, 300, 45);

    vi.advanceTimersByTime(1000);
    raf.step(0);
    expect(raf.pendingFrames()).toBe(1);

    ticker.update({ type: 'marquee', speed: 0.5 });

    const lis = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    expect(raf.pendingFrames()).toBe(1);
    expect(ul.style.position).toBe('absolute');
    const originals = lis.slice(0, lis.length / 2);
    const expectedWidth =
      2 *
      originals.reduce(
        (sum, li) =>
          sum + li.offsetWidth + (parseFloat(getComputedStyle(li).marginRight) || 0) + 5,
        0,
      );
    expect(ul.style.width).toBe(`${expectedWidth}px`);
    expect(ul.style.transform).toBe('translateX(0px)');
    for (const li of lis) {
      expect(li.style.display).toBe('inline-block');
      expect(li.style.marginRight).toBe('10px');
      expect(li.style.opacity).toBe('');
      expect(li.style.position).toBe('');
      expect(li.style.marginTop).toBe('');
      expect(li.style.left).toBe('');
    }

    raf.step(0);
    raf.step(100);
    expect(ul.style.transform).toBe('translateX(-50px)');

    ticker.update({ type: 'vertical' });
    expect(ul.style.transform).toBe('');
    expect(ul.style.width).toBe('');
    expect(ul.style.position).toBe('');
    const after = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    expect(after[0]?.style.display).toBe('');
    for (const li of after.slice(1)) {
      expect(li.style.display).toBe('none');
    }
    for (const li of after) {
      expect(li.style.marginRight).toBe('');
    }

    vi.advanceTimersByTime(1000);
    raf.step(0);
    expect(order(ul)).not.toEqual(['item 0', 'item 1', 'item 2']);
  });
});

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

function runTransitions(count: number, autoplay = 1000, speed = 600): void {
  for (let i = 0; i < count; i++) {
    vi.advanceTimersByTime(autoplay);
    raf.step(0);
    raf.step(speed);
  }
}

describe('acmeTickerCycle event', () => {
  it('emits once per full pass of N items with a cumulative count', () => {
    const { ul } = mount({ type: 'vertical' });
    const { events, stop } = collectCycles();

    runTransitions(3);
    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);
    expect(events[0]?.ticker).toBe(ul);

    runTransitions(3);
    expect(events).toHaveLength(2);
    expect(events[1]?.count).toBe(2);

    stop();
  });

  it('manual navigation restarts the current pass', () => {
    const { ticker } = mount({ type: 'vertical' });
    const { events, stop } = collectCycles();

    runTransitions(1);
    ticker.next();
    runTransitions(2);
    expect(events).toHaveLength(0);

    runTransitions(1);
    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);

    stop();
  });

  it('pause and resume do not restart the current pass', () => {
    const { ticker } = mount({ type: 'vertical' });
    const { events, stop } = collectCycles();

    runTransitions(1);
    ticker.pause();
    vi.advanceTimersByTime(5000);
    ticker.play();
    runTransitions(2);

    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);

    stop();
  });

  it('a single item emits on every transition', () => {
    mount({ type: 'vertical' }, [40]);
    const { events, stop } = collectCycles();

    runTransitions(2);
    expect(events.map((e) => e.count)).toEqual([1, 2]);

    stop();
  });

  it('an empty list emits nothing', () => {
    mount({ type: 'vertical' }, []);
    const { events, stop } = collectCycles();

    runTransitions(3);
    expect(events).toHaveLength(0);

    stop();
  });

  it('tracks cycle counts independently across instances', () => {
    document.body.innerHTML = `
      <ul id="a"><li>1</li><li>2</li></ul>
      <ul id="b"><li>1</li><li>2</li></ul>`;
    const aEl = document.getElementById('a') as HTMLElement;
    const bEl = document.getElementById('b') as HTMLElement;
    for (const li of Array.from(aEl.querySelectorAll<HTMLElement>(':scope > li'))) {
      mockSize(li, 120, 40);
    }
    for (const li of Array.from(bEl.querySelectorAll<HTMLElement>(':scope > li'))) {
      mockSize(li, 120, 40);
    }
    new AcmeTicker(aEl, { type: 'vertical', autoplay: 1000, speed: 600 });
    new AcmeTicker(bEl, { type: 'vertical', autoplay: 2000, speed: 600 });
    const { events, stop } = collectCycles();

    runTransitions(4);
    const aEvents = events.filter((e) => e.ticker === aEl);
    const bEvents = events.filter((e) => e.ticker === bEl);
    expect(aEvents.map((e) => e.count)).toEqual([1, 2]);
    expect(bEvents.map((e) => e.count)).toEqual([1]);

    stop();
  });
});

describe('autoplay: 0 continuous loop', () => {
  it('starts the next transition immediately after the previous one completes', () => {
    const { ul } = mount({ type: 'vertical', autoplay: 0, speed: 600 });
    const { events, stop } = collectCycles();

    vi.advanceTimersByTime(1);
    raf.step(0);
    raf.step(600);
    expect(order(ul)).toEqual(['item 1', 'item 2', 'item 0']);

    vi.advanceTimersByTime(2);
    expect(order(ul)).toEqual(['item 2', 'item 0', 'item 1']);

    raf.step(0);
    raf.step(600);
    expect(order(ul)).toEqual(['item 2', 'item 0', 'item 1']);

    vi.advanceTimersByTime(2);
    expect(order(ul)).toEqual(['item 0', 'item 1', 'item 2']);

    raf.step(0);
    raf.step(600);
    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);

    stop();
  });
});

describe('swing easing parity with jQuery v1 (0.5 - Math.cos(p * Math.PI) / 2)', () => {
  const swing = (p: number): number => 0.5 - Math.cos(p * Math.PI) / 2;
  const samples = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

  function sample(styleProp: 'marginTop' | 'left', el: HTMLElement): number {
    return parseFloat(el.style[styleProp]);
  }

  it('vertical margin-top tracks the closed-form swing curve', () => {
    const { ul } = mount({ type: 'vertical', direction: 'up', speed: 600, autoplay: 1000 }, [40, 50, 60]);
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const animated = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    const from = sample('marginTop', animated);
    expect(from).toBe(-50);

    let elapsed = 0;
    for (const p of samples) {
      raf.step(p * 600 - elapsed);
      elapsed = p * 600;
      const actual = sample('marginTop', animated);
      const expected = from * (1 - swing(p));
      expect(Math.abs(actual - expected)).toBeLessThan(1e-6);
    }
    expect(animated.style.marginTop).toBe('0px');
  });

  it('horizontal left tracks the closed-form swing curve', () => {
    const { ul } = mount({ type: 'horizontal', direction: 'right', speed: 600, autoplay: 1000 });
    vi.advanceTimersByTime(1000);
    raf.step(0);
    const animated = ul.querySelector<HTMLElement>(':scope > li:first-child') as HTMLElement;
    const from = sample('left', animated);
    expect(from).toBe(-120);

    let elapsed = 0;
    for (const p of samples) {
      raf.step(p * 600 - elapsed);
      elapsed = p * 600;
      const actual = sample('left', animated);
      const expected = from * (1 - swing(p));
      expect(Math.abs(actual - expected)).toBeLessThan(1e-6);
    }
    expect(animated.style.left).toBe('0px');
  });
});
