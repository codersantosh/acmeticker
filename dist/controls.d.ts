import type { AcmeTickerOptions } from './types';
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
export declare function resolveControls(options: Pick<AcmeTickerOptions, 'controls'>): ResolvedControls;
export declare function bindControls(controls: ResolvedControls, callbacks: ControlCallbacks): () => void;
export interface HoverFocusHandlers {
    onHoverEnter?: () => void;
    onHoverLeave?: () => void;
    onFocusIn?: () => void;
    onFocusOut?: () => void;
}
export declare function bindHoverFocus(el: HTMLElement, options: Pick<AcmeTickerOptions, 'pauseOnHover' | 'pauseOnFocus'>, handlers: HoverFocusHandlers): () => void;
