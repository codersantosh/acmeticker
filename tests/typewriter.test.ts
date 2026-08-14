import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AcmeTicker } from '../src/index';
import type { AcmeTickerOptions } from '../src/index';
import { mockRaf, type RafMock } from './helpers';

const TEXTS = ['Hello World', 'Second item', 'Third'];
const SPEED = 50;
const AUTOPLAY = 1000;

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
  options: Partial<AcmeTickerOptions> = {},
  texts: Array<string> = TEXTS,
): { ticker: AcmeTicker; ul: HTMLElement } {
  document.body.innerHTML = `<ul id="t">${texts
    .map((text, i) => `<li data-id="${i}"><a href="#">${text}</a></li>`)
    .join('')}</ul>`;
  const ul = document.getElementById('t') as HTMLElement;
  const ticker = new AcmeTicker(ul, {
    type: 'typewriter',
    speed: SPEED,
    autoplay: AUTOPLAY,
    ...options,
  });
  return { ticker, ul };
}

function order(ul: HTMLElement): Array<string | null> {
  return Array.from(ul.querySelectorAll<HTMLElement>(':scope > li')).map((li) =>
    li.getAttribute('data-id'),
  );
}

function anchorText(li: HTMLElement): string {
  return li.querySelector('a')?.textContent ?? '';
}

function liAt(ul: HTMLElement, index: number): HTMLElement {
  return ul.querySelectorAll<HTMLElement>(':scope > li')[index] as HTMLElement;
}

