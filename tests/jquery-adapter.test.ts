import { afterEach, describe, expect, it } from 'vitest';
import $legacy from 'jquery-legacy';
import $modern from 'jquery-modern';
import { AcmeTicker, DEFAULTS, registerJqueryShim } from '../src/index';

const jQueries = [
  { name: 'jQuery 1.12.4 (vendored-era)', $: $legacy },
  { name: 'jQuery 3.7.1 (modern)', $: $modern },
];

afterEach(() => {
  document.body.innerHTML = '';
});

describe('jQuery shim', () => {
  it.each(jQueries)('registers $.fn.AcmeTicker with v1 defaults parity: $name', ({ $ }) => {
    registerJqueryShim($);

    expect(typeof $.fn.AcmeTicker).toBe('function');
    expect($.fn.AcmeTicker.defaults).toEqual({
      type: 'horizontal',
      autoplay: 2000,
      speed: 50,
      direction: 'up',
      pauseOnFocus: true,
      pauseOnHover: true,
      controls: { prev: '', next: '', toggle: '' },
    });
    expect($.fn.AcmeTicker.defaults).toEqual(DEFAULTS);
  });

  it.each(jQueries)('initializes one instance per matched element: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = `
      <ul class="t" id="a"><li>1</li><li>2</li></ul>
      <ul class="t" id="b"><li>1</li><li>2</li></ul>`;

    const result = $('.t').AcmeTicker({ type: 'vertical' });

    expect(result.length).toBe(2);
    const wraps = document.querySelectorAll('.acmeticker-wrap');
    expect(wraps.length).toBe(2);
    for (const wrap of Array.from(wraps)) {
      const ul = wrap.querySelector('ul');
      expect(ul?.querySelectorAll<HTMLElement>(':scope > li')[1]?.style.display).toBe('none');
    }
  });

  it.each(jQueries)('returns the collection for chaining: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = '<ul id="a"><li>1</li><li>2</li></ul>';

    const chain = $('#a').AcmeTicker({ type: 'vertical' }).addClass('chained');
    expect(chain.hasClass('chained')).toBe(true);
  });

  it.each(jQueries)('routes lifecycle methods to the element instance: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = '<ul id="a"><li>1</li><li>2</li></ul>';
    const ul = document.getElementById('a') as HTMLElement;
    const order = () => Array.from(ul.querySelectorAll(':scope > li')).map((li) => li.textContent);

    $('#a').AcmeTicker({ type: 'vertical', autoplay: 1000, speed: 600 });

    $('#a').AcmeTicker('pause');
    $('#a').AcmeTicker('next');
    expect(order()).toEqual(['1', '2']);

    $('#a').AcmeTicker('play');
    $('#a').AcmeTicker('next');
    expect(order()).toEqual(['2', '1']);

    $('#a').AcmeTicker('prev');
    expect(order()).toEqual(['1', '2']);

    $('#a').AcmeTicker('bogus');
    expect(order()).toEqual(['1', '2']);
  });

  it.each(jQueries)('update() via the shim swaps the engine type: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = '<ul id="a"><li>1</li><li>2</li></ul>';
    const ul = document.getElementById('a') as HTMLElement;

    $('#a').AcmeTicker({ type: 'vertical' });
    $('#a').AcmeTicker('update', { type: 'marquee', speed: 0.5 });

    expect(ul.style.position).toBe('absolute');
    expect(ul.querySelectorAll(':scope > li')).toHaveLength(4);
  });

  it.each(jQueries)('destroy() via the shim tears down and allows re-init: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = '<ul id="a"><li>1</li><li>2</li></ul>';
    const ul = document.getElementById('a') as HTMLElement;

    $('#a').AcmeTicker({ type: 'vertical' });
    $('#a').AcmeTicker('destroy');
    expect(ul.parentElement).toBe(document.body);
    expect(document.querySelectorAll('.acmeticker-wrap')).toHaveLength(0);

    $('#a').AcmeTicker({ type: 'vertical' });
    expect(document.querySelectorAll('.acmeticker-wrap')).toHaveLength(1);

    $('#a').AcmeTicker('destroy');
    expect(document.querySelectorAll('.acmeticker-wrap')).toHaveLength(0);
  });
});

describe('D5: native CustomEvent reaches jQuery listeners', () => {
  it.each(jQueries)('document-level .on("acmeTickerToggle") fires on native dispatch: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = `
      <ul id="t"><li>1</li><li>2</li></ul>
      <button id="toggle">t</button>`;
    const ul = document.getElementById('t') as HTMLElement;

    $('#t').AcmeTicker({ type: 'vertical', controls: { toggle: '#toggle' } });

    const received: Array<{ detail: { ticker: HTMLElement; paused: boolean }; extraArgs: unknown[] }> = [];
    $(document).on('acmeTickerToggle', function (event: unknown, ...extra: unknown[]) {
      received.push({
        detail: (event as CustomEvent).detail,
        extraArgs: extra,
      });
    });

    $('#toggle').click();

    expect(received).toHaveLength(1);
    expect(received[0]?.detail.paused).toBe(true);
    expect(received[0]?.detail.ticker).toBe(ul);
    expect(received[0]?.extraArgs).toEqual([]);
  });

  it.each(jQueries)('public toggle() also dispatches to jQuery listeners: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = '<ul id="t"><li>1</li><li>2</li></ul>';

    const seen: Array<boolean> = [];
    $(document).on('acmeTickerToggle', (event: CustomEvent) => {
      seen.push(event.detail.paused);
    });

    const instance = new AcmeTicker(document.getElementById('t') as HTMLElement);
    instance.toggle();

    expect(seen).toEqual([true]);
  });

  it.each(jQueries)('native acmeTickerCycle dispatch reaches jQuery listeners: $name', ({ $ }) => {
    registerJqueryShim($);
    document.body.innerHTML = '<ul id="t"><li>1</li><li>2</li></ul>';

    const counts: Array<number> = [];
    $(document).on('acmeTickerCycle', (event: CustomEvent) => {
      counts.push(event.detail.count);
    });

    const instance = new AcmeTicker(document.getElementById('t') as HTMLElement);
    instance.emitCycle(3);

    expect(counts).toEqual([3]);
  });
});
