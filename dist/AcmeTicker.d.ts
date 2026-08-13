import { type AcmeTickerOptions, type TickerHost } from './types';
export declare class AcmeTicker implements TickerHost {
    readonly element: HTMLElement;
    readonly wrap: HTMLElement;
    readonly options: AcmeTickerOptions;
    paused: boolean;
    rtl: boolean;
    private explicitPaused;
    private engine;
    private controls;
    private unbindControls;
    private unbindHoverFocus;
    constructor(element: HTMLElement, options?: Partial<AcmeTickerOptions>);
    play(): void;
    pause(): void;
    toggle(): void;
    next(): void;
    prev(): void;
    update(options: Partial<AcmeTickerOptions>): void;
    destroy(): void;
    emitToggle(paused: boolean): void;
    emitCycle(count: number): void;
    private bindControlHandlers;
    private bindInteractionHandlers;
    private handlePrev;
    private handleNext;
    private handleToggle;
    private applyInteractionPause;
}
