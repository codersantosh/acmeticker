import type { AcmeTickerOptions, TickerHost } from '../types.js';
export interface TickerEngine {
    init(): void;
    prev(): void;
    next(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}
export declare function createEngine(type: AcmeTickerOptions['type'], host: TickerHost): TickerEngine;
