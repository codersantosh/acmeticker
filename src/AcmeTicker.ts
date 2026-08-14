import {
  bindControls,
  bindHoverFocus,
  resolveControls,
  type ControlCallbacks,
  type ResolvedControls,
} from './controls.js';
import { createWrap, directLiChildren, hideAllButFirst, prefersReducedMotion, resolveRTL, unwrap } from './dom.js';
import { createEngine, type TickerEngine } from './engines/index.js';
import { DEFAULTS, type AcmeTickerOptions, type TickerHost } from './types.js';

const instances = new WeakMap<HTMLElement, AcmeTicker>();

export class AcmeTicker implements TickerHost {
  readonly element: HTMLElement;
  readonly wrap: HTMLElement;
  readonly options: AcmeTickerOptions;
  paused: boolean;
  rtl: boolean;

  private explicitPaused = false;
  private isDestroyed = false;
  private isHoverPaused = false;
  private isFocusPaused = false;
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
    this.explicitPaused = this.paused;
    this.rtl = resolveRTL(this.options.rtl, this.element);
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
    this.explicitPaused = false;
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.engine.resume();
  }

  pause(): void {
    this.explicitPaused = true;
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
    this.rtl = resolveRTL(this.options.rtl, this.element);

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
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.engine.destroy();
    this.unbindControls();
    this.unbindHoverFocus();
    for (const li of directLiChildren(this.element)) {
      li.style.display = '';
    }
    if (instances.get(this.element) === this) {
      instances.delete(this.element);
    }
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
      onHoverEnter: () => this.updateInteractionPause(true, this.isFocusPaused),
      onHoverLeave: () => this.updateInteractionPause(false, this.isFocusPaused),
      onFocusIn: () => this.updateInteractionPause(this.isHoverPaused, true),
      onFocusOut: () => this.updateInteractionPause(this.isHoverPaused, false),
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

  private updateInteractionPause(hover: boolean, focus: boolean): void {
    this.isHoverPaused = hover;
    this.isFocusPaused = focus;
    if (this.options.type === 'marquee') {
      if (hover || focus) {
        this.engine.pause();
      } else {
        this.engine.resume();
      }
      return;
    }
    if (this.explicitPaused) {
      return;
    }
    const paused = hover || focus;
    if (this.paused === paused) {
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
