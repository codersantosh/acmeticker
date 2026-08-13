import type { AcmeTickerOptions, ControlTarget } from './types';

export interface ResolvedControls {
  prev: Array<HTMLElement>;
  next: Array<HTMLElement>;
  toggle: Array<HTMLElement>;
}

export interface ControlCallbacks {
  onPrev?: (event: Event) => void;
  onNext?: (event: Event) => void;
  onToggle?: (event: Event) => void;
}

function toElements(target: ControlTarget): Array<HTMLElement> {
  if (!target) {
    return [];
  }
  if (typeof target === 'string') {
    return Array.from(document.querySelectorAll<HTMLElement>(target));
  }
  if (target instanceof HTMLElement) {
    return [target];
  }
  return Array.from(target);
}

export function resolveControls(options: Pick<AcmeTickerOptions, 'controls'>): ResolvedControls {
  return {
    prev: toElements(options.controls.prev),
    next: toElements(options.controls.next),
    toggle: toElements(options.controls.toggle),
  };
}

type HandlerEntry = [HTMLElement, string, (event: Event) => void];

export function bindControls(controls: ResolvedControls, callbacks: ControlCallbacks): () => void {
  const handlers: Array<HandlerEntry> = [];

  const bind = (
    els: Array<HTMLElement>,
    type: string,
    callback: ((event: Event) => void) | undefined,
  ): void => {
    if (!callback) {
      return;
    }
    for (const el of els) {
      const handler = (event: Event): void => {
        callback(event);
      };
      el.addEventListener(type, handler);
      handlers.push([el, type, handler]);
    }
  };

  bind(controls.prev, 'click', callbacks.onPrev);
  bind(controls.next, 'click', callbacks.onNext);
  bind(controls.toggle, 'click', callbacks.onToggle);

  return () => {
    for (const [el, type, handler] of handlers) {
      el.removeEventListener(type, handler);
    }
    handlers.length = 0;
  };
}

export interface HoverFocusHandlers {
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onFocusIn?: () => void;
  onFocusOut?: () => void;
}

export function bindHoverFocus(
  el: HTMLElement,
  options: Pick<AcmeTickerOptions, 'pauseOnHover' | 'pauseOnFocus'>,
  handlers: HoverFocusHandlers,
): () => void {
  const binds: Array<[HTMLElement, string, EventListener]> = [];

  if (options.pauseOnHover) {
    if (handlers.onHoverEnter) {
      binds.push([el, 'mouseenter', handlers.onHoverEnter]);
    }
    if (handlers.onHoverLeave) {
      binds.push([el, 'mouseleave', handlers.onHoverLeave]);
    }
  }
  if (options.pauseOnFocus) {
    if (handlers.onFocusIn) {
      binds.push([el, 'focusin', handlers.onFocusIn]);
    }
    if (handlers.onFocusOut) {
      binds.push([el, 'focusout', handlers.onFocusOut]);
    }
  }

  for (const [target, type, handler] of binds) {
    target.addEventListener(type, handler);
  }

  return () => {
    for (const [target, type, handler] of binds) {
      target.removeEventListener(type, handler);
    }
  };
}
