export interface RafMock {
  step(ms: number): void;
  pendingFrames(): number;
  restore(): void;
}

export function mockRaf(): RafMock {
  const originalRaf = globalThis.requestAnimationFrame;
  const originalCaf = globalThis.cancelAnimationFrame;
  let clock = 0;
  let nextId = 1;
  const pending = new Map<number, FrameRequestCallback>();

  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = nextId++;
    pending.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id: number): void => {
    pending.delete(id);
  };

  return {
    step: (ms: number): void => {
      clock += ms;
      const callbacks = Array.from(pending.values());
      pending.clear();
      for (const callback of callbacks) {
        callback(clock);
      }
    },
    pendingFrames: (): number => pending.size,
    restore: (): void => {
      globalThis.requestAnimationFrame = originalRaf;
      globalThis.cancelAnimationFrame = originalCaf;
    },
  };
}

export function mockSize(el: HTMLElement, width: number, height: number): void {
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
}
