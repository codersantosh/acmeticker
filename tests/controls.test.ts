import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindControls, bindHoverFocus, resolveControls } from '../src/controls';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('resolveControls', () => {
  it('resolves string selectors', () => {
    document.body.innerHTML = '<button class="t">t</button>';
    const resolved = resolveControls({ controls: { toggle: '.t' } });
    expect(resolved.toggle).toHaveLength(1);
    expect(resolved.toggle[0]?.className).toBe('t');
  });

  it('accepts a single element', () => {
    const btn = document.createElement('button');
    const resolved = resolveControls({ controls: { prev: btn } });
    expect(resolved.prev).toEqual([btn]);
  });

  it('accepts a NodeList', () => {
    document.body.innerHTML = '<button class="t">1</button><button class="t">2</button>';
    const nodes = document.querySelectorAll<HTMLElement>('.t');
    const resolved = resolveControls({ controls: { toggle: nodes } });
    expect(resolved.toggle).toHaveLength(2);
  });

  it('treats empty/missing targets as empty lists', () => {
    const resolved = resolveControls({ controls: {} });
    expect(resolved).toEqual({ prev: [], next: [], toggle: [] });
  });
});

describe('bindControls', () => {
  it('binds and unbinds click handlers', () => {
    const btn = document.createElement('button');
    const controls = resolveControls({ controls: { toggle: btn } });
    const onToggle = vi.fn();

    const unbind = bindControls(controls, { onToggle });

    btn.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(expect.any(Event));

    unbind();
    btn.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('skips callbacks that are not provided', () => {
    const prev = document.createElement('button');
    const next = document.createElement('button');
    const controls = resolveControls({ controls: { prev, next } });

    const unbind = bindControls(controls, { onToggle: vi.fn() });

    prev.click();
    next.click();
    unbind();
  });
});

describe('bindHoverFocus', () => {
  it('binds mouseenter/mouseleave and focusin/focusout when enabled', () => {
    const el = document.createElement('div');
    const handlers = {
      onHoverEnter: vi.fn(),
      onHoverLeave: vi.fn(),
      onFocusIn: vi.fn(),
      onFocusOut: vi.fn(),
    };

    const unbind = bindHoverFocus(
      el,
      { pauseOnHover: true, pauseOnFocus: true },
      handlers,
    );

    el.dispatchEvent(new MouseEvent('mouseenter'));
    expect(handlers.onHoverEnter).toHaveBeenCalledTimes(1);

    el.dispatchEvent(new MouseEvent('mouseleave'));
    expect(handlers.onHoverLeave).toHaveBeenCalledTimes(1);

    el.dispatchEvent(new FocusEvent('focusin'));
    expect(handlers.onFocusIn).toHaveBeenCalledTimes(1);

    el.dispatchEvent(new FocusEvent('focusout'));
    expect(handlers.onFocusOut).toHaveBeenCalledTimes(1);

    unbind();
    el.dispatchEvent(new MouseEvent('mouseenter'));
    expect(handlers.onHoverEnter).toHaveBeenCalledTimes(1);
  });

  it('binds nothing when both flags are disabled', () => {
    const el = document.createElement('div');
    const handlers = { onHoverEnter: vi.fn() };

    const unbind = bindHoverFocus(el, { pauseOnHover: false, pauseOnFocus: false }, handlers);

    el.dispatchEvent(new MouseEvent('mouseenter'));
    expect(handlers.onHoverEnter).not.toHaveBeenCalled();

    unbind();
  });
});
