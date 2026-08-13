import { afterEach, describe, expect, it } from 'vitest';
import { AcmeTicker } from '../src/index';
import type { AcmeTickerOptions } from '../src/index';

type ToggleEvent = { ticker: HTMLElement; paused: boolean };

const instances: AcmeTicker[] = [];

function makeTicker(el: HTMLElement, options?: Partial<AcmeTickerOptions>): AcmeTicker {
  const ticker = new AcmeTicker(el, options);
  instances.push(ticker);
  return ticker;
}

function collectToggleEvents(): { events: Array<ToggleEvent>; stop: () => void } {
  const events: Array<ToggleEvent> = [];
  const listener = (e: Event): void => {
    events.push((e as CustomEvent).detail as ToggleEvent);
  };
  document.addEventListener('acmeTickerToggle', listener);
  return {
    events,
    stop: () => document.removeEventListener('acmeTickerToggle', listener),
  };
}

afterEach(() => {
  for (const ticker of instances) {
    ticker.destroy();
  }
  instances.length = 0;
  document.body.innerHTML = '';
});

describe('multi-instance independence', () => {
  it('keeps pause state independent across instances', () => {
    document.body.innerHTML =
      '<ul id="a"><li>1</li><li>2</li></ul><ul id="b"><li>1</li><li>2</li></ul>';
    const aEl = document.getElementById('a') as HTMLElement;
    const bEl = document.getElementById('b') as HTMLElement;

    const a = makeTicker(aEl, { type: 'vertical' });
    const b = makeTicker(bEl, { type: 'typewriter' });

    a.pause();
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);

    a.play();
    expect(a.paused).toBe(false);
    expect(b.paused).toBe(false);
  });

  it('routes toggle clicks to their own instance and emits the v1 event', () => {
    document.body.innerHTML = `
      <ul id="a"><li>1</li><li>2</li></ul>
      <button id="ta">toggle a</button>
      <button id="tb">toggle b</button>
      <ul id="b"><li>1</li><li>2</li></ul>`;
    const aEl = document.getElementById('a') as HTMLElement;
    const bEl = document.getElementById('b') as HTMLElement;
    const { events, stop } = collectToggleEvents();

    const a = makeTicker(aEl, { type: 'vertical', controls: { toggle: '#ta' } });
    const b = makeTicker(bEl, { type: 'typewriter', controls: { toggle: '#tb' } });

    (document.getElementById('ta') as HTMLButtonElement).click();
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]?.ticker).toBe(aEl);
    expect(events[0]?.paused).toBe(true);

    (document.getElementById('tb') as HTMLButtonElement).click();
    expect(b.paused).toBe(true);
    expect(events).toHaveLength(2);
    expect(events[1]?.ticker).toBe(bEl);
    expect(events[1]?.paused).toBe(true);

    stop();
  });

  it('scopes hover pause to the hovered instance', () => {
    document.body.innerHTML =
      '<ul id="a"><li>1</li><li>2</li></ul><ul id="b"><li>1</li><li>2</li></ul>';
    const aEl = document.getElementById('a') as HTMLElement;
    const bEl = document.getElementById('b') as HTMLElement;

    const a = makeTicker(aEl, { type: 'vertical' });
    const b = makeTicker(bEl, { type: 'vertical' });

    aEl.dispatchEvent(new MouseEvent('mouseenter'));
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);

    aEl.dispatchEvent(new MouseEvent('mouseleave'));
    expect(a.paused).toBe(false);
    expect(b.paused).toBe(false);
  });

  it('emits the toggle event with the default paused state via public toggle()', () => {
    document.body.innerHTML = '<ul id="a"><li>1</li><li>2</li></ul>';
    const aEl = document.getElementById('a') as HTMLElement;
    const { events, stop } = collectToggleEvents();

    const a = makeTicker(aEl, { type: 'vertical' });

    a.toggle();
    expect(a.paused).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.paused).toBe(true);

    a.toggle();
    expect(a.paused).toBe(false);
    expect(events).toHaveLength(2);
    expect(events[0]?.paused).toBe(true);
    expect(events[1]?.paused).toBe(false);

    stop();
  });
});

