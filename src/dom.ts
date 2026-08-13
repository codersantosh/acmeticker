function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function outerWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  return el.offsetWidth + parsePx(cs.marginLeft) + parsePx(cs.marginRight);
}

export function outerHeight(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  return el.offsetHeight + parsePx(cs.marginTop) + parsePx(cs.marginBottom);
}

export function requestFrame(callback: FrameRequestCallback): number {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
}

export function cancelFrame(id: number): void {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function createWrap(el: HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'acmeticker-wrap';
  wrap.style.position = 'relative';
  wrap.setAttribute('aria-live', 'off');
  wrap.setAttribute('role', 'region');
  el.before(wrap);
  wrap.appendChild(el);
  return wrap;
}

export function unwrap(el: HTMLElement, wrap: HTMLElement): void {
  if (wrap.parentNode && el.parentNode === wrap) {
    wrap.replaceWith(el);
  }
}

export function directLiChildren(el: HTMLElement): Array<HTMLElement> {
  return Array.from(el.querySelectorAll<HTMLElement>(':scope > li'));
}

export function hideAllButFirst(el: HTMLElement): void {
  for (const li of directLiChildren(el).slice(1)) {
    li.style.display = 'none';
  }
}