describe('typewriter engine', () => {
  it('reveals one character per speed tick in the first child', () => {
    const { ul } = mount();

    vi.advanceTimersByTime(SPEED);
    const first = liAt(ul, 0);
    expect(anchorText(first)).toBe('H');
    expect(first.style.opacity).toBe('1');
    expect(first.style.display).toBe('block');
    expect(liAt(ul, 1).style.display).toBe('none');
    expect(liAt(ul, 2).style.display).toBe('none');

    vi.advanceTimersByTime(3 * SPEED);
    expect(anchorText(first)).toBe('Hell');
  });

  it('stores the full text in data-text on the first tick, ahead of the reveal', () => {
    const { ul } = mount();

    vi.advanceTimersByTime(SPEED);
    const first = liAt(ul, 0);
    expect(first.getAttribute('data-text')).toBe('Hello World');
    expect(anchorText(first)).toBe('H');
  });

  it('round-trips data-text through a full rotation cycle', () => {
    const { ul } = mount();

    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    expect(order(ul)).toEqual(['1', '2', '0']);

    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    expect(order(ul)).toEqual(['2', '0', '1']);

    vi.advanceTimersByTime(6 * SPEED + AUTOPLAY);
    expect(order(ul)).toEqual(['0', '1', '2']);

    const first = liAt(ul, 0);
    expect(first.getAttribute('data-text')).toBe('Hello World');
    expect(anchorText(first)).toBe('Hello World');

    vi.advanceTimersByTime(SPEED);
    expect(anchorText(first)).toBe('H');
  });

  it('reveals only into the first child, leaving siblings untouched', () => {
    document.body.innerHTML =
      '<ul id="t"><li><a href="#">Alpha</a><span>Badge</span></li><li><a href="#">Beta</a></li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    new AcmeTicker(ul, { type: 'typewriter', speed: SPEED, autoplay: AUTOPLAY });

    vi.advanceTimersByTime(3 * SPEED);
    const first = liAt(ul, 0);
    expect(anchorText(first)).toBe('Alp');
    expect(first.querySelector('span')?.textContent).toBe('Badge');
  });

  it('destroy restores nested siblings exactly without duplicating text (F-07)', () => {
    document.body.innerHTML =
      '<ul id="t"><li><a href="#">Alpha</a><span>Badge</span></li><li><a href="#">Beta</a></li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    const ticker = new AcmeTicker(ul, { type: 'typewriter', speed: SPEED, autoplay: AUTOPLAY });

    vi.advanceTimersByTime(3 * SPEED);
    ticker.destroy();

    const first = liAt(ul, 0);
    expect(first.querySelector('a')?.textContent).toBe('Alpha');
    expect(first.querySelector('span')?.textContent).toBe('Badge');
    expect(first.textContent).toBe('AlphaBadge');
    expect(first.hasAttribute('data-text')).toBe(false);
  });

  it('pause freezes the character count and resume continues from that exact count', () => {
    const { ticker, ul } = mount();

    vi.advanceTimersByTime(4 * SPEED);
    const first = liAt(ul, 0);
    expect(anchorText(first)).toBe('Hell');

    ticker.pause();
    vi.advanceTimersByTime(10 * SPEED);
    expect(anchorText(first)).toBe('Hell');
    expect(order(ul)).toEqual(['0', '1', '2']);

    ticker.play();
    vi.advanceTimersByTime(SPEED);
    expect(anchorText(first)).toBe('Hello');
    expect(first.getAttribute('data-text')).toBe('Hello World');
  });

  it('pause during the hold prevents rotation; resume re-schedules the rotation', () => {
    const { ticker, ul } = mount();

    vi.advanceTimersByTime(12 * SPEED);
    expect(liAt(ul, 0).style.display).toBe('block');

    ticker.pause();
    vi.advanceTimersByTime(3 * AUTOPLAY);
    expect(order(ul)).toEqual(['0', '1', '2']);

    ticker.play();
    vi.advanceTimersByTime(SPEED + AUTOPLAY);
    expect(order(ul)).toEqual(['1', '2', '0']);
  });

  it('hover pauses genuinely and resumes from the exact count', () => {
    const { ul } = mount();

    vi.advanceTimersByTime(4 * SPEED);
    ul.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(10 * SPEED);
    expect(anchorText(liAt(ul, 0))).toBe('Hell');

    ul.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(SPEED);
    expect(anchorText(liAt(ul, 0))).toBe('Hello');
  });

  it('next/prev fully reset the typing state for the newly current li', () => {
    const { ticker, ul } = mount();

    vi.advanceTimersByTime(4 * SPEED);
    expect(anchorText(liAt(ul, 0))).toBe('Hell');

    ticker.next();
    expect(order(ul)).toEqual(['1', '2', '0']);
    expect(liAt(ul, 0).getAttribute('data-text')).toBe(null);
    expect(liAt(ul, 2).getAttribute('data-text')).toBe('Hello World');
    expect(anchorText(liAt(ul, 2))).toBe('Hell');

    vi.advanceTimersByTime(2 * SPEED);
    expect(anchorText(liAt(ul, 0))).toBe('Se');

    ticker.prev();
    expect(order(ul)).toEqual(['0', '1', '2']);
    vi.advanceTimersByTime(SPEED);
    expect(anchorText(liAt(ul, 0))).toBe('H');
  });

  it('prev/next while paused are no-ops, matching v1', () => {
    const { ticker, ul } = mount();

    vi.advanceTimersByTime(4 * SPEED);
    ticker.pause();
    ticker.next();
    expect(order(ul)).toEqual(['0', '1', '2']);
    expect(anchorText(liAt(ul, 0))).toBe('Hell');
  });

  it('holds the completed text for autoplay, then rotates', () => {
    const { ul } = mount();

    vi.advanceTimersByTime(11 * SPEED);
    expect(order(ul)).toEqual(['0', '1', '2']);
    expect(anchorText(liAt(ul, 0))).toBe('Hello World');

    vi.advanceTimersByTime(SPEED);
    vi.advanceTimersByTime(AUTOPLAY - SPEED);
    expect(order(ul)).toEqual(['0', '1', '2']);

    vi.advanceTimersByTime(SPEED);
    expect(order(ul)).toEqual(['1', '2', '0']);
    expect(anchorText(liAt(ul, 0))).toBe('Second item');
    expect(liAt(ul, 0).style.display).toBe('none');
  });

  it('destroy restores full text, removes data-text, and clears styles', () => {
    const { ticker, ul } = mount();

    vi.advanceTimersByTime(3 * SPEED);
    ticker.destroy();

    for (const li of Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'))) {
      expect(li.hasAttribute('data-text')).toBe(false);
      expect(li.style.display).toBe('');
      expect(li.style.opacity).toBe('');
    }
    expect(anchorText(liAt(ul, 0))).toBe('Hello World');
    expect(anchorText(liAt(ul, 1))).toBe('Second item');
  });

  it('update() to vertical leaves no stale data-text and hands off cleanly', () => {
    const { ticker, ul } = mount();

    vi.advanceTimersByTime(3 * SPEED);
    ticker.update({ type: 'vertical', autoplay: 1000, speed: 600 });

    for (const li of Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'))) {
      expect(li.hasAttribute('data-text')).toBe(false);
    }
    expect(anchorText(liAt(ul, 0))).toBe('Hello World');

    vi.advanceTimersByTime(1000);
    raf.step(0);
    expect(order(ul)).not.toEqual(['0', '1', '2']);
  });

  it('a consumer-provided data-text acts as the typed source text', () => {
    document.body.innerHTML =
      '<ul id="t"><li data-text="Custom source"><a href="#">Ignored</a></li><li><a href="#">Beta</a></li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    new AcmeTicker(ul, { type: 'typewriter', speed: SPEED, autoplay: AUTOPLAY });

    vi.advanceTimersByTime(3 * SPEED);
    expect(anchorText(liAt(ul, 0))).toBe('Cus');
  });

  it('a bare-text li (no child element) shows its full text, holds, then rotates', () => {
    document.body.innerHTML =
      '<ul id="t"><li data-id="0">Bare text</li><li data-id="1"><a href="#">Beta</a></li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    new AcmeTicker(ul, { type: 'typewriter', speed: SPEED, autoplay: AUTOPLAY });

    vi.advanceTimersByTime(SPEED);
    const first = liAt(ul, 0);
    expect(first.style.display).toBe('block');
    expect(first.textContent).toBe('Bare text');

    vi.advanceTimersByTime(10 * SPEED + AUTOPLAY);
    expect(order(ul)).toEqual(['1', '0']);
  });

  it('degrades gracefully with an empty list', () => {
    const { ticker, ul } = mount({}, []);

    vi.advanceTimersByTime(10 * SPEED);
    expect(order(ul)).toEqual([]);
    ticker.next();
    ticker.prev();
    ticker.play();
    expect(order(ul)).toEqual([]);
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

  it('emits once per full pass of N items', () => {
    const { ul } = mount();
    const { events, stop } = collectCycles();

    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    vi.advanceTimersByTime(6 * SPEED + AUTOPLAY);

    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);
    expect(events[0]?.ticker).toBe(ul);

    stop();
  });

  it('manual navigation restarts the current pass', () => {
    const { ticker } = mount();
    const { events, stop } = collectCycles();

    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    ticker.next();
    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    vi.advanceTimersByTime(6 * SPEED + AUTOPLAY);
    expect(events).toHaveLength(0);

    vi.advanceTimersByTime(12 * SPEED + AUTOPLAY);
    expect(events).toHaveLength(1);
    expect(events[0]?.count).toBe(1);

    stop();
  });
});

describe('autoplay: 0 continuous loop', () => {
  it('rotates to the next item immediately after the reveal completes', () => {
    const { ul } = mount({ autoplay: 0 });

    vi.advanceTimersByTime(12 * SPEED);
    expect(order(ul)).toEqual(['0', '1', '2']);

    vi.advanceTimersByTime(5);
    expect(order(ul)).toEqual(['1', '2', '0']);

    vi.advanceTimersByTime(12 * SPEED);
    expect(order(ul)).toEqual(['2', '0', '1']);
  });
});
