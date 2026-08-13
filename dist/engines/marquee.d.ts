import type { TickerHost } from '../types';
import type { TickerEngine } from './index';
export declare class MarqueeEngine implements TickerEngine {
    private readonly host;
    private readonly directionRight;
    private readonly speed;
    private rafID;
    private position;
    private listWidth;
    private wrapWidth;
    private originalCount;
    private legFrom;
    private legTo;
    private legDuration;
    private startTs;
    private completedCycles;
    constructor(host: TickerHost);
    init(): void;
    prev(): void;
    next(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    private startLeg;
    private readonly frame;
    private legComplete;
    private applyTransform;
}
