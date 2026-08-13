import { describe, expect, it } from 'vitest';
import { AcmeTicker, DEFAULTS } from '../src/index';

describe('AcmeTicker defaults (v1 parity)', () => {
  it('mirrors the v1 defaults 1:1', () => {
    expect(DEFAULTS).toEqual({
      type: 'horizontal',
      autoplay: 2000,
      speed: 50,
      direction: 'up',
      pauseOnFocus: true,
      pauseOnHover: true,
      controls: { prev: '', next: '', toggle: '' },
    });
  });
});

describe('accessibility', () => {
  it('marks the wrap as a non-live region', () => {
    document.body.innerHTML = '<ul><li>1</li><li>2</li></ul>';
    const ul = document.querySelector('ul') as HTMLElement;

    const ticker = new AcmeTicker(ul);
    expect(ticker.wrap.getAttribute('aria-live')).toBe('off');
    expect(ticker.wrap.getAttribute('role')).toBe('region');

    ticker.destroy();
  });

  it('starts paused under prefers-reduced-motion and can be played manually', () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    document.body.innerHTML = '<ul><li>1</li><li>2</li></ul>';
    const ul = document.querySelector('ul') as HTMLElement;

    const ticker = new AcmeTicker(ul, { type: 'vertical' });
    expect(ticker.paused).toBe(true);

    ticker.play();
    expect(ticker.paused).toBe(false);

    ticker.destroy();
    window.matchMedia = original;
  });

  it('does not auto-play a marquee under prefers-reduced-motion', () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    document.body.innerHTML = '<ul><li>1</li><li>2</li></ul>';
    const ul = document.querySelector('ul') as HTMLElement;

    const ticker = new AcmeTicker(ul, { type: 'marquee', speed: 0.5 });
    expect(ticker.paused).toBe(true);
    expect(ul.style.transform).toBe('translateX(0px)');

    ticker.toggle();
    expect(ticker.paused).toBe(false);

    ticker.destroy();
    window.matchMedia = original;
  });
});

describe('AcmeTicker construction', () => {
  it('wraps the element and hides all but the first li', () => {
    document.body.innerHTML = '<ul><li>1</li><li>2</li><li>3</li></ul>';
    const ul = document.querySelector('ul') as HTMLElement;

    const ticker = new AcmeTicker(ul);
    const wrap = ul.parentElement as HTMLElement;

    expect(wrap.className).toBe('acmeticker-wrap');
    expect(wrap.style.position).toBe('relative');
    const lis = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
    const [first, ...rest] = lis;
    expect(first?.style.display).not.toBe('none');
    for (const li of rest) {
      expect(li.style.display).toBe('none');
    }

    ticker.destroy();
    expect(ul.parentElement).toBe(document.body);
  });

  it('re-inits on the same element by destroying the previous instance', () => {
    document.body.innerHTML = '<ul><li>1</li><li>2</li></ul>';
    const ul = document.querySelector('ul') as HTMLElement;

    const first = new AcmeTicker(ul);
    const firstWrap = first.wrap;
    const second = new AcmeTicker(ul);

    expect(ul.parentElement).not.toBe(firstWrap);
    expect(firstWrap.parentElement).toBeNull();
    expect(ul.parentElement).toBe(second.wrap);

    second.destroy();
  });
});
