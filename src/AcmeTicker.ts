import {
  bindControls,
  bindHoverFocus,
  resolveControls,
  type ControlCallbacks,
  type ResolvedControls,
} from './controls';
import { createWrap, directLiChildren, hideAllButFirst, prefersReducedMotion, unwrap } from './dom';
import { createEngine, type TickerEngine } from './engines';
import { DEFAULTS, type AcmeTickerOptions, type TickerHost } from './types';

const instances = new WeakMap<HTMLElement, AcmeTicker>();

export class AcmeTicker implements TickerHost {
  readonly element: HTMLElement;
  readonly wrap: HTMLElement;
  readonly options: AcmeTickerOptions;
  paused: boolean;

  private engine: TickerEngine;
  private controls: ResolvedControls;
  private unbindControls: () => void;
  private unbindHoverFocus: () => void;

  constructor(element: HTMLElement, options?: Partial<AcmeTickerOptions>) {
    const existing = instances.get(element);
    if (existing) {
      existing.destroy();
    }

    this.element = element;
    this.options = mergeOptions(options);
    this.paused = prefersReducedMotion();
    this.wrap = createWrap(this.element);
    hideAllButFirst(this.element);

    this.controls = resolveControls(this.options);
    this.unbindControls = this.bindControlHandlers();
    this.unbindHoverFocus = this.bindInteractionHandlers();

    this.engine = createEngine(this.options.type, this);
    instances.set(element, this);
    this.engine.init();
  }

  play(): void {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.engine.resume();
  }

  pause(): void {
    if (this.paused) {
      return;
    }
    this.paused = true;
    this.engine.pause();
  }

  toggle(): void {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
    this.emitToggle(this.paused);
  }

  next(): void {
    this.engine.next();
  }

  prev(): void {
    this.engine.prev();
  }

  update(options: Partial<AcmeTickerOptions>): void {
    Object.assign(this.options, options, {
      controls: { ...this.options.controls, ...options?.controls },
    });

    this.unbindControls();
    this.unbindHoverFocus();

    this.controls = resolveControls(this.options);
    this.unbindControls = this.bindControlHandlers();
    this.unbindHoverFocus = this.bindInteractionHandlers();

    this.engine.destroy();
    hideAllButFirst(this.element);
    this.engine = createEngine(this.options.type, this);
    this.engine.init();
  }

  destroy(): void {
    this.engine.destroy();
    this.unbindControls();
    this.unbindHoverFocus();
    for (const li of directLiChildren(this.element)) {
      li.style.display = '';
    }
    instances.delete(this.element);
    unwrap(this.element, this.wrap);
  }

  emitToggle(paused: boolean): void {
    document.dispatchEvent(
      new CustomEvent('acmeTickerToggle', {
        detail: { ticker: this.element, paused },
      }),
    );
  }

  emitCycle(count: number): void {
    document.dispatchEvent(
      new CustomEvent('acmeTickerCycle', {
        detail: { ticker: this.element, count },
      }),
    );
  }

  private bindControlHandlers(): () => void {
    const isMarquee = this.options.type === 'marquee';
    const callbacks: ControlCallbacks = {
      onPrev: isMarquee ? undefined : (e) => this.handlePrev(e),
      onNext: isMarquee ? undefined : (e) => this.handleNext(e),
      onToggle: (e) => this.handleToggle(e),
    };
    return bindControls(this.controls, callbacks);
  }

  private bindInteractionHandlers(): () => void {
    return bindHoverFocus(this.element, this.options, {
      onHoverEnter: () => this.applyInteractionPause(true),
      onHoverLeave: () => this.applyInteractionPause(false),
      onFocusIn: () => this.applyInteractionPause(true),
      onFocusOut: () => this.applyInteractionPause(false),
    });
  }

  private handlePrev(e: Event): void {
    e.preventDefault();
    this.engine.prev();
  }

  private handleNext(e: Event): void {
    e.preventDefault();
    this.engine.next();
  }

  private handleToggle(e: Event): void {
    if (this.options.type !== 'marquee') {
      e.preventDefault();
    }
    this.toggle();
  }

  private applyInteractionPause(paused: boolean): void {
    if (this.options.type === 'marquee') {
      if (paused) {
        this.engine.pause();
      } else {
        this.engine.resume();
      }
      return;
    }
    this.paused = paused;
    if (paused) {
      this.engine.pause();
    } else {
      this.engine.resume();
    }
  }
}

function mergeOptions(options?: Partial<AcmeTickerOptions>): AcmeTickerOptions {
  return {
    ...DEFAULTS,
    ...options,
    controls: {
      ...DEFAULTS.controls,
      ...options?.controls,
    },
  };
}
