import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as DomModule from '../src/dom';
import { AcmeTicker } from '../src/index';
import { mockRaf, mockSize, type RafMock } from './helpers';

const hoisted = vi.hoisted(() => ({ widths: [] as Array<string> }));

vi.mock('../src/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof DomModule>();
  return {
    ...actual,
    outerWidth: (el: HTMLElement): number => {
      hoisted.widths.push(el.closest('ul')?.style.width ?? '');
      return actual.outerWidth(el);
    },
  };
});

let raf: RafMock;

beforeEach(() => {
  raf = mockRaf();
  hoisted.widths = [];
});

afterEach(() => {
  raf.restore();
  document.body.innerHTML = '';
});

describe('marquee width measurement sequence', () => {
  it('measures lis while the 10000px forcing width is active, then sets the real width', () => {
    document.body.innerHTML = '<ul id="t"><li>a</li><li>b</li></ul>';
    const ul = document.getElementById('t') as HTMLElement;
    const [first, second] = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    if (first) {
      mockSize(first, 100, 30);
    }
    if (second) {
      mockSize(second, 120, 30);
    }

    const ticker = new AcmeTicker(ul, { type: 'marquee', speed: 0.5 });
    mockSize(ticker.wrap, 300, 45);

    const liMeasurements = hoisted.widths.filter((w) => w === '10000px');
    expect(liMeasurements.length).toBe(2);

    const expected = 2 * ((100 + 10 + 5) + (120 + 10 + 5));
    expect(ul.style.width).toBe(`${expected}px`);
    expect(ul.style.transform).toBe('translateX(0px)');
  });
});