describe('destroy isolation', () => {
  it('unwraps, unbinds controls, and leaves other instances untouched', () => {
    document.body.innerHTML = `
      <ul id="a"><li>1</li><li>2</li></ul>
      <button id="ta">toggle a</button>
      <ul id="b"><li>1</li><li>2</li></ul>`;
    const aEl = document.getElementById('a') as HTMLElement;
    const bEl = document.getElementById('b') as HTMLElement;
    const { events, stop } = collectToggleEvents();

    const a = makeTicker(aEl, { type: 'vertical', controls: { toggle: '#ta' } });
    const b = makeTicker(bEl, { type: 'typewriter' });

    a.destroy();
    expect(aEl.parentElement).toBe(document.body);

    (document.getElementById('ta') as HTMLButtonElement).click();
    expect(events).toHaveLength(0);

    b.pause();
    expect(b.paused).toBe(true);

    stop();
  });
});

describe('update()', () => {
  it('re-resolves and re-binds controls', () => {
    document.body.innerHTML = `
      <ul id="a"><li>1</li><li>2</li></ul>
      <button id="old">old</button>
      <button id="new">new</button>`;
    const aEl = document.getElementById('a') as HTMLElement;
    const { events, stop } = collectToggleEvents();

    const a = makeTicker(aEl, { type: 'vertical', controls: { toggle: '#old' } });

    a.update({ controls: { toggle: '#new' } });

    (document.getElementById('old') as HTMLButtonElement).click();
    expect(events).toHaveLength(0);

    (document.getElementById('new') as HTMLButtonElement).click();
    expect(events).toHaveLength(1);
    expect(events[0]?.paused).toBe(true);
    expect(a.paused).toBe(true);

    stop();
  });
});

describe('marquee control parity', () => {
  it('does not bind prev/next and does not preventDefault on toggle clicks', () => {
    document.body.innerHTML = `
      <ul id="m"><li>1</li><li>2</li></ul>
      <button id="prev">prev</button>
      <button id="toggle">toggle</button>`;
    const mEl = document.getElementById('m') as HTMLElement;
    const { events, stop } = collectToggleEvents();

    const m = makeTicker(mEl, {
      type: 'marquee',
      controls: { prev: '#prev', toggle: '#toggle' },
    });

    const prevEvent = new MouseEvent('click', { cancelable: true });
    (document.getElementById('prev') as HTMLElement).dispatchEvent(prevEvent);
    expect(prevEvent.defaultPrevented).toBe(false);

    const toggleEvent = new MouseEvent('click', { cancelable: true });
    (document.getElementById('toggle') as HTMLElement).dispatchEvent(toggleEvent);
    expect(toggleEvent.defaultPrevented).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]?.paused).toBe(true);
    expect(m.paused).toBe(true);

    stop();
  });

  it('prevents default on prev/next clicks for non-marquee types', () => {
    document.body.innerHTML = `
      <ul id="v"><li>1</li><li>2</li></ul>
      <button id="prev">prev</button>
      <button id="next">next</button>`;
    const vEl = document.getElementById('v') as HTMLElement;

    new AcmeTicker(vEl, {
      type: 'vertical',
      controls: { prev: '#prev', next: '#next' },
    });

    const prevEvent = new MouseEvent('click', { cancelable: true });
    (document.getElementById('prev') as HTMLElement).dispatchEvent(prevEvent);
    expect(prevEvent.defaultPrevented).toBe(true);

    const nextEvent = new MouseEvent('click', { cancelable: true });
    (document.getElementById('next') as HTMLElement).dispatchEvent(nextEvent);
    expect(nextEvent.defaultPrevented).toBe(true);
  });
});
