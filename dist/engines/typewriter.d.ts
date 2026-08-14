import type { TickerHost } from '../types.js';
import type { TickerEngine } from './index.js';
export declare class TypewriterEngine implements TickerEngine {
    private readonly host;
    private intervalID;
    private timeoutID;
    private typeEl;
    private wrapEl;
    private allText;
    private count;
    private stepCount;
    private completedCycles;
    constructor(host: TickerHost);
    init(): void;
    prev(): void;
    next(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    private start;
    private navigate;
    private arm;
    private clearInterval;
    private clearTimeout;
    private type;
    private tNext;
}
